import { createDocWithMd, request } from '@/api'
import dayjs from 'dayjs';
import { todayStr } from './Date';
// import { request } from './DailyNoteHelper';

function getDocPath(noteId) {
  return `siyuan://blocks/${noteId}`
}

function openFileByURL(path) {
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

export function createDailyNote(notebookId: NotebookId) {
  const today = dayjs();
  // IMP 可以配置
  const path = `/daily note/${today.format('YYYY/MM/YYYY-MM-DD')}`
  createDocWithMd(notebookId, path, '')
    .then((res) => {
      openDocById(res);
    })
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
