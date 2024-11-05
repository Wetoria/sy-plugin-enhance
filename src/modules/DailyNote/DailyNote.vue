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
          :notebookList="openedNotebookList.data"
          v-model="moduleOptions.dailyNoteNotebookId"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
  <Teleport to="body">
    <a-modal
      v-model:visible="quickNoteModalVisible"
      class="enQuickNoteModal"
      modal-class="enQuickNoteContainer"
      :mask="false"
      :alignCenter="false"
      :closable="false"
    >
      <template #title>
        添加日记
      </template>
      <div
        class="enCommentContainerContent"
      >
        <a-spin dot :loading="isCreatingDailyNote">
          <EnProtyle
            :blockId="currentBlockId"
            :options="{
              action: ['cb-get-html', 'cb-get-all'],
            }"
            @after="onAfterRender"
            disableEnhance
          />
        </a-spin>
      </div>

      <template #footer>
        <a-button
          type="primary"
          size="small"
          @click="quickNoteModalVisible = false"
        >
          关闭
        </a-button>
      </template>
    </a-modal>
  </Teleport>
</template>



<script setup lang="tsx">
import { usePlugin } from '@/main';
import {
  Protyle,
  showMessage,
} from "siyuan";
import { deleteBlock, lsNotebooks, request } from '@/api';
import { useEnhancer } from '@/modules/GlobalStatus';
import { openDocById } from '@/utils/Note';
import { computed, onMounted, ref, watch } from 'vue';
import EnSettingsItem from '../Settings/EnSettingsItem.vue';
import EnNotebookSelector from '@/components/EnNotebookSelector.vue';
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue';
import { useModule } from '../Settings/EnSettings.vue';
import EnProtyle from '@/components/EnProtyle.vue';
import { targetIsInnerOf } from '@/utils/DOM';
import { useSyncModuleData } from '@/utils/SyncData';
import { useSiyuanNotebookMount, useSiyuanNotebookUnmount } from '@/utils/EventBusHooks';

