<template>
  <EnWindow
    v-model:visible="visible"
    v-model:inWindow="inWindow"
    createImmediate
    windowTitle="QuickNote"
    ref="enWinRef"
  >
    <!-- 这里写组件A里需要展示的内容 -->
    <div
      class="EnQuickNoteContainer flexColumn"
      v-if="inWindow"
    >
      <div class="EnQuickNoteToolBarLine">
        <div class="flexAlignCenter enGap">
          <div class="flexAlignCenter">笔记本：</div>
          <div>
            <a-select
              placeholder="选择笔记本"
              v-model="selectedNotebookId"
            >
              <a-option
                v-for="notebook of openedNotebookList"
                :value="notebook.id"
                :label="notebook.name"
              >
              </a-option>
            </a-select>
          </div>
        </div>
      </div>
      <div
        class="inputArea"
        >
        <div
          ref="inputAreaRef"
        >
        </div>
      </div>
    </div>
  </EnWindow>
</template>

<script setup lang="ts">
  import { appendDailyNoteBlock, deleteBlock } from '@/api';
import { usePlugin } from '@/main';
  import EnWindow from '@/modules/EnWindow.vue';
import { Protyle } from 'siyuan';
  import { onMounted, ref, watchEffect } from 'vue';

  const inWindow = ref(false)
  const enWinRef = ref()

  const visible = ref(false)

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
    protyleRef.value = new Protyle(plugin.app, inputAreaRef.value, {
      blockId: id,
      action: ['cb-get-focus'],
      render: {
        breadcrumb: false,
      }
    })
    protyleRef.value.protyle.element.classList.toggle('EnQuickNoteProtyle', true)
    protyleRef.value.protyle.element.classList.toggle('EnDisableProtyleEnhance', true)
    protyleRef.value.protyle.contentElement.classList.toggle('EnDisableProtyleEnhance', true)
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
  }

  watchEffect(() => {
    if (visible.value) {
      initProtyle()
    } else {
      destoryProtyle()
    }
  })

  const plugin = usePlugin()
  plugin.addIcons(`
    <symbol id="iconEnQuickNote" viewBox="0 0 32 32">
      <path d="M26.17 1.083c2.247 0 4.068 1.821 4.068 4.068v0 21.697c0 2.247-1.821 4.068-4.068 4.068v0h-17.629c-2.007-0-3.675-1.454-4.008-3.366l-0.004-0.024h1.639c1.685-0 3.051-1.366 3.051-3.051 0-1.635-1.285-2.969-2.9-3.047l-0.007-0-0.144-0.003h-1.695v-2.373h1.695c1.635 0 2.969-1.285 3.047-2.9l0-0.007 0.003-0.144c0-1.635-1.285-2.969-2.9-3.047l-0.007-0-0.144-0.003h-1.695v-2.373h1.695c1.635 0 2.969-1.285 3.047-2.9l0-0.007 0.003-0.144c0-1.635-1.285-2.969-2.9-3.047l-0.007-0-0.144-0.003h-1.639c0.337-1.936 2.005-3.39 4.012-3.39h17.629zM6.169 23.458c0.562 0 1.017 0.455 1.017 1.017s-0.455 1.017-1.017 1.017v0h-3.39c-0.562 0-1.017-0.455-1.017-1.017s0.455-1.017 1.017-1.017v0h3.39zM25.425 9.287c-0.368-0.368-0.877-0.596-1.438-0.596s-1.070 0.228-1.438 0.596l-9.745 9.746c-0.203 0.203-0.343 0.471-0.384 0.77l-0.001 0.007-0.275 2.029c-0.004 0.027-0.006 0.059-0.006 0.091 0 0.374 0.304 0.678 0.678 0.678 0.036 0 0.071-0.003 0.105-0.008l-0.004 0 1.998-0.301c0.298-0.046 0.559-0.183 0.757-0.382v0l9.752-9.753c0.368-0.368 0.596-0.877 0.596-1.438s-0.228-1.070-0.596-1.438v0zM6.169 14.983c0.562 0 1.017 0.455 1.017 1.017s-0.455 1.017-1.017 1.017v0h-3.39c-0.562 0-1.017-0.455-1.017-1.017s0.455-1.017 1.017-1.017v0h3.39zM6.169 6.508c0.562 0 1.017 0.455 1.017 1.017s-0.455 1.017-1.017 1.017v0h-3.39c-0.562 0-1.017-0.455-1.017-1.017s0.455-1.017 1.017-1.017v0h3.39z"></path>
    </symbol>
  `)

  const openWindow = () => {
    enWinRef.value?.openWindow()
  }

  plugin.addTopBar({
    icon: "iconEnQuickNote",
    title: '一键记事',
    position: "right",
    callback: () => {
      openWindow()
    },
  });


  const openedNotebookList = ref(window.siyuan.notebooks.filter(i => !i.closed))
  const selectedNotebookId = ref(openedNotebookList.value[0]?.id)


  const inputAreaRef = ref()

  onMounted(() => {
    plugin.addCommand({
      langKey: "enOpenQuickNote",
      langText: "一键记事",
      hotkey: "",
      globalCallback: () => {
        const winRef = enWinRef.value
        if (winRef?.isVisible()) {
          winRef?.hideWindow()
        } else {
          winRef?.pinWindow(true)
          winRef?.openWindow()
        }
      },
    });
  })
</script>

<style lang="scss" scoped>
.EnQuickNoteContainer {
  flex: 1;
  width: 0;
  display: flex;
  color: var(--b3-theme-on-background);

  .EnQuickNoteToolBarLine {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    overflow-x: auto;
    z-index: 2;
  }

  .inputArea {
    padding: 8px 0px;
    flex: 1;
    overflow: auto;


    :deep(.EnQuickNoteProtyle) {
      height: 100%;

      .protyle-wysiwyg {
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        padding: 0px 16px !important;
      }
    }
  }
}
</style>
