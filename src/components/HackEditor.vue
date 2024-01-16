<template>

</template>

<script setup lang="ts">
import { useSettings } from '@/logic/Settings';
import { debounce } from '@/utils';
import { queryAllByDom } from '@/utils/DOM';
import { SyDomNodeTypes } from '@/utils/Siyuan';
import dayjs from 'dayjs';
import { onMounted, watchEffect } from 'vue';

function insertBlockTime() {
  const handler = () => {
    const paragraphList = queryAllByDom(document.body, `[data-type="${SyDomNodeTypes.NodeParagraph}"]`)
    paragraphList.forEach((dom: HTMLDivElement) => {
      const updateTimeStr = dom.getAttribute('updated')
      const nodeId = dom.dataset.nodeId
      const createdInId = nodeId.split('-')[0]
      dom.setAttribute('created', createdInId)
      const created = dayjs(createdInId)
      dom.dataset.enCreated = created.format('YYYY/MM/DD HH:mm:ss')
      if (!updateTimeStr) {
        return
      }
      if (updateTimeStr == dom.dataset.enUpdatedBackup) {
        return
      }
      const text = dom?.firstChild?.textContent
      if (!text.trim()) {
        return
      }

      const updated = dayjs(updateTimeStr)
      const currentTime = dayjs()

      dom.dataset.enUpdatedBackup = updateTimeStr
      dom.dataset.enUpdated = updated.format('YYYY/MM/DD HH:mm:ss')
      dom.dataset.enFormat = '    /  /     :  :  '
      // TODO 时间增加参数控制
      if (currentTime.subtract(5, 'minute').isAfter(created)) {
        dom.dataset.enLocked = 'true'
        const editableDiv = dom.querySelector('div')
        editableDiv.contentEditable = 'false'
        editableDiv.dataset.enLocked = 'true'
        // if (editableDiv.dataset.enBindedClick !== 'true') {

        //   let count = 0
        //   editableDiv.addEventListener('click', () => {
        //     count++
        //     if (count >= 3) {
        //       editableDiv.dataset.enLocked = 'false'
        //       editableDiv.contentEditable = 'true'
        //     }
        //     setTimeout(() => {

        //     })
        //     setTimeout(() => {
        //       count = 0
        //       editableDiv.dataset.enLocked = 'true'
        //       editableDiv.contentEditable = 'false'
        //     }, 5 * 60 * 1000)
        //     // }, 3 * 1000)
        //   })
        //   editableDiv.addEventListener('input', () => {
        //     console.log('inputed')
        //   })
        //   editableDiv.dataset.enBindedClick = 'true'
        // }
      }
    })
  }

  handler()
  const observer = new MutationObserver(debounce(handler, 100));
  observer.observe(document.documentElement, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: true, // 观察后代节点，默认为 false
    attributes: true,
  })
}

const settings = useSettings()
watchEffect(() => {
  const isEnableBlockTime = settings.value.enableBlockTime
  document.documentElement.dataset.enhancerEnableBlockTime = `${isEnableBlockTime}`
  if (isEnableBlockTime) {
    document.documentElement.style.setProperty('--timeFontSize', `${settings.value.blockTimeFontSize}px`)
  }
})

onMounted(() => {
  insertBlockTime();
})
</script>

<style lang="scss">
html[data-enhancer-enable-block-time="true"] {
  --topPos: 3px;
  --timeFontSize: 9px;
  --letterSpacing: 3px;
  --rightPos: 0px;
  --v-divider-color: var(--sky-blue);

  div[data-type="NodeParagraph"],
  div[data-type="NodeHeading"],
  div[data-type="NodeTable"]
  {

    padding-top: calc(var(--timeFontSize)) !important;

    &[updated]::before,
    &[updated]::after {
      position: absolute;
      height: var(--timeFontSize);
      right: var(--rightPos);
      top: var(--topPos);
      font-size: var(--timeFontSize);
      line-height: var(--timeFontSize);

      font-family: monospace;

      display: flex;
      justify-content: flex-end;

      color: #d1d1d1;
      font-weight: normal;
    }
    &[updated]::before {
      content: attr(data-en-created);
    }
    &[updated]::after {
      content: attr(data-en-format);
      white-space: pre;
      color: var(--v-divider-color);
    }
  }

  div[data-type="NodeListItem"] {
    padding-top: calc(var(--timeFontSize)) !important;
    --topPos: calc(var(--timeFontSize) * -1);

    & .protyle-action {
      top: calc(var(--timeFontSize) / 2) !important;
    }

    & div[data-type="NodeParagraph"],
    & div[data-type="NodeHeading"],
    & div[data-type="NodeTable"] {
      --rightPos: -4px;
      padding-top: unset !important;
    }
  }
}

.block-focus {
  border-right: 1px solid var(--sky-blue);
}

</style>