const plugin = usePlugin()
onMounted(() => {
  plugin.addCommand({
    langKey: "goPrevDailyNote",
    langText: "前一篇日记",
    hotkey: "⌥⌘↑",
    callback: () => {
      jumpToPrevDailyNote();
    },
  });
  plugin.addCommand({
    langKey: "goNextDailyNote",
    langText: "后一篇日记",
    hotkey: "⌥⌘↓",
    callback: () => {
      jumpToNextDailyNote();
    },
  });
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

const openedNotebookList = useSyncModuleData({
  namespace: 'dailyNoteOpenedNotebookList',
  defaultData: [],
  needSave: false,
  needSync: false,
})
export function updateOpenedNotebookList() {
  lsNotebooks().then((res) => {
    enLog('lsNotebooks res', res)
    openedNotebookList.value.data = res?.notebooks?.filter(i => !i.closed) || []
  })
}

interface ModuleOptions {
  dailyNoteNotebookId: string
}
export type DailyNoteModuleOptions = ModuleOptions
const moduleName = 'DailyNote'
export const DailyNoteModuleName = moduleName
const moduleDisplayName = 'Daily Note'
const defaultOptions: ModuleOptions = {
  dailyNoteNotebookId: '',
}
const module = useModule(moduleName, defaultOptions)
const moduleOptions = computed(() => module.value?.options as ModuleOptions || {})

// TODO 思源的笔记本列表更新不及时，等以后提案了响应式以后，再考虑要不要优化吧。
export function notebookIsOpened(notebookId: string) {
  updateOpenedNotebookList()
  return openedNotebookList.value.data.some(i => i.id === notebookId)
}

export function useDailyNote() {
  return {
    openedNotebookList,
    module,
    moduleOptions,
  }
}

export function appendBlockIntoDailyNote(
  dataType: "markdown" | "dom",
  data: string,
  notebook: string,
): Promise<IResdoOperations[]> {
  if (!notebook) {
    showMessage('[Enhance 插件] 请先选择创建日记的笔记本')
    return Promise.reject('[Enhance 插件] 请先选择创建日记的笔记本')
  }
  const notebookIsClosed = !notebookIsOpened(moduleOptions.value.dailyNoteNotebookId)
  if (notebookIsClosed) {
    showMessage('[Enhance 插件] 请先打开日记所在的笔记本')
    return Promise.reject('[Enhance 插件] 请先打开日记所在的笔记本')
  }
  const payload = {
    dataType,
    data,
    notebook,
  };
  const url = "/api/block/appendDailyNoteBlock";
  return request(url, payload);
}

async function getCurrentDocAttr(currentDocId) {
  const data = {
    stmt: `
      select
        *
      FROM	attributes
      WHERE
        block_id = '${currentDocId}'
        and name like 'custom-dailynote-%'
      ORDER BY
        value desc
    `
  };
  const url = "/api/query/sql";
  return request(url, data).then(function (data) {
    return data
  });

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
  };
  const url = "/api/query/sql";
  return request(url, data).then(function (data) {
    if (data && data.length === 1) {
      return data[0];
    }
    return null;
  });
}

export async function jumpToPrevDailyNote() {
  jumpTo(false);
}

export async function jumpToNextDailyNote() {
  jumpTo();
}

export function getCurrentDocTitleDomByDom(dom: HTMLElement) {
  const plugin = usePlugin()
  const currentDocTitleDom: HTMLDivElement = plugin.isMobile
    ? dom.querySelector(
        "#editor:not(.fn__none) .protyle-background"
      )
    : dom.querySelector(
        ".protyle:not(.fn__none) .protyle-title"
      );
  return currentDocTitleDom
}

async function jumpTo(next = true) {
  const plugin = usePlugin()

  const currentDocTitleDom: HTMLDivElement = plugin.isMobile
    ? document.querySelector(
        "#editor:not(.fn__none) .protyle-background"
      )
    : document.querySelector(
        ".protyle:not(.fn__none) .protyle-title"
      );
  if (!currentDocTitleDom) {
    showMessage("请先打开一篇文档");
    return;
  }
  const currentDocId = currentDocTitleDom.dataset.nodeId;
  if (!currentDocId) {
    return;
  }
  const docAttr = await getCurrentDocAttr(currentDocId)

  if (!docAttr.length) {
    showMessage("请打开一篇日记");
    return;
  }

  const prevDailyNoteInfo = await getSlideDailyNote(next, next ? docAttr[0].value : docAttr[docAttr.length - 1].value);

  if (!prevDailyNoteInfo) {
    showMessage(`未找到${next ? "下" : "上"}一篇日记`);
    return;
  }

  openDocById(prevDailyNoteInfo.id)
}

export function getAppendedDailyNoteBlockId(res: IResdoOperations[]) {
  const transaction = res[0]?.doOperations[0]
  return transaction?.id
}

const isCreatingDailyNote = ref(false)
const quickNoteModalVisible = ref(false)
const currentBlockId = ref()

const protyleRef = ref<Protyle>()
const onAfterRender = (protyle: Protyle) => {
  const flag = setInterval(() => {
    const target = protyle.protyle.contentElement.querySelector(`[data-node-id="${currentBlockId.value}"]`) as HTMLElement
    enLog('target', target, target.dataset.nodeId)
    if (target) {
      clearInterval(flag)
      const editableDom = target.firstElementChild as HTMLElement

      editableDom.setAttribute("placeholder", '写点什么');
      isCreatingDailyNote.value = false
    }
  }, 0)
  enLog('onAfterRender', protyle)
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
  currentBlockId.value = ''
}
watch(quickNoteModalVisible, (visible) => {
  if (!visible) {
    destoryProtyle()
  }
})
export async function createTodayDailyNote() {
  const enhancer = useEnhancer()
  if (enhancer.value.isSync) {
    showMessage('正在同步中，请等待同步完成再创建笔记', 1000)
    return
  }

  if (quickNoteModalVisible.value) {
    return
  }
  isCreatingDailyNote.value = true
  const res = await appendBlockIntoDailyNote(
    'markdown',
    '',
    moduleOptions.value.dailyNoteNotebookId
  )
  const blockId = getAppendedDailyNoteBlockId(res)

  quickNoteModalVisible.value = true

  currentBlockId.value = blockId
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
