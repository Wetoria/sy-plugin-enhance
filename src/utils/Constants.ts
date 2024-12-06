
export enum EN_CONSTANTS {
  BACKGROUND_IMG = 'EnBackgroundImg',
  BACKGROUND_IMG_DISPLAY = '背景图',

  DAILY_NOTE = 'DailyNote',
  DAILY_NOTE_DISPLAY = '日记',

  MODULE_PROVIDER_KEY = 'EnModule',

  SETTINGS = 'EnSettings',
  SETTINGS_ITEM_MODE_HORIZONTAL = 'horizontal',
  SETTINGS_ITEM_MODE_VERTICAL = 'vertical',
}

/* eslint-disable perfectionist/sort-enums */
export enum EN_MODULE_LIST {
  SETTINGS = EN_CONSTANTS.SETTINGS,
  // eslint-enable perfectionist/sort-enums
  BACKGROUND_IMG = EN_CONSTANTS.BACKGROUND_IMG,
  DAILY_NOTE = EN_CONSTANTS.DAILY_NOTE,
}
