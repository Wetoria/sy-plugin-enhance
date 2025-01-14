<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem>
      <div>
        启用 LifeLog 相关功能
      </div>
      <template #desc>
        <div>
          是否启动 LifeLog 功能。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableLifeLog" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        显示 LifeLog 段落标记
      </div>
      <template #desc>
        <div>
          是否显示 LifeLog 的标记，并自动吸顶。
        </div>
        <div>
          吸顶：在编辑区顶部，最新一条 LifeLog 会在顶部吸附。当 DailyNote 内容较多时，可以方便地知道，上一条记录是什么时候、做了什么事。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.showLifeLogFlag" />
      </template>
    </EnSettingsItem>

  </EnSettingsTeleportModule>
  <template v-if="moduleOptions.enabled">

  </template>
</template>

<script lang="ts">
import {
  batchGetBlockAttrs,
  batchSetBlockAttrs,
  flushTransactions,
  sql,
} from '@/api'
import { usePlugin } from '@/main'
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import { moduleEnableStatusSwitcher } from '@/utils'
import { queryAllByDom } from '@/utils/DOM'
import { getColorStringWarn } from '@/utils/Log'
import dayjs from 'dayjs'
import { Protyle } from 'siyuan'
import {
  onBeforeUnmount,
  onMounted,
  watchEffect,
} from 'vue'
import EnSettingsItem from '../../modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '../../modules/Settings/EnSettingsTeleportModule.vue'
import {
  EnhanceIOperation,
  onEditorUpdate,
  SyDomNodeTypes,
} from '../../utils/Siyuan'
import { reloadLifeLogData } from './EnLifeLogDailyNoteGraph.vue'

const lifelogPrefix = 'custom-lifelog-'
const lifelogAttrTime = `${lifelogPrefix}time`
const lifelogAttrDate = `${lifelogPrefix}date`
const lifelogAttrType = `${lifelogPrefix}type`
const lifelogAttrContent = `${lifelogPrefix}content`
const lifelogAttrCreated = `${lifelogPrefix}created`
const lifelogAttrUpdated = `${lifelogPrefix}updated`

export interface ILifeLog {
  [lifelogAttrTime]: string
  [lifelogAttrDate]: string
  [lifelogAttrType]: string
  [lifelogAttrContent]: string
  [lifelogAttrCreated]: string
  [lifelogAttrUpdated]: string
}
</script>

<script setup lang="ts">

const plugin = usePlugin()

// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule {
  enableLifeLog: boolean
  showLifeLogFlag: boolean
}

const {
  module,
  moduleOptions,
} = useModule<ISettingModuleOptions>('EnLifeLog', {
  defaultData: {
    enabled: false,
    moduleName: 'EnLifeLog',
    moduleDisplayName: 'LifeLog',

    enableLifeLog: false,
    showLifeLogFlag: false,
  },
})
// #endregion 基本的模块配置


const listenerSticky = () => {
  const map = new WeakMap()

  const handler = (scrollArea) => {
    const paragraphList = queryAllByDom(scrollArea, '[data-type="NodeParagraph"][custom-lifelog-time]')

    let flag = true
    paragraphList.reverse()
    paragraphList.forEach((p: HTMLElement) => {

      const pRect = p.getBoundingClientRect()
      const sRect = scrollArea.getBoundingClientRect()

      if (pRect.top <= sRect.top && flag) {
        p.classList.toggle('en-stickied', true)
        p.style.borderLeft = getComputedStyle(p).borderBottom
        p.style.borderRight = getComputedStyle(p).borderBottom
        flag = false
      } else {
        p.classList.toggle('en-stickied', false)
        p.style.borderLeft = ''
        p.style.borderRight = ''
      }
    })
  }
  const observer = new MutationObserver(() => {
    const protyleContentList = queryAllByDom(document.body, '.protyle-content')
    protyleContentList.forEach((item: HTMLElement) => {
      if (map.has(item)) {
        return
      }

      item.addEventListener('scroll', () => {
        handler(item)
      })
      map.set(item, true)
    })
  })
  observer.observe(document.body, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: true, // 观察后代节点，默认为 false
  })
}

onMounted(() => {
  markLifeLogBlock()
  listenerSticky()
})

