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
type locale = keyof typeof locales

export const fallbackLocale = 'zh_CN'

type localeConfig = Partial<Record<locale, string>>
export const enI18nConfig: Record<string, localeConfig> = {}

export const enI18n = new Proxy(enI18nConfig, {
  get(_, key: string) {
    const lang = window.siyuan.config.appearance.lang
    const config = enI18nConfig[key]
    if (!config) {
      enWarn(`i18n key [${enWarnLogText(key)}] not found`)
      return key
    }

    let targetConfig = config[lang]
    if (!targetConfig) {
      enWarn(`i18n config for key [${enWarnLogText(key)}] with lang [${enWarnLogText(lang)}] not found, ready to use fallback locale [${enWarnLogText(fallbackLocale)}]`)
      targetConfig = config[fallbackLocale]
    }
    const i18nValue = targetConfig
    if (!i18nValue) {
      enWarn(`i18n value [${enWarnLogText(key)}] not found`)
      return key
    }
    return i18nValue
  },
})


Object.assign(enI18nConfig, {
  hello: {
    zh_CN: '你好',
  },
})
