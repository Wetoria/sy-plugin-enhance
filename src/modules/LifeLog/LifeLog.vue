<template></template>

<script setup lang="ts">
import { onMounted, watchEffect } from 'vue';
import { queryAllByDom } from '@/utils/DOM';
import { usePlugin } from '@/main';
import { useSettings } from '@/logic/Settings';

const plugin = usePlugin()

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
  });
  observer.observe(document.body, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: true, // 观察后代节点，默认为 false
  })
}

onMounted(() => {
  markLifeLogBlock()
  listenerSticky();
})

const settings = useSettings()
watchEffect(() => {
  document.documentElement.dataset.enhancerEnableLifelogTag = `${settings.value.lifelogEnableBlockTag}`
  document.documentElement.dataset.enhancerIsMobile = `${plugin.isMobile}`
})
</script>


<script lang="ts">

import { EnhanceIOperation, SyDomNodeTypes, onEditorUpdate } from '../../utils/Siyuan'
import { getBlockAttrs, request, setBlockAttrs } from '@/api'
import { getFrontend } from 'siyuan'
import dayjs from 'dayjs'

const lifelogPrefix = 'custom-lifelog-'
const lifelogAttrTime = `${lifelogPrefix}time`
const lifelogAttrType = `${lifelogPrefix}type`
const lifelogAttrContent = `${lifelogPrefix}content`
const lifelogAttrCreated = `${lifelogPrefix}created`
const lifelogAttrUpdated = `${lifelogPrefix}updated`

export function markLifeLogBlock() {
  const settings = useSettings()

  const plugin = usePlugin()

  onEditorUpdate(async (operations: EnhanceIOperation[]) => {
    let optList = operations.filter(i => i.text)
    optList.sort((a, b) => a.timestamp - b.timestamp)

    const optMap = {}

    optList.forEach((opt: EnhanceIOperation) => {
      optMap[opt.id] = opt
    })

    optList = Object.values(optMap)
    optList = optList.filter(i => i.nodeType === SyDomNodeTypes.NodeParagraph)


    const records: LifeLogItem[] = []
    for (const opt of optList) {
      const blockAttrs = await getBlockAttrs(opt.id)

      const synced = lifelogAttrType in blockAttrs

      const content = opt.text

      // const isLifeLogParagraph = /^\d{2}:\d{2}\s+/.test(content)
      const isLifeLogParagraph = /^\d{2}:\d{2}\s+.*?🫧$/.test(content)
      if (!isLifeLogParagraph) {
        return
      }
      const time = (content.match(/^\d{2}:\d{2}/) || [])[0]
      const elseContent = content.replace(/^\d{2}:\d{2}\s+/, '').replace('🫧', '')

      if (!elseContent) {
        return
      }
      let colonIndex = elseContent.indexOf('：')
      colonIndex = colonIndex < 0 ? elseContent.length : colonIndex
      const logType = elseContent.substring(0, colonIndex)
      const logContent = elseContent.substring(colonIndex + 1, elseContent.length)

      let createdTime = blockAttrs[lifelogAttrCreated]
      const isFirstCreate = !(createdTime)
      if (isFirstCreate) {
        createdTime = dayjs().format('YYYY/MM/DD HH:mm:ss')
      }
      let updatedTime = dayjs().format('YYYY/MM/DD HH:mm:ss')

      if (!synced) {
        records.push({
          time,
          type: logType,
          content: logContent,
          syBlockId: opt.id,
          isMobile: plugin.isMobile,
          created: createdTime,
          updated: updatedTime,
        })
      }

      setBlockAttrs(opt.id, {
        [lifelogAttrTime]: time,
        [lifelogAttrType]: logType,
        [lifelogAttrContent]: logContent,
        [lifelogAttrCreated]: createdTime,
        [lifelogAttrUpdated]: updatedTime,
      })
    }

    const settings = useSettings()
    const lifelogPostUrl = settings.value.lifelogPostUrl
    if (!lifelogPostUrl) {
      return
    }

    if (!records.length) {
      return
    }

    const frontEnd = getFrontend();

    if (!plugin.isMobile || frontEnd === "mobile") {
      request(
        lifelogPostUrl + `?data=${encodeURIComponent(JSON.stringify(records))}`,
        {
          data: records,
        }
      ).catch((err) => {
        console.error('[Enhance]| LifeLog Post Error: ', err)
      })
    }

  }, settings.value.lifelogTriggerTime * 1000)
}

</script>

<style>
html[data-enhancer-enable-lifelog-tag="true"] {
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

  &[data-enhancer-is-mobile="true"] {
    [custom-lifelog-type] {
      /* 解决吸顶以后，依旧能看到下方内容的问题 */
      background-color: var(--b3-theme-background);
      &.en-stickied {
        top: -4px;
      }
    }
  }
  &[data-enhancer-is-mobile="false"] {
    [custom-lifelog-type] {
      /* 解决吸顶以后，依旧能看到下方内容的问题 */
      background-color: var(--b3-theme-background);
      &.en-stickied {
        top: -0px;
      }
    }
  }
}
</style>
