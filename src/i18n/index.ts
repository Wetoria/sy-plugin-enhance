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

// 如果忘记配置，默认使用英文
export const fallbackLocale = locales.en_US

type localeConfig = Partial<Record<locale, string>>
export const enI18nConfig: Record<string, localeConfig> = {}

const resultMap = new Map<string, string>()

export const enI18n = new Proxy(enI18nConfig, {
  get(_, key: string) {
    // 跳过 Vue 内部属性
    if (key === '__v_isRef' || key === '__isVue') {
      return undefined
    }
    if (resultMap.has(key)) {
      return resultMap.get(key)
    }
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
    resultMap.set(key, i18nValue)
    return i18nValue
  },
}) as typeof EnI18nType

const leaves = {
  zh_CN: '叶归',
  en_US: 'Fallen Leaves',
}

const configs = {
  leaves,
  pluginName: leaves,
}

Object.assign(enI18nConfig, configs)
