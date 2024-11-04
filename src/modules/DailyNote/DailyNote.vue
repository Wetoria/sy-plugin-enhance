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
          :notebookList="openedNotebookList"
          v-model="moduleOptions.dailyNoteNotebookId"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>



<script setup lang="tsx">
import { usePlugin } from '@/main';
import {
  showMessage,
} from "siyuan";
import { createDailyNote, lsNotebooks, request } from '@/api';
import { useEnhancer } from '@/modules/GlobalStatus';
import { getDailyNote, openDoc, openDocById } from '@/utils/Note';
import { computed, onMounted, ref } from 'vue';
import EnSettingsItem from '../Settings/EnSettingsItem.vue';
import EnNotebookSelector from '@/components/EnNotebookSelector.vue';
import { jumpToProtyleBottom } from '../Editor/ProtyleBottom/EnProtyleBottomIndicator.vue';
import EnSettingsTeleportModule from '../Settings/EnSettingsTeleportModule.vue';
import { useModule } from '../Settings/EnSettings.vue';

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
</script>



<script lang="tsx">
// 打开的笔记本列表
const openedNotebookList = ref(window.siyuan.notebooks.filter(i => !i.closed))
export function updateOpenedNotebookList() {
  openedNotebookList.value = window.siyuan.notebooks.filter(i => !i.closed)
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
const moduleOptions = computed(() => module.value.options as ModuleOptions)

export function notebookIsOpened(notebookId: string) {
  return openedNotebookList.value.some(i => i.id === notebookId)
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

export function createTodayDailyNote() {
  const enhancer = useEnhancer()
  if (enhancer.value.isSync) {
    showMessage('正在同步中，请等待同步完成再创建笔记', 1000)
    return
  }

  lsNotebooks().then(async (res) => {
    const {
      notebooks = [],
    } = res
    if (!notebooks.length) {
      return
    }

    const openedNotebookList = notebooks.filter(i => !i.closed)

    if (!openedNotebookList.length) {
      showMessage('请先打开笔记本')
      return
    }

    if (openedNotebookList.length !== 1) {
      // IMP 让选择笔记本
      showMessage('打开了多个笔记本')
      return
    }

    const currentNoteBook = openedNotebookList[0];
    const {
      id: notebookId,
    } = currentNoteBook;

    const dailyNote = await getDailyNote(notebookId)
    if (!dailyNote || dailyNote.length === 0) {
      createDailyNote(notebookId).then((res) => {
        openDocById(res.id);
        setTimeout(() => {
          jumpToProtyleBottom(res.id)
        }, 300)
      })
      return
    }

    if (dailyNote.length !== 1) {
      return
    }
    const todayNote = dailyNote[0]
    openDoc(todayNote)
    setTimeout(() => {
      jumpToProtyleBottom(todayNote.id)
    }, 300)
  })
}
</script>



<style lang="scss">

</style>
