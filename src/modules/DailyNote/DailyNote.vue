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
          该选项将会影响到一键记事、评论等模块。
        </div>
      </template>
      <template #opt>
        <EnNotebookSelector
          v-model="moduleOptions.dailyNoteNotebookId"
          :notebookList="openedNotebookList.data"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>

  <!-- 一键记事 -->

  <!-- 移动端一键记事 -->
  <template v-if="plugin.isMobile">
    <EnQuickNoteMobile />
  </template>

  <!-- 浏览器 - 桌面端 -->
  <!-- IMP 网页伺服 一键记事 -->

  <!-- 桌面端 一键记事 electron 窗口 -->
  <template>
    <EnQuickNote />
  </template>
</template>



<script setup lang="tsx">
import {
  lsNotebooks,
  request,
} from '@/api'
import EnNotebookSelector from '@/components/EnNotebookSelector.vue'
import { usePlugin } from '@/main'
import EnQuickNote from '@/modules/DailyNote/QuickNote/EnQuickNote.vue'
import {
  useGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import { addCommand } from '@/utils/Commands'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { targetIsInnerOf } from '@/utils/DOM'
import {
  useSiyuanNotebookMount,
  useSiyuanNotebookUnmount,
} from '@/utils/EventBusHooks'
import { getColorStringWarn } from '@/utils/Log'
import { openDocById } from '@/utils/Note'
import {
  showMessage,
} from "siyuan"
import {
  onMounted,
} from 'vue'
import { EnModule } from '../Settings/EnSettings.vue'
import EnSettingsItem from '../Settings/EnSettingsItem.vue'
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue'
import EnQuickNoteMobile from './QuickNote/EnQuickNoteMobile.vue'

const plugin = usePlugin()


onMounted(() => {
  addCommand({
    langKey: "En_DailyNote_GoPrev",
    langText: "前一篇日记",
    hotkey: "⌥⌘↑",
    callback: () => {
      jumpToPrevDailyNote()
    },
  })
  addCommand({
    langKey: "En_DailyNote_GoNext",
    langText: "后一篇日记",
    hotkey: "⌥⌘↓",
    callback: () => {
      jumpToNextDailyNote()
    },
  })
})
onMounted(() => {
  updateOpenedNotebookList()
  enLog('onMounted daily note')
  useSiyuanNotebookMount(() => {
    enLog('update opened notebook list by mount')
    updateOpenedNotebookList()
  })
  useSiyuanNotebookUnmount(() => {
    enLog('update opened notebook list by unmount')
    updateOpenedNotebookList()
  })
})


onMounted(() => {
  document.addEventListener('touchmove', (e) => {
    if (targetIsInnerOf(e.target as HTMLElement, (target) => {
      return target.classList.contains('enQuickNoteContainer')
    })) {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
    }
  }, true)
})
</script>



<script lang="tsx">
// 打开的笔记本列表
// const openedNotebookList = ref([])

const {
  module: openedNotebookList,
} = useGlobalData(EN_CONSTANTS.NOTEBOOK_LIST_OPENED, {
  defaultData: [],
  needSave: false,
  needSync: false,
})

export async function updateOpenedNotebookList() {
  const res = await lsNotebooks()
  enLog(`${getColorStringWarn(`Loaded notebook list: `)}`, res)
  openedNotebookList.value.data = res?.notebooks?.filter((i) => !i.closed) || []
}


// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule {
  dailyNoteNotebookId: string
}

