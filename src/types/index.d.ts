/* eslint-disable unused-imports/no-unused-vars */
/**
 * Copyright (c) 2023 frostime. All rights reserved.
 */

/**
 * Frequently used data structures in SiYuan
 */
type DocumentId = string
type BlockId = string
type NotebookId = string
type PreviousID = BlockId
type ParentID = BlockId | DocumentId

interface Notebook {
  id: NotebookId
  name: string
  icon: string
  sort: number
  closed: boolean
}

interface NotebookConf {
  name: string
  closed: boolean
  refCreateSavePath: string
  createDocNameTemplate: string
  dailyNoteSavePath: string
  dailyNoteTemplatePath: string
}

type BlockType =
  | "d"
  | "s"
  | "h"
  | "t"
  | "i"
  | "p"
  | "f"
  | "audio"
  | "video"
  | "other"

type BlockSubType =
  | "d1"
  | "d2"
  | "s1"
  | "s2"
  | "s3"
  | "t1"
  | "t2"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "table"
  | "task"
  | "toggle"
  | "latex"
  | "quote"
  | "html"
  | "code"
  | "footnote"
  | "cite"
  | "collection"
  | "bookmark"
  | "attachment"
  | "comment"
  | "mindmap"
  | "spreadsheet"
  | "calendar"
  | "image"
  | "audio"
  | "video"
  | "other"

interface Block {
  id: BlockId
  parent_id?: BlockId
  root_id: DocumentId
  hash: string
  box: string
  path: string
  hpath: string
  name: string
  alias: string
  memo: string
  tag: string
  content: string
  fcontent?: string
  markdown: string
  length: number
  type: BlockType
  subtype: BlockSubType
  /**
   * string of { [key: string]: string }
   * For instance: "{: custom-type=\"query-code\" id=\"20230613234017-zkw3pr0\" updated=\"20230613234509\"}"
   */
  ial?: string
  sort: number
  created: string
  updated: string
}

interface doOperation {
  action: string
  data: string
  id: BlockId
  parentID: BlockId | DocumentId
  previousID: BlockId
  retData: null
}

interface Window {
  siyuan: {
    notebooks: any
    menus: any
    dialogs: any
    blockPanels: any
    storage: any
    user: any
    ws: any
    languages: any
  }

  enLog: typeof console.log
  enWarn: typeof console.warn
  enError: typeof console.error
  enSuccess: typeof console.log

  SEP_GLOBAL: {
    functions: {
      [key: string]: (...args: any[]) => any
    }
    pluginRef: any
    topBarEntryRef: HTMLElement
    currentProtyle: Ref<IProtyle>
    globalData: any
    globalWindowData: any
  }
}

interface IBreadcrumb {
  id: string
  name: string
  type: string
  subType: string
  children: any // You might want to replace `any` with a more specific type
}

interface backlinkData {
  dom: string
  blockPaths: IBreadcrumb[]
  expand: boolean
}

interface LifeLogItem {
  time: string
  type: string
  content: string
  syBlockId: string
  isMobile: boolean
  created: string
  updated: string
}

const enLog: typeof console.log
const enWarn: typeof console.warn
const enError: typeof console.error
const enSuccess: typeof console.log