const insertCurrentTimeSlas = {
  filter: [
    "add current time",
    'insert current time',
    "插入当前时间",
    'adt',
    'df now',
    'now',
  ],
  html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${'叶归｜插入当前时间'}</span></div>`,
  id: "enInsertCurrentTime",
  callback(protyle: Protyle) {
    const timestamp = dayjs().format('HH:mm')
    protyle.insert(timestamp)
  },
}
onMounted(() => {
  plugin.protyleSlash.push(insertCurrentTimeSlas)
})
onBeforeUnmount(() => {
  plugin.protyleSlash = plugin.protyleSlash.filter((i) => i.id !== insertCurrentTimeSlas.id)
})


watchEffect(() => {
  moduleEnableStatusSwitcher('EnableLifelogTag', moduleOptions.value.showLifeLogFlag)
})

function markLifeLogBlock() {

  onEditorUpdate(async (operations: EnhanceIOperation[]) => {
    let optList = operations.filter((i) => i.text)
    optList.sort((a, b) => a.timestamp - b.timestamp)

    const optMap = {}

    optList.forEach((opt: EnhanceIOperation) => {
      optMap[opt.id] = opt
    })

    optList = Object.values(optMap)
    optList = optList.filter((i) => i.nodeType === SyDomNodeTypes.NodeParagraph)

    if (!optList.length) {
      enWarn(`LifeLog watched no paragraph`)
      return
    }

    enLog(`${getColorStringWarn('LifeLog watched paragraph list changed: ')}`, optList)

    const validParagraphList: Array<EnhanceIOperation & {
      content: string
      time: string
      contentWithoutTime: string
    }> = []


    // 先在前端进行过滤，防止频繁的请求后端
    optList.forEach((opt) => {
      const content = opt.text

      // const isLifeLogParagraph = /^\d{2}:\d{2}\s+/.test(content)
      const isLifeLogParagraph = /^\d{2}:\d{2}(:\d{2})?\s+(?:\S[^\n\r]*)?$/.test(content)

      if (!isLifeLogParagraph) {
        enLog(`${getColorStringWarn('LifeLog is not a valid paragraph: ')}`, opt)
        return
      }
      const time = (content.match(/^\d{2}:\d{2}(:\d{2})?/) || [])[0]

      let dom = document.createElement('div')
      dom.innerHTML = opt.data
      dom = dom.firstElementChild as HTMLDivElement
      const editDom = dom.firstElementChild
      const isPureTimeStart = editDom.innerHTML.trim().startsWith(time)

      if (!isPureTimeStart) {
        enLog('LifeLog is not start with pure time')
        return
      }

      const contentWithoutTime = content.replace(/^\d{2}:\d{2}(:\d{2})?\s+/, '')
      if (!contentWithoutTime) {
        enLog('LifeLog only has time')
        return
      }

      validParagraphList.push({
        ...opt,
        content,
        time,
        contentWithoutTime,
      })
    })



    if (!validParagraphList.length) {
      enWarn(`LifeLog module found no valid paragraph.`)
      return
    }



    // flush sqlite，防止数据库里没更新相关内容
    enWarn(`LifeLog module ready to flush transactions. In order to confirm the changes, please wait for a moment.`)
    await flushTransactions()



    const blockIds = validParagraphList.map((i) => i.id)

    const blockAttrsRes = await batchGetBlockAttrs(blockIds)

    const newBlockAttrs = []

    for (const opt of validParagraphList) {
      const blockAttrs = blockAttrsRes[opt.id]

      let colonIndex = opt.contentWithoutTime.indexOf('：')
      colonIndex = colonIndex < 0 ? opt.contentWithoutTime.length : colonIndex

      const logType = opt.contentWithoutTime.substring(0, colonIndex)
      const logContent = opt.contentWithoutTime.substring(colonIndex + 1, opt.contentWithoutTime.length)

      let createdTime = blockAttrs[lifelogAttrCreated]
      let date = blockAttrs[lifelogAttrDate]
      const isFirstCreate = !(createdTime)
      if (isFirstCreate) {
        createdTime = dayjs().format('YYYY/MM/DD HH:mm:ss')
      }
      const updatedTime = dayjs().format('YYYY/MM/DD HH:mm:ss')

      if (!date) {
        // 如果没有LifeLog的日期，需要按照DailyNote的日期来设置
        const sqlStmt = `
          select
            b.id,
            b.name,
            b.fcontent,
            b.type,
            a.id attr_id,
            a.name attr_name,
            a.value attr_value
          from blocks b
          left join attributes a on b.id = a.block_id
          where b.id in (select root_id from blocks where id = '${opt.id}')
          and a.name like 'custom-dailynote-%'
          order by a.name desc
          limit 1
        `
        const res = await sql(sqlStmt)

        // 没查到 Daily Note 文档的话，不算做 LifeLog
        if (!res[0]?.attr_value) {
          enLog(`${getColorStringWarn('LifeLog record is not in a daily note: ')}`, opt)
          continue
        }
        date = dayjs(res[0]?.attr_value).format('YYYY/MM/DD')
      }

      const newResult = {
        [lifelogAttrTime]: opt.time,
        [lifelogAttrDate]: date,
        [lifelogAttrType]: logType,
        [lifelogAttrContent]: logContent,
        [lifelogAttrCreated]: createdTime,
        [lifelogAttrUpdated]: updatedTime,
      }

      newBlockAttrs.push({
        id: opt.id,
        attrs: newResult,
      })
    }
    await batchSetBlockAttrs(newBlockAttrs)
    reloadLifeLogData('reload')
  }, 1000)
}

</script>

<style>
html[data-en_enabled_module~="EnableLifelogTag"] {
  --en-lifelog-固: #D3D3D3;
  --en-lifelog-固定: #D3D3D3;

  --en-lifelog-增: #90EE90;
  --en-lifelog-学习: #90EE90;
  --en-lifelog-事业: #90EE90;

  --en-lifelog-工作: #FFD700;

  --en-lifelog-废: #FF0000;
  --en-lifelog-娱乐: #FF0000;
  --en-lifelog-荒废: #FF0000;
  --en-lifelog-玩: #FF0000;

  --en-lifelog-家: rgb(71, 255, 248);
  --en-lifelog-家庭: rgb(71, 255, 248);

  --en-lifelog-友: rgb(156, 123, 85);
  --en-lifelog-朋友: rgb(156, 123, 85);


  .enLifeLogStickyContainer {
    position: absolute;
    top: 30px;
    width: 100%;
    height: max-content;
    box-sizing: border-box;
    z-index: 2;
  }

  & [data-type="NodeParagraph"] {

    &[custom-lifelog-type] {
      z-index: 2;
      &.en-stickied {
        position: sticky;
      }
    }

    &[custom-lifelog-type="固"] {
      border-bottom: 1px solid #D3D3D3;
    }
    &[custom-lifelog-type="固定"] {
      border-bottom: 1px solid #D3D3D3;
    }

    &[custom-lifelog-type="增"] {
      border-bottom: 1px solid #90EE90;
    }
    &[custom-lifelog-type="学习"] {
      border-bottom: 1px solid #90EE90;
    }

    &[custom-lifelog-type="事业"] {
      border-bottom: 1px solid #90EE90;
    }

    &[custom-lifelog-type="工作"] {
      border-bottom: 1px solid #FFD700;
    }

    &[custom-lifelog-type="废"] {
      border-bottom: 1px solid #FF0000;
    }
    &[custom-lifelog-type="娱乐"] {
      border-bottom: 1px solid #FF0000;
    }
    &[custom-lifelog-type="荒废"] {
      border-bottom: 1px solid #FF0000;
    }
    &[custom-lifelog-type="玩"] {
      border-bottom: 1px solid #FF0000;
    }

    &[custom-lifelog-type="家庭"] {
      border-bottom: 1px solid rgb(71, 255, 248);
    }
    &[custom-lifelog-type="家"] {
      border-bottom: 1px solid rgb(71, 255, 248);
    }
    &[custom-lifelog-type="朋友"] {
      border-bottom: 1px solid rgb(156, 123, 85);
    }
    &[custom-lifelog-type="友"] {
      border-bottom: 1px solid rgb(156, 123, 85);
    }

  }

  & {
    [custom-lifelog-type] {
      /* 解决吸顶以后，依旧能看到下方内容的问题 */
      background-color: var(--b3-theme-background);
      &.en-stickied {
        top: -0px;
      }
    }
  }
  &[data-en_enabled_module~="EnhancerIsMobile"] {
    [custom-lifelog-type] {
      &.en-stickied {
        top: -4px;
      }
    }
  }
}
</style>
