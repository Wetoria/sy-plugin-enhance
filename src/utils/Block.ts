import {
  appendBlock,
  insertBlock,
  sql,
} from '@/api'
import {
  appendBlockIntoDailyNote,
} from '@/modules/DailyNote/DailyNote'
import {
  isSyDocNode,
  isSyListItemNode,
  isSyQuoteNode,
  isSySuperBlockNode,
} from '@/utils/Siyuan'
import { showMessage } from 'siyuan'

export function isAppendDailyNoteMode(notebookId: string = '') {
  return !notebookId.startsWith('target') && !notebookId.startsWith('current')
}

export function getTransactionFirstBlockId(res: IResdoOperations[]) {
  const transaction = res[0]?.doOperations[0]
  return transaction?.id
}

export async function appendBlockInto(notebookId: string, targetId: string, text: string = '') {
  const isAppendDailyNote = isAppendDailyNoteMode(notebookId)

  if (isAppendDailyNote) {
    const res = await appendBlockIntoDailyNote(
      'markdown',
      text,
      notebookId,
    )
    const blockId = getTransactionFirstBlockId(res)
    return blockId
  }

  // 无论是 targetDoc、targetBlock、currentDoc、currentBlock，哪一种模式，都是根据目标块的类型来创建
  // 只不过 target 模式是让用户输入 targetId
  // current 模式，则是插件内部控制 targetId

  // {
  //   "alias": "",
  //   "box": "20231126082545-eoox0h7",
  //   "content": "2025-01-16",
  //   "created": "20250116005403",
  //   "fcontent": "2025-01-16",
  //   "hash": "2f98610",
  //   "hpath": "/daily note/2025/01/2025-01-16",
  //   "ial": "{: custom-dailynote-20250116=\"20250116\" id=\"20250116005403-44c05ww\" title=\"2025-01-16\" type=\"doc\" updated=\"20250116234645\"}",
  //   "id": "20250116005403-44c05ww",
  //   "length": 10,
  //   "markdown": "",
  //   "memo": "",
  //   "name": "",
  //   "parent_id": "",
  //   "path": "/20231126082550-qqemyow/20250101003359-uyfwv0o/20250101003359-7dmkju7/20250116005403-44c05ww.sy",
  //   "root_id": "20250116005403-44c05ww",
  //   "sort": 0,
  //   "subtype": "",
  //   "tag": "",
  //   "type": "d",
  //   "updated": "20250116234645"
  // }
  if (!targetId) {
    showMessage('叶归｜请配置目标块 ID')
    return
  }
  const blockInfoRes = await sql(
    `select * from blocks where id = '${targetId}'`,
  )
  const blockInfo = blockInfoRes[0]
  if (!blockInfo) {
    showMessage('叶归｜目标块不存在')
    return
  }

  // 超级块、文档、引用块，使用 append 模式
  const needAppend = isSyDocNode(blockInfo) || isSyQuoteNode(blockInfo) || isSySuperBlockNode(blockInfo) || isSyListItemNode(blockInfo)

  if (needAppend) {
    const res = await appendBlock(
      'markdown',
      text,
      targetId,
    )
    return getTransactionFirstBlockId(res)
  }

  const res = await insertBlock(
    'markdown',
    text,
    undefined,
    targetId,
  )
  return getTransactionFirstBlockId(res)
}
