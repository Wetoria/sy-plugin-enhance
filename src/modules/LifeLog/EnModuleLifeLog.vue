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
        <a-switch v-model="moduleOptions.enableMarker" />
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

<script setup lang="ts">
import { usePlugin } from '@/main'
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import { markLifeLogBlock } from '@/modules/LifeLog/LifeLog'
import { moduleEnableStatusSwitcher } from '@/utils'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { queryAllByDom } from '@/utils/DOM'
import dayjs from 'dayjs'
import { Protyle } from 'siyuan'
import {
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from 'vue'
import EnSettingsItem from '../../modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '../../modules/Settings/EnSettingsTeleportModule.vue'

const plugin = usePlugin()

// #region 基本的模块配置

const {
  module,
  moduleOptions,
} = useModule<LifeLogModule>(EN_MODULE_LIST.LIFELOG, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.LIFELOG,
    moduleDisplayName: EN_CONSTANTS.LIFELOG_DISPLAY,

    enableMarker: false,
    showLifeLogFlag: false,
  },
})
// #endregion 基本的模块配置

const handler = (event: Event) => {
  const scrollArea = event.target as HTMLElement
  const paragraphList = queryAllByDom(scrollArea, '[data-type="NodeParagraph"][custom-lifelog-time]')

  let flag = true
  paragraphList.reverse()
  paragraphList.forEach((p: HTMLElement) => {

    const pRect = p.getBoundingClientRect()
    const sRect = scrollArea.getBoundingClientRect()

    if (pRect.top <= sRect.top && flag) {
      p.classList.toggle('en-stickied', true)
      flag = false
    } else {
      p.classList.toggle('en-stickied', false)
    }
  })
}

let observer = null
const bindedProtyleList = ref([])
const listenerSticky = () => {
  observer = new MutationObserver(() => {
    const protyleContentList = queryAllByDom(document.body, '.protyle-content')
    protyleContentList.forEach((item: HTMLElement) => {
      const exist = bindedProtyleList.value.find((i) => i === item)
      if (exist) {
        return
      }

      item.addEventListener('scroll', handler)
      bindedProtyleList.value.push(item)
    })
  })
  observer.observe(document.body, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: true, // 观察后代节点，默认为 false
  })
}
const offListenerSticky = () => {
  observer?.disconnect()
  observer = null
  bindedProtyleList.value.forEach((item) => {
    item.removeEventListener('scroll', handler)
  })
  bindedProtyleList.value = []
}


watchEffect((onCleanup) => {
  moduleEnableStatusSwitcher('EnableLifelogTag', moduleOptions.value.showLifeLogFlag)
  listenerSticky()
  onCleanup(() => {
    moduleEnableStatusSwitcher('EnableLifelogTag')
    offListenerSticky()
  })
})

let off = null
watchEffect((onCleanup) => {
  if (moduleOptions.value.enableMarker) {
    off = markLifeLogBlock()
  } else {
    off?.()
  }
  onCleanup(() => {
    off?.()
  })
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

  & [data-type="NodeParagraph"] {

    &[custom-lifelog-type] {
      --en-lifelog-border-style: 1px solid #D3D3D3;
      border-bottom: var(--en-lifelog-border-style);

      &.en-stickied {
        z-index: 2;
        position: sticky;
        border-left: var(--en-lifelog-border-style);
        border-right: var(--en-lifelog-border-style);
      }
    }

    &[custom-lifelog-type="固"] {
      --en-lifelog-border-style: 1px solid #D3D3D3;
    }
    &[custom-lifelog-type="固定"] {
      --en-lifelog-border-style: 1px solid #D3D3D3;
    }

    &[custom-lifelog-type="增"] {
      --en-lifelog-border-style: 1px solid #90EE90;
    }
    &[custom-lifelog-type="学习"] {
      --en-lifelog-border-style: 1px solid #90EE90;
    }

    &[custom-lifelog-type="事业"] {
      --en-lifelog-border-style: 1px solid #90EE90;
    }

    &[custom-lifelog-type="工作"] {
      --en-lifelog-border-style: 1px solid #FFD700;
    }

    &[custom-lifelog-type="废"] {
      --en-lifelog-border-style: 1px solid #FF0000;
    }
    &[custom-lifelog-type="娱乐"] {
      --en-lifelog-border-style: 1px solid #FF0000;
    }
    &[custom-lifelog-type="荒废"] {
      --en-lifelog-border-style: 1px solid #FF0000;
    }
    &[custom-lifelog-type="玩"] {
      --en-lifelog-border-style: 1px solid #FF0000;
    }

    &[custom-lifelog-type="家庭"] {
      --en-lifelog-border-style: 1px solid rgb(71, 255, 248);
    }
    &[custom-lifelog-type="家"] {
      --en-lifelog-border-style: 1px solid rgb(71, 255, 248);
    }
    &[custom-lifelog-type="朋友"] {
      --en-lifelog-border-style: 1px solid rgb(156, 123, 85);
    }
    &[custom-lifelog-type="友"] {
      --en-lifelog-border-style: 1px solid rgb(156, 123, 85);
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
