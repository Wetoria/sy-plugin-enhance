import { request } from '@/api'
import { todayStr } from './Date';
// import { request } from './DailyNoteHelper';

function getDocPath(noteId) {
  return `siyuan://blocks/${noteId}`
}

function openFileByURL(path) {
  // @ts-expect-error openFileByURL 是 SiYuan 的 API，但未在 siyuan.d.ts 中定义
  window.openFileByURL(path)
}

export function openDoc(note) {
  const path = getDocPath(note.id)
  openFileByURL(path)
}

export function openDocById(noteId) {
  const path = getDocPath(noteId)
  openFileByURL(path)
}

export function getDailyNote(notebookId: NotebookId) {
  const today = todayStr()
  const data = {
    stmt: `
    SELECT
      *
    FROM
      blocks
    WHERE
      1=1
      and box='${notebookId}'
      and type='d'
      and hpath REGEXP '/daily note.*/${today}$'
      and fcontent = '${today}'
      limit 1
    `,
  };
  return request(
    "/api/query/sql",
    data,
  );
}
