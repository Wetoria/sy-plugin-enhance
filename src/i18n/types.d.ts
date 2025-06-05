declare interface I18nType {
  copyVideoTimestamp: string

  copyVideoTimestampMarkdown: string
  displayName: string
  pinVideo: string
  pluginName: string
  unpinVideo: string
  z_base: string
}

declare const EnI18nType: {
  [K in keyof I18nType]: string
}

declare module "*.json" {
  const value: I18nType
  export default value
}
