import {
  configs,
  I18nConfigKeys,
  locales,
} from '@/i18n/config'

// 如果忘记配置，默认使用英文
export const fallbackLocale = locales.en_US

// const resultMap = new Map<string, string>()

// 创建响应式的 i18n 对象
export const enI18n = new Proxy({}, {
  get(_, key: string) {
    const config = configs[key]
    if (config) {
      return config[window.siyuan.config.appearance.lang]
    }
    return undefined
    // if (resultMap.has(key)) {
    //   return resultMap.get(key)
    // }
    // const lang = window.siyuan.config.appearance.lang
    // const config = configs[key]
    // if (!config) {
    //   enWarn(`i18n key [${enWarnLogText(key)}] not found`)
    //   return key
    // }

    // let targetConfig = config[lang]
    // if (!targetConfig) {
    //   enWarn(`i18n config for key [${enWarnLogText(key)}] with lang [${enWarnLogText(lang)}] not found, ready to use fallback locale [${enWarnLogText(fallbackLocale)}]`)
    //   targetConfig = config[fallbackLocale]
    // }
    // const i18nValue = targetConfig
    // if (!i18nValue) {
    //   enWarn(`i18n value [${enWarnLogText(key)}] not found`)
    //   return key
    // }
    // resultMap.set(key, i18nValue)
    // return i18nValue
  },
}) as Record<I18nConfigKeys, string>
