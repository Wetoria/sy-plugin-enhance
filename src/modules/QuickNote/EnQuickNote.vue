<template>
  <EnWindow
    ref="enWinRef"
    createImmediate
    :windowTitle="winTitle"
  >
    <div
      v-if="inWindow"
      class="EnQuickNoteContainer"
    >
      <div class="EnQuickNoteToolBarLine">
        <div class="flexAlignCenter enGap">
          <div>
            <EnBlockAppendModeSelector
              v-model="selectedNotebookId"
              v-model:targetId="targetId"
              :notebookList="openedNotebookList"
              :mode="globalData.quickNoteMode"
              showPrompt
              showTips
            >
              <template
                v-if="isConfigValid"
                #tipIcon
              >
                <icon-check-circle style="color: rgb(var(--success-6))" />
              </template>
              <template #extraTips>
                <div>
                  注：未编辑过的块，将会自动删除
                </div>
              </template>
            </EnBlockAppendModeSelector>
          </div>
          <div class="flexAlignCenter enGap">
            <a-tooltip>
              <template #content>
                <div>
                  是否自动保存当前窗口配置
                </div>
              </template>
              <a-checkbox
                v-model="moduleOptions.autoSaveConfigByWindow"
                @change="onAutoSaveConfigChange"
              >
              </a-checkbox>
            </a-tooltip>
            <a-tooltip v-if="!moduleOptions.autoSaveConfigByWindow">
              <template #content>
                <div>
                  保存当前窗口配置 {{ isNotSameConfig ? '（未保存）' : '' }}
                </div>
              </template>
              <a-button
                class="EnQuickNoteSaveConfigButton"
                :class="{
                  isNotSameConfig,
                }"
                :loading="savingConfig"
                @click="saveConfig"
              >
                <template #icon>
                  <icon-save />
                </template>
              </a-button>
            </a-tooltip>
            <a-tooltip>
              <a-button
                @click="appendNewBlock"
              >
                <template #icon>
                  <icon-plus />
                </template>
              </a-button>
              <template #content>
                <div>
                  追加新块 ({{ isMac ? '⌘ + N' : 'Ctrl + N' }})
                </div>
                <div>
                  可以认为是创建一个新的段落并聚焦。
                </div>
              </template>
            </a-tooltip>
          </div>
        </div>
      </div>
      <div
        class="inputArea"
      >
        <EnProtyle
          :blockId="currentBlockId"
          appendEmptyBlock
          @after-render="onAfterRender"
        />
      </div>
    </div>
  </EnWindow>
</template>

<script setup lang="ts">
import { deleteBlock } from '@/api'
import EnBlockAppendModeSelector from '@/components/EnBlockAppendModeSelector.vue'
import EnProtyle from '@/components/EnProtyle.vue'
import { usePlugin } from '@/main'


