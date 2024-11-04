<template>
  <EnWindow
    createImmediate
    :windowTitle="winTitle"
    ref="enWinRef"
  >
    <div
      class="EnQuickNoteContainer"
      v-if="inWindow"
    >
      <div class="EnQuickNoteToolBarLine">
        <div class="flexAlignCenter enGap">
          <div class="flexAlignCenter">日记笔记本：</div>
          <div>
            <EnNotebookSelector
              :notebookList="openedNotebookList"
              v-model="moduleOptions.dailyNoteNotebookId"
            />
          </div>
        </div>
      </div>
      <div
        class="inputArea"
      >
        <EnProtyle
          :blockId="currentBlockId"
          @after-render="onAfterRender"
        />
      </div>
    </div>
  </EnWindow>
</template>

<script setup lang="ts">
  import { appendDailyNoteBlock, deleteBlock } from '@/api';
import EnProtyle from '@/components/EnProtyle.vue';
import { usePlugin } from '@/main';
  import EnWindow, { isInWindow } from '@/modules/EnWindow.vue';
import { Protyle } from 'siyuan';
  import { computed, onMounted, ref, watch } from 'vue';
import EnNotebookSelector from '@/components/EnNotebookSelector.vue';
import { useDailyNote } from '../DailyNote/DailyNote.vue';

  const winTitle = 'QuickNote'
  const inWindow = ref(isInWindow(winTitle))

  const plugin = usePlugin()
  plugin.addIcons(`
    <symbol id="iconEnQuickNote" viewBox="0 0 32 32">
      <path d="M26.17 1.083c2.247 0 4.068 1.821 4.068 4.068v0 21.697c0 2.247-1.821 4.068-4.068 4.068v0h-17.629c-2.007-0-3.675-1.454-4.008-3.366l-0.004-0.024h1.639c1.685-0 3.051-1.366 3.051-3.051 0-1.635-1.285-2.969-2.9-3.047l-0.007-0-0.144-0.003h-1.695v-2.373h1.695c1.635 0 2.969-1.285 3.047-2.9l0-0.007 0.003-0.144c0-1.635-1.285-2.969-2.9-3.047l-0.007-0-0.144-0.003h-1.695v-2.373h1.695c1.635 0 2.969-1.285 3.047-2.9l0-0.007 0.003-0.144c0-1.635-1.285-2.969-2.9-3.047l-0.007-0-0.144-0.003h-1.639c0.337-1.936 2.005-3.39 4.012-3.39h17.629zM6.169 23.458c0.562 0 1.017 0.455 1.017 1.017s-0.455 1.017-1.017 1.017v0h-3.39c-0.562 0-1.017-0.455-1.017-1.017s0.455-1.017 1.017-1.017v0h3.39zM25.425 9.287c-0.368-0.368-0.877-0.596-1.438-0.596s-1.070 0.228-1.438 0.596l-9.745 9.746c-0.203 0.203-0.343 0.471-0.384 0.77l-0.001 0.007-0.275 2.029c-0.004 0.027-0.006 0.059-0.006 0.091 0 0.374 0.304 0.678 0.678 0.678 0.036 0 0.071-0.003 0.105-0.008l-0.004 0 1.998-0.301c0.298-0.046 0.559-0.183 0.757-0.382v0l9.752-9.753c0.368-0.368 0.596-0.877 0.596-1.438s-0.228-1.070-0.596-1.438v0zM6.169 14.983c0.562 0 1.017 0.455 1.017 1.017s-0.455 1.017-1.017 1.017v0h-3.39c-0.562 0-1.017-0.455-1.017-1.017s0.455-1.017 1.017-1.017v0h3.39zM6.169 6.508c0.562 0 1.017 0.455 1.017 1.017s-0.455 1.017-1.017 1.017v0h-3.39c-0.562 0-1.017-0.455-1.017-1.017s0.455-1.017 1.017-1.017v0h3.39z"></path>
    </symbol>
  `)

  const enWinRef = ref()


  // #region 在思源本体中

  // #endregion 在思源本体中



  // #region 在打开的窗口中

  const {
    openedNotebookList,
    moduleOptions,
  } = useDailyNote()
  const selectedNotebookId = computed(() => moduleOptions.value.dailyNoteNotebookId)



  const protyleRef = ref<Protyle>()
  const currentBlockId = ref()
  const initProtyle = async () => {
    if (!inWindow.value) {
      return
    }
    const res = await appendDailyNoteBlock(
      'markdown',
      ``,
      selectedNotebookId.value,
    )
    const {
      doOperations = [],
    } = res[0]
    const transaction = doOperations[0]
    const {
      id,
    } = transaction;
    currentBlockId.value = id
  }

  const onAfterRender = (protyle) => {
    protyle.protyle.element.classList.toggle('EnQuickNoteProtyle', true)
    protyle.protyle.element.classList.toggle('EnDisableProtyleEnhance', true)
    protyle.protyle.contentElement.classList.toggle('EnDisableProtyleEnhance', true)

    protyleRef.value = protyle
  }

  const destoryProtyle = () => {
    if (!protyleRef.value) {
      return
    }
    const protyle = protyleRef.value.protyle
    if (!protyle.updated && currentBlockId.value) {
      deleteBlock(currentBlockId.value)
    }
    protyleRef.value?.destroy()
    currentBlockId.value = ''
  }

  // #endregion 在打开的窗口中


  onMounted(() => {
    if (!inWindow.value && location.pathname != '/stage/build/app/window.html') {
      plugin.addCommand({
        langKey: "enOpenQuickNote",
        langText: "一键记事",
        hotkey: "",
        globalCallback: () => {
          const winRef = enWinRef.value
          if (winRef?.isVisible()) {
            // winRef.getWin().setVisibleOnAllWorkspaces(false, {visibleOnFullScreen: false});
            const isFocused = winRef.getWin().isFocused()
            if (isFocused) {
              winRef?.hideWindow()
            } else {
              winRef.getWin().focus()
            }
          } else {
            // winRef.getWin().setVisibleOnAllWorkspaces(true, {visibleOnFullScreen: true});
            winRef?.pinWindow(true)
            winRef?.openWindow()
            winRef.getWin().focus()
          }
        },
      });
    } else {
      const winRef = enWinRef.value.getWin()
      let unwatchFunc = null
      winRef.on('show', () => {
        initProtyle()
        enLog('quick note show')
        unwatchFunc = watch(selectedNotebookId, () => {
          destoryProtyle()
          initProtyle()
        })
      })

      winRef.on('hide', () => {
        destoryProtyle()
        enLog('quick note hide')
        if (unwatchFunc) {
          unwatchFunc()
        }
      })
    }
  })
</script>

<style lang="scss" scoped>
.EnQuickNoteContainer {
  flex: 1;
  width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--b3-theme-on-background);

  .EnQuickNoteToolBarLine {
    display: flex;
    align-items: center;
    padding: 0px 16px;
    overflow-x: auto;
    z-index: 2;
  }

  .inputArea {
    padding: 0px 0px;
    flex: 1;
    overflow: auto;

    :deep(.protyle-wysiwyg) {
      padding-top: unset !important;
    }
  }
}
</style>
