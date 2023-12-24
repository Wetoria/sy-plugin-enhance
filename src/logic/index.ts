import { usePlugin } from '@/main';
import { debounce } from '@/utils';
import { ref, watch } from 'vue';

interface EnhancerSettings {
  useVipStyle: boolean;
  boxId: string;
  sqlLimit: number;
  floatingBallPlatform: 'all' | 'only-mobile' | 'none';
  showMobileNavLabel: boolean;
  mobileSwitchDocMode: 'doc' | 'dailyNote';
  enableBottomBacklink: boolean;
  enableBacklinkFilter: boolean;

  enableBlockTime: boolean;
  blockTimeFontSize: number;

  defaultShowBacklinkFilter: boolean;

  lifelogPostUrl: string;
  lifelogEnableBlockTag: boolean;
}

const defaultSettings: EnhancerSettings = {
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
}

let doNotSave = false
let settings = ref<EnhancerSettings>({} as EnhancerSettings)
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
let loaded = false

export function useSettings() {
  if (!loaded) {
    loadSettings()
  }
  return settings
}

export function loadSettings() {
  const plugin = usePlugin()
  plugin.loadData(STORAGE_KEY).then((res) => {
    if (res) {
      settings.value = Object.assign({}, defaultSettings, res)
    } else {
      settings.value = JSON.parse(JSON.stringify(defaultSettings))
    }
    loaded = true
  })
}

function reviseSettingsValue() {
  if (isNaN(settings.value.sqlLimit)) {
    settings.value.sqlLimit = defaultSettings.sqlLimit
  }

  const blockTimeFontSize = settings.value.blockTimeFontSize
  if (blockTimeFontSize < 9) {
    settings.value.blockTimeFontSize = 9
  }
  if (blockTimeFontSize > 16) {
    settings.value.blockTimeFontSize = 16
  }
}

export const saveSettings = debounce(()=> {
  const plugin = usePlugin()

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
