import { usePlugin } from '@/main';
import { debounce } from '@/utils';
import { computed, ref, watch } from 'vue';

export interface EnModule {
  enabled: boolean
  options: object
  defaultOptions: object
}

interface EnSettings {
  useVipStyle: boolean;
  boxId: string;

  floatingBallPlatform: 'all' | 'only-mobile' | 'none';

  showMobileNavLabel: boolean;
  mobileSwitchDocMode: 'doc' | 'dailyNote';

  enableBlockTime: boolean;
  blockTimeFontSize: number;

  enableBottomBacklink: boolean;
  enableBacklinkFilter: boolean;
  defaultShowBacklinkFilter: boolean;
  sqlLimit: number;

  lifelogPostUrl: string;
  lifelogEnableBlockTag: boolean;
  lifelogTriggerTime: number;

  enableAutoSync: boolean;

  enableFixedDocArea: boolean;
  fixedDocIds: string[];

  enableLockParagraph: boolean;

  modules: {
    [module: string]: EnModule
  }
}

const defaultSettings: EnSettings = {
  useVipStyle: true,
  boxId: '',
  sqlLimit: 999999999,
  floatingBallPlatform: 'all',
  showMobileNavLabel: false,
  mobileSwitchDocMode: 'doc',
  enableBottomBacklink: true,
  enableBacklinkFilter: true,
  enableBlockTime: true,
  blockTimeFontSize: 9,
  defaultShowBacklinkFilter: false,

  lifelogPostUrl: '',
  lifelogEnableBlockTag: true,
  lifelogTriggerTime: 5,

  enableAutoSync: false,

  enableFixedDocArea: true,
  fixedDocIds: [],

  enableLockParagraph: true,
  modules: {},
}

let doNotSave = false
let settings = ref<EnSettings>({
  modules: {},
} as EnSettings)
watch(settings, () => {
  if (doNotSave) {
    doNotSave = false
    return
  }
  saveSettings()
}, {
  deep: true,
})

let STORAGE_KEY = 'SyEnhancerSettings'

export function useSettings() {
  return settings
}

export function useModule(moduleName: string, defaultOptions: object) {
  const module = ref<EnModule>(settings.value.modules[moduleName])

  if (!module.value) {
    module.value = registerModule(moduleName, defaultOptions)
  }
  // 刷一次默认值设置，防止出现问题
  // 比如 module 的数据已经保存过了，但是更新了代码。
  module.value.defaultOptions = defaultOptions
  return module
}

export function registerModule(module: string, defaultOptions: object) {
  const isInSetting = module in settings.value.modules
  const newModule = {
    enabled: false,
    options: defaultOptions,
    defaultOptions: defaultOptions,
  }
  if (!isInSetting) {
    settings.value.modules[module] = newModule
  }
  return newModule
}

export async function loadSettings() {
  const plugin = usePlugin()
  const res = await plugin.loadData(STORAGE_KEY)
  if (res) {
    settings.value = Object.assign({}, defaultSettings, settings.value, res)
  } else {
    settings.value = Object.assign({}, JSON.parse(JSON.stringify(defaultSettings)), settings.value)
  }
  if (!settings.value.modules) {
    settings.value.modules = {}
  }
}

/**
 * 修正设置中，错误的值
 */
function reviseSettingsValue() {
  if (isNaN(settings.value.sqlLimit)) {
    settings.value.sqlLimit = defaultSettings.sqlLimit
  }
}

export const saveSettings = debounce(()=> {
  const plugin = usePlugin()

  // 保存前对值进行校验和修正。
  reviseSettingsValue()

  const info = JSON.stringify(settings.value);
  plugin.saveData(STORAGE_KEY, info)
  localStorage.setItem(STORAGE_KEY, info)
})

export const syncLocalStorage = (event) => {
  if (event.key === STORAGE_KEY) {
    const newSettings = JSON.parse(event.newValue)
    doNotSave = true
    settings.value = newSettings
  }
}