import {
  injectGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnWindow, { isInWindow } from '@/modules/EnWindow.vue'
import { debounce } from '@/utils'
import {
  appendBlockInto,
  isAppendDailyNoteMode,
} from '@/utils/Block'
import {
  addCommand,
  removeCommand,
} from '@/utils/Commands'
import { EN_MODULE_LIST } from '@/utils/Constants'
import { getOS } from '@/utils/System'
import dayjs from 'dayjs'
import {
  Protyle,
} from 'siyuan'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

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


const { isMac } = getOS()

// #region 在打开的窗口中

const globalData = injectGlobalData()
const openedNotebookList = computed(() => globalData.value.openedNotebookList)


const {
  moduleOptions,
} = useModule<EnModuleQuickNote>(EN_MODULE_LIST.QUICK_NOTE)

const selectedNotebookId = ref(moduleOptions.value.notebookId)
const targetId = ref(moduleOptions.value.targetId)

watch(() => moduleOptions.value.notebookId, () => {
  selectedNotebookId.value = moduleOptions.value.notebookId
})

watch(() => moduleOptions.value.targetId, () => {
  targetId.value = moduleOptions.value.targetId
})

const isSameConfig = computed(() => {
  return selectedNotebookId.value === moduleOptions.value.notebookId && targetId.value === moduleOptions.value.targetId
})
const isNotSameConfig = computed(() => {
  return !isSameConfig.value
})

const isConfigValid = computed(() => {
  return isAppendDailyNoteMode(selectedNotebookId.value) || targetId.value
})


const protyleRef = ref<Protyle>()
const currentBlockId = ref()
const initProtyle = async () => {
  if (!inWindow.value) {
    return
  }

  const isAppendDN = isAppendDailyNoteMode(selectedNotebookId.value)
  const hasTargetId = targetId.value

  if (!isAppendDN && !hasTargetId) {
    return
  }

  currentBlockId.value = await appendBlockInto(
    selectedNotebookId.value,
    targetId.value,
  )
}
const onAfterRender = (protyle) => {
  protyle.protyle.element.classList.toggle('EnQuickNoteProtyle', true)
  protyle.protyle.element.classList.toggle('EnDisableProtyleEnhance', true)
  protyle.protyle.contentElement.classList.toggle('EnDisableProtyleEnhance', true)

  protyleRef.value = protyle
}

const destoryProtyle = async () => {
  if (!protyleRef.value) {
    return
  }
  const protyle = protyleRef.value.protyle
  // 如果没有编辑过，则删除一键记事中的块
  // IMP 看后续有没有需求，比如输入过再清空的情况下，这种时候会保留下来。
  if (!protyle.updated && currentBlockId.value) {

    // 删除块前，先销毁 protyle
    // 防止触发思源自动插入新块的逻辑
    protyleRef.value?.destroy()


    await deleteBlock(currentBlockId.value)
    currentBlockId.value = ''
  }
}

const appendNewBlock = () => {
  destoryProtyle().then(() => {
    initProtyle()
  })
}

const savingConfig = ref(false)
const saveConfig = () => {
  savingConfig.value = true
  moduleOptions.value.notebookId = selectedNotebookId.value
  moduleOptions.value.targetId = targetId.value
  setTimeout(() => {
    savingConfig.value = false
  }, 300)
}

function onAutoSaveConfigChange() {
  if (moduleOptions.value.autoSaveConfigByWindow) {
    saveConfig()
  }
}

// #endregion 在打开的窗口中


const commands = [
  {
    langKey: "En_OpenQuickNote",
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
  },
]

const runInQuickNoteWindow = () => {

  document.documentElement.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault()
      e.stopImmediatePropagation()
      e.stopPropagation()

      appendNewBlock()
    }
  }, true)

  const winRef = enWinRef.value.getWin()
  let unwatchFunc = null
  let lastHideTime = null
  winRef.on('show', () => {
    // 首次打开，所以没有上一次隐藏时间
    if (!lastHideTime) {
      initProtyle()
    } else if (dayjs().diff(lastHideTime, 'seconds') > moduleOptions.value.newBlockDelay) {
      // 如果上一次隐藏时间大于 newBlockDelay 秒，则创建新块
      initProtyle()
    } else if (!currentBlockId.value) {
      // 如果当前没有块，也创建新块
      // 比如刚打开就关闭，这个时候没有编辑，原来的块会被删掉
      // 如果在 newBlockDelay 秒内，再次打开，需要重新创建
      initProtyle()
    }
    enLog('quick note show')
    unwatchFunc = watch([selectedNotebookId, targetId], debounce(() => {
      if (moduleOptions.value.autoSaveConfigByWindow) {
        saveConfig()
      }
      destoryProtyle().then(() => {
        currentBlockId.value = ''
        initProtyle()
      })
    }, 1000))
  })

  winRef.on('hide', () => {
    lastHideTime = dayjs()

    // 如果没编辑过的话，这里刚好删除
    destoryProtyle()
    enLog('quick note hide')
    if (unwatchFunc) {
      unwatchFunc()
    }
  })
}
onMounted(() => {
  if (!inWindow.value && location.pathname != '/stage/build/app/window.html') {
    commands.forEach((command) => {
      addCommand(command)
    })
  } else {
    runInQuickNoteWindow()
  }
})
onBeforeUnmount(() => {
  commands.forEach((command) => {
    removeCommand(command)
  })
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

    .EnQuickNoteSaveConfigButton {
      &.isNotSameConfig {
        color: rgb(var(--warning-6));
      }
    }
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
