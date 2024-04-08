<template>
  <EnSettingsTeleport name="DailyNote">
    <div>Test teleport</div>
  </EnSettingsTeleport>
</template>



<script setup lang="ts">
import { usePlugin } from '@/main';
import {
  showMessage,
} from "siyuan";
import { createDailyNote, lsNotebooks, request } from '@/api';
import { useEnhancer } from '@/modules/GlobalStatus';
import { getDailyNote, openDoc, openDocById } from '@/utils/Note';
import { jumpToProtyleBottom } from '@/utils';
import { onMounted } from 'vue';
import { settingsTestRef } from '../Settings/EnSettings.vue';
import EnSettingsTeleport from '../Settings/EnSettingsTeleport.vue';

settingsTestRef
console.log('settingsTestRef is ', settingsTestRef.value)

const plugin = usePlugin()
onMounted(() => {
  plugin.addCommand({
    langKey: "goPrevDailyNote",
    hotkey: "⌥⌘↑",
    callback: () => {
      jumpToPrevDailyNote();
    },
  });
  plugin.addCommand({
    langKey: "goNextDailyNote",
    hotkey: "⌥⌘↓",
    callback: () => {
      jumpToNextDailyNote();
    },
  });
})
</script>



<script lang="ts">


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

async function jumpTo(next = true) {
  const plugin = usePlugin()

  const currentDocTitleDom: HTMLDivElement = plugin.isMobile
    ? document.querySelector(
        "#editor:not(.fn__none) .protyle-background.protyle-background--enable"
      )
    : document.querySelector(
        ".protyle:not(.fn__none) .protyle-title"
      );
  if (!currentDocTitleDom) {
    showMessage("请先当开一篇文档");
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
