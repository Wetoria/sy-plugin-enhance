import {
  ISearchOption,
  showMessage,
  openWindow,
} from "siyuan";
import dayjs from "dayjs";
import { getNotebookConf, lsNotebooks } from '@/api';
import { usePlugin } from '@/main';
import { createDailyNote, getDailyNote, openDoc } from './Note';

export async function request(url: string, options: object) {
  return fetch(url, options).then((res) => {
    return res.json();
  });
}

async function getCurrentDocInfoById(currentDocId: string) {
  const data = {
    stmt: `SELECT * FROM blocks WHERE id = "${currentDocId}" and type="d"`,
  };
  const url = "/api/query/sql";
  return request(url, {
    body: JSON.stringify(data),
    method: "POST",
  }).then(function (resp) {
    const { data } = resp;
    if (data && data.length === 1) {
      return data[0];
    }
    return null;
  });
}

async function getSlideDailyNote(next = true, newDate: string) {
  const data = {
    stmt: `SELECT
      *
    FROM
      blocks
    WHERE
      1=1
      and type='d'
      and hpath REGEXP '/daily note.*/[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      and fcontent ${next ? ">=" : "<="} '${newDate}'
      order by
        fcontent ${next ? "asc" : "desc"}
      limit 1
    `,
  };
  const url = "/api/query/sql";
  return request(url, {
    body: JSON.stringify(data),
    method: "POST",
  }).then(function (resp) {
    const { data } = resp;
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
  const currentDocTitleDom: HTMLDivElement = document.querySelector(
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
  const dataInfo: ISearchOption = await getCurrentDocInfoById(currentDocId);

  if (!dataInfo) {
    return;
  }

  const { hpath } = dataInfo;
  const dailyNotePathReg = /\/daily note.*\/\d{4}-\d{2}-\d{2}$/;
  const isDailyNote = dailyNotePathReg.test(hpath);

  if (!isDailyNote) {
    showMessage("请打开一篇日记");
    return;
  }

  let newDate = "";
  hpath.replace(/\d{4}-\d{2}-\d{2}/, (match: string) => {
    const cDate = dayjs(match);
    const nDate = cDate[next ? "add" : "subtract"](1, "day");
    newDate = nDate.format("YYYY-MM-DD");
    return newDate;
  });
  const prevDailyNoteInfo = await getSlideDailyNote(next, newDate);

  if (!prevDailyNoteInfo) {
    showMessage(`未找到${next ? "下" : "上"}一篇日记`);
    return;
  }

  window.open(`siyuan://blocks/${prevDailyNoteInfo.id}`);
}

export function createTodayDailyNote() {
  lsNotebooks().then(async (res) => {
    const {
      notebooks = [],
    } = res
    if (!notebooks.length) {
      // TODO 增加提示
      return
    }

    const openedNotebookList = notebooks.filter(i => !i.closed)

    if (!openedNotebookList.length || openedNotebookList.length !== 1) {
      // TODO 增加提示
      return
    }

    const currentNoteBook = openedNotebookList[0];
    const {
      id: notebookId,
    } = currentNoteBook;

    const dailyNote = await getDailyNote(notebookId)
    if (!dailyNote || dailyNote.length === 0) {
      createDailyNote(notebookId)
      return
    }

    if (dailyNote.length !== 1) {
      return
    }
    const todayNote = dailyNote[0]
    openDoc(todayNote)
  })
}
