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
      const currentTime = dayjs()

      const updateTimeStr = dom.getAttribute('updated')
      const nodeId = dom.dataset.nodeId
      const createdInId = nodeId.split('-')[0]
      dom.setAttribute('created', createdInId)
      const created = dayjs(createdInId)
      dom.dataset.enCreated = created.format('YYYY/MM/DD HH:mm:ss')

      const initLock = !('enCanEdit' in dom.dataset)
      // TODO 时间增加参数控制
      if (currentTime.subtract(1, 'minute').isAfter(created) && initLock) {
        const editableDiv = dom.firstElementChild as HTMLDivElement
        // dom.dataset.enCanEdit = editableDiv.contentEditable = 'false'
      }

      // const bindedLockClick = dom.dataset.enBindedLockClick
      // if (!bindedLockClick) {
      //   let count = 0
      //   const resetCount = debounce(() => {
      //     count = 0
      //   })
      //   dom.addEventListener('click', () => {
      //     count++
      //     resetCount()

      //     if (count >= 2) {
      //       const nowIsCanEdit = dom.dataset.enCanEdit === 'true'
      //       const newCanEdit = !nowIsCanEdit
      //       const editableDiv = dom.firstElementChild as HTMLDivElement
      //       dom.dataset.enCanEdit = editableDiv.contentEditable = `${newCanEdit}`
      //       dom.dataset.enFormat = `${newCanEdit ? '🔓' : '🔒'}     /  /     :  :  `
      //     }
      //   })
      // }

      if (!updateTimeStr) {
        return
      }
      if (updateTimeStr == dom.dataset.enUpdatedBackup) {
        const canEdit = dom.dataset.enCanEdit === 'true'
        dom.dataset.enFormat = `${'enCanEdit' in dom.dataset ? (canEdit ? '🔓' : '🔒') : ''}     /  /     :  :  `
        return
      }
      const text = dom?.firstChild?.textContent
      if (!text.trim()) {
        return
      }

      const updated = dayjs(updateTimeStr)

      const canEdit = dom.dataset.enCanEdit === 'true'
      dom.dataset.enUpdatedBackup = updateTimeStr
      dom.dataset.enUpdated = updated.format('YYYY/MM/DD HH:mm:ss')
      dom.dataset.enFormat = `${'enCanEdit' in dom.dataset ? (canEdit ? '🔓' : '🔒') : ''}     /  /     :  :  `
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
  --bottomPos: 0px;
  --timeFontSize: 9px;
  --letterSpacing: 3px;
  --rightPos: 2px;
  --v-divider-color: var(--sky-blue);

  div[data-type="NodeParagraph"],
  div[data-type="NodeHeading"],
  div[data-type="NodeTable"]
  {

    // padding-top: calc(var(--timeFontSize)) !important;

    &[updated]::before,
    &[updated]::after {
      position: absolute;
      height: var(--timeFontSize);
      right: var(--rightPos);
      // top: var(--topPos);
      bottom: var(--bottomPos);
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
    // padding-top: calc(var(--timeFontSize)) !important;
    --topPos: calc(var(--timeFontSize) * -1);
    --bottomPos: -5px;

    & .protyle-action {
      // top: calc(var(--timeFontSize) / 2) !important;
    }

    & div[data-type="NodeParagraph"],
    & div[data-type="NodeHeading"],
    & div[data-type="NodeTable"] {
      --rightPos: -2px;
      // padding-top: unset !important;
    }
  }
}

.enParagraphContainer {
  position: absolute;
  height: calc(var(--timeFontSize) + 2px);
  bottom: var(--bottomPos);
  display: flex;
  align-items: center;
  padding-right: 4px;
  right: calc(var(--rightPos) + var(--timeFontSize) * 11.5);

  .enPLock {
    display: flex;
    font-size: var(--timeFontSize);
    cursor: pointer;
  }
}

.block-focus {
  border-right: 1px solid var(--sky-blue);
}

</style>
