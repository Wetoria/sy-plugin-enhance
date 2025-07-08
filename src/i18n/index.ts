import {
  configs,
  I18nConfigKeys,
  locales,
} from '@/i18n/config'
import {
  computed,
  reactive,
  readonly,
} from 'vue'

// 如果忘记配置，默认使用英文
export const fallbackLocale = locales.en_US

// 创建响应式的语言状态
const currentLang = reactive({
  value: window.siyuan.config.appearance.lang,
})

// 创建响应式的 i18n 对象
export const enI18n = readonly(
  reactive<Record<I18nConfigKeys, string>>(
    Object.keys(configs).reduce((acc, key) => {
      acc[key] = computed<string>(() => {
        const lang = currentLang.value
        const config = configs[key]
        console.log('config=>', config, key)

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
      })
      return acc
    }, {} as any),
  ),
)
