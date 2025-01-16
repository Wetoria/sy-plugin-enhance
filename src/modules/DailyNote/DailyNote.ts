// 打开的笔记本列表
// const openedNotebookList = ref([])

import { request } from '@/api'
import { usePlugin } from '@/main'
import {
  useGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { openDocById } from '@/utils/Note'
import { showMessage } from 'siyuan'




export function useDailyNote() {
  const {
    module,
    moduleOptions,
  } = useModule(EN_MODULE_LIST.DAILY_NOTE)
  return {
    module,
    moduleOptions,
  }
}


export async function notebookIsOpened(notebookId: string) {
  const globalData = useGlobalData(EN_CONSTANTS.GLOBAL_DATA)
  return globalData.moduleOptions.value.openedNotebookList.some((i) => i.id === notebookId)
}

export async function appendBlockIntoDailyNote(
  dataType: "markdown" | "dom",
  data: string,
  notebook: string,
): Promise<IResdoOperations[]> {
  if (!notebook) {
    showMessage('[叶归插件] 请先选择创建日记的笔记本')
    return Promise.reject(new Error('[叶归插件] 请先选择创建日记的笔记本'))
  }
  const {
    moduleOptions,
  } = useDailyNote()
  const notebookOpened = await notebookIsOpened(moduleOptions.value.dailyNoteNotebookId)
  const notebookClosed = !notebookOpened
  if (notebookClosed) {
    showMessage('[叶归插件] 请先打开日记所在的笔记本')
    return Promise.reject(new Error('[叶归插件] 请先打开日记所在的笔记本'))
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
  const {
    moduleOptions,
  } = useDailyNote()
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


export function isDailyNoteProtyle(protyleContentDom: HTMLElement): boolean {
  if (!protyleContentDom) {
    return false
  }
  const wysiwygEl: HTMLDivElement = protyleContentDom.querySelector('.protyle-wysiwyg')
  if (!wysiwygEl) {
    return false
  }
  const attrs = wysiwygEl.getAttributeNames()
  const containsDailyNoteAttr = attrs.find((i) => i.startsWith('custom-dailynote'))
  return !!containsDailyNoteAttr
}
