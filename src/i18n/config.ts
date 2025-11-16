// 思源支持的语言类型
export enum locales {
  ar_SA = 'ar_SA',
  de_DE = 'de_DE',
  en_US = 'en_US',
  es_ES = 'es_ES',
  fr_FR = 'fr_FR',
  he_IL = 'he_IL',
  it_IT = 'it_IT',
  ja_JP = 'ja_JP',
  pl_PL = 'pl_PL',
  ru_RU = 'ru_RU',
  zh_CHT = 'zh_CHT',
  zh_CN = 'zh_CN',
}
export type locale = keyof typeof locales

export type localeConfig = {
  zh_CN: string
  en_US: string
} & Partial<Record<locale, string>>


const leaves = {
  zh_CN: '叶归',
  en_US: 'Leaf Nest',
}

export const configs = {
  leaves,
  pluginName: leaves,

  copyVideoTimestamp: {
    zh_CN: '复制时间戳（url）',
    en_US: 'Copy timestamp (url)',
  },
  copyVideoTimestampMarkdown: {
    zh_CN: '复制时间戳（markdown）',
    en_US: 'Copy timestamp (markdown)',
  },
  displayName: {
    zh_CN: '叶归｜音视频工具',
    en_US: 'FL｜Video/Audio Tools',
  },
  pinVideo: {
    zh_CN: '钉住',
    en_US: 'Pin',
  },
  unpinVideo: {
    zh_CN: '取消钉住',
    en_US: 'Unpin',
  },

  lifelogInsertCurrentTime: {
    zh_CN: '插入当前时间',
    en_US: 'Insert current time',
  },

  refreshSiyuan: {
    zh_CN: '刷新思源',
    en_US: 'Refresh SiYuan',
  },

  EnParagraphBlock_BlockTime_Toggle: {
    zh_CN: '显示/隐藏块时间',
    en_US: 'Show or Hide block time',
  },
} satisfies Record<string, localeConfig>

export type I18nConfigKeys = keyof typeof configs
export type I18nConfig = typeof configs
