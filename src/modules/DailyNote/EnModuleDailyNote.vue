<template>
  <EnSettingsTeleportModule
    :name="moduleName"
    :display="moduleDisplayName"
    :module="module"
    always
  >
    <EnSettingsItem mode="vertical">
      <div>
        日记笔记本
      </div>
      <template #desc>
        <div>
          选择日记所在的笔记本。
        </div>
        <div>
          该选项将会影响到一键记事、评论、白板等模块。
        </div>
      </template>
      <template #opt>
        <EnNotebookSelector
          v-model="moduleOptions.dailyNoteNotebookId"
          :notebookList="openedNotebookList"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>



<script setup lang="tsx">


import EnNotebookSelector from '@/components/EnNotebookSelector.vue'
import { usePlugin } from '@/main'
import {
  jumpToNextDailyNote,
  jumpToPrevDailyNote,
} from '@/modules/DailyNote/DailyNote'
import {
  injectGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  addCommand,
  removeCommand,
} from '@/utils/Commands'

import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  computed,
  onBeforeUnmount,
  onMounted,
} from 'vue'

const plugin = usePlugin()

const globalData = injectGlobalData()
const openedNotebookList = computed(() => globalData.value.openedNotebookList)


// #region 基本的模块配置

const {
  module,
  moduleOptions,
} = useModule<EnModuleDailyNote>(EN_MODULE_LIST.DAILY_NOTE, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.DAILY_NOTE,
    moduleDisplayName: EN_CONSTANTS.DAILY_NOTE_DISPLAY,

    dailyNoteNotebookId: '',
  },
})

const moduleName = moduleOptions.value.moduleName
const moduleDisplayName = moduleOptions.value.moduleDisplayName

// #endregion 基本的模块配置

const commands = [
  {
    langKey: "En_DailyNote_GoPrev",
    langText: "前一篇日记",
    hotkey: "⌥⌘↑",
    callback: () => {
      jumpToPrevDailyNote()
    },
  },
  {
    langKey: "En_DailyNote_GoNext",
    langText: "后一篇日记",
    hotkey: "⌥⌘↓",
    callback: () => {
      jumpToNextDailyNote()
    },
  },
]

// TODO 日记流
// useSiyuanEventLoadedProtyleStatic(({ detail }) => {

//   const protyle = detail.protyle as IProtyle

//   console.log('detail is ', detail)
//   const isDNProtyle = isDailyNoteProtyle(protyle?.contentElement)
//   console.log('isDailyNoteProtyle is ', isDNProtyle)
//   const isInEditor = isProtyleInEditor(protyle?.element)
//   console.log('isInEditor is ', isInEditor)

//   const isDoc = protyle.wysiwyg.element.dataset.docType === SyDomNodeTypes.NodeDocument

//   const docId = protyle.block.id
//   const dnAttrs = getDailyNoteAttrsByWysiwygElement(protyle.wysiwyg.element)
//   console.log('dnAttrs is ', dnAttrs, docId)
//   const dnAttrValues = Object.values(dnAttrs)
//   const lastDnAttrValue = dnAttrValues.sort().pop()
//   console.log('lastDnAttrValue is ', lastDnAttrValue)

//   if (isDNProtyle && isInEditor && isDoc) {
//     window.enTestDN = () => {
//       console.log('enTestDN is ')
//       openTab(
//         {
//           app: protyle.app,
//           doc: {
//             id: '20250116212441-lw6snbt',
//           },
//           removeCurrentTab: true,
//         },
//       )
//     }
//     setTimeout(() => {
//       window.enTestDN()
//     }, 2000)
//   }
// })

onMounted(() => {
  commands.forEach((command) => {
    addCommand(command)
  })
})
onBeforeUnmount(() => {
  commands.forEach((command) => {
    removeCommand(command)
  })
})
</script>




<style lang="scss">
.enQuickNoteModal {
  pointer-events: none;

  & .arco-modal-wrapper {
    pointer-events: none;
    overflow: hidden;
  }
}
.enQuickNoteContainer {
  pointer-events: auto;
  top: 0;
  vertical-align: top;
  width: calc(100vw - 20px);
  background: var(--b3-theme-background);
  border: 1px solid var(--b3-border-color);
  transform: translateY(20px);
  max-height: calc(100vh - 40px);
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .arco-modal-body {
    padding: 0;
  }

  .arco-modal-footer {
    padding: 6px 8px;
  }

  .enCommentContainerContent {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;

    .protyle-content {
      padding-bottom: unset !important;
    }

    .protyle-wysiwyg {
      padding: 6px 16px !important;

      [data-type="NodeParagraph"] > div:first-child:empty:before {
        color: var(--b3-empty-color);
        content: attr(placeholder);
      }
    }
  }
}

html[data-en-is-standalone="true"][data-en-pwa="true"] {
  &[data-en-orientation="portrait-primary"] {
    .enQuickNoteContainer {
      transform: translateY(var(--en-status-height));
      max-height: calc(35vh);
    }
  }

  &[data-en-orientation="landscape-secondary"],
  &[data-en-orientation="landscape-primary"] {
    .enQuickNoteContainer {
      margin: unset;
      width: calc(100% - var(--en-status-height) - var(--en-toolbar-height));
      max-height: calc(50vh);
    }
  }
  &[data-en-orientation="landscape-secondary"] {
    .enQuickNoteContainer {
      transform: translateX(var(--en-toolbar-height));
    }
  }
  &[data-en-orientation="landscape-primary"] {
    .enQuickNoteContainer {
      transform: translateX(var(--en-status-height));
    }
  }
}
</style>