const {
  module,
  moduleOptions,
} = useModule<ISettingModuleOptions>(EN_MODULE_LIST.DAILY_NOTE, {
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



// TODO 思源的笔记本列表更新不及时，等以后提案了响应式以后，再考虑要不要优化吧。
export async function notebookIsOpened(notebookId: string) {
  await updateOpenedNotebookList()
  return openedNotebookList.value.data.some((i) => i.id === notebookId)
}

export function useDailyNote() {
  return {
    openedNotebookList,
    module,
    moduleOptions,
  }
}

export async function appendBlockIntoDailyNote(
  dataType: "markdown" | "dom",
  data: string,
  notebook: string,
): Promise<IResdoOperations[]> {
  if (!notebook) {
    showMessage('[Enhance 插件] 请先选择创建日记的笔记本')
    return Promise.reject(new Error('[Enhance 插件] 请先选择创建日记的笔记本'))
  }
  const notebookOpened = await notebookIsOpened(moduleOptions.value.dailyNoteNotebookId)
  const notebookClosed = !notebookOpened
  if (notebookClosed) {
    showMessage('[Enhance 插件] 请先打开日记所在的笔记本')
    return Promise.reject(new Error('[Enhance 插件] 请先打开日记所在的笔记本'))
  }
  const payload = {
    dataType,
    data,
    notebook,
  }
  const url = "/api/block/appendDailyNoteBlock"
  return request(url, payload)
}

export async function getNewDailyNoteBlockId(text: string = '') {
  const res = await appendBlockIntoDailyNote(
    'markdown',
    text,
    moduleOptions.value.dailyNoteNotebookId,
  )
  const blockId = getAppendedDailyNoteBlockId(res)
  return blockId
}

async function getCurrentDocAttr(currentDocId) {
  const data = {
    stmt: `
      select
        *
      FROM attributes
      WHERE
        block_id = '${currentDocId}'
        and name like 'custom-dailynote-%'
      ORDER BY
        value desc
    `,
  }
  const url = "/api/query/sql"
  return request(url, data).then((data) => {
    return data
  })

}

async function getSlideDailyNote(next = true, newDate: string) {
  const data = {
    stmt: `
    select distinct B.* from blocks as B join attributes as A
    on B.id = A.block_id
    where A.name like 'custom-dailynote-%'
    and A.value ${next ? ">" : "<"} '${newDate}'
    order by
      A.value ${next ? "asc" : "desc"}
    limit 1
    `,
  }
  const url = "/api/query/sql"
  return request(url, data).then((data) => {
    if (data && data.length === 1) {
      return data[0]
    }
    return null
  })
}

export async function jumpToPrevDailyNote() {
  jumpTo(false)
}

export async function jumpToNextDailyNote() {
  jumpTo()
}

export function getCurrentDocTitleDomByDom(dom: HTMLElement) {
  const plugin = usePlugin()
  const currentDocTitleDom: HTMLDivElement = plugin.isMobile
    ? dom.querySelector(
      "#editor:not(.fn__none) .protyle-background",
    )
    : dom.querySelector(
      ".protyle:not(.fn__none) .protyle-title",
    )
  return currentDocTitleDom
}

async function jumpTo(next = true) {
  const plugin = usePlugin()

  const currentDocTitleDom: HTMLDivElement = plugin.isMobile
    ? document.querySelector(
      "#editor:not(.fn__none) .protyle-background",
    )
    : document.querySelector(
      ".protyle:not(.fn__none) .protyle-title",
    )
  if (!currentDocTitleDom) {
    showMessage("请先打开一篇文档")
    return
  }
  const currentDocId = currentDocTitleDom.dataset.nodeId
  if (!currentDocId) {
    return
  }
  const docAttr = await getCurrentDocAttr(currentDocId)

  if (!docAttr.length) {
    showMessage("请打开一篇日记")
    return
  }

  const prevDailyNoteInfo = await getSlideDailyNote(next, next ? docAttr[0].value : docAttr[docAttr.length - 1].value)

  if (!prevDailyNoteInfo) {
    showMessage(`未找到${next ? "下" : "上"}一篇日记`)
    return
  }

  openDocById(prevDailyNoteInfo.id)
}

export function getAppendedDailyNoteBlockId(res: IResdoOperations[]) {
  const transaction = res[0]?.doOperations[0]
  return transaction?.id
}

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
