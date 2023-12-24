import { usePlugin } from '@/main';
import { debounce } from '@/utils';
import { onEditorUpdate } from '@/utils/Siyuan';
import { ref, watch, watchEffect } from 'vue';
import { useEnhancer } from './GlobalStatus';

interface EnhancerSettings {
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

  enableAutoSync: boolean;
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
  enableAutoSync: false,
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

export function autoSync() {
  const settings = useSettings()

  const plugin = usePlugin()
  const state = useEnhancer()

  let needSync: HTMLDivElement = null
  watchEffect(() => {
    if (!state.value.isSync && needSync) {
      needSync.click()
      needSync = null
    }
  })
  const startSync = () => {
    const dom = document.body.querySelector(plugin.isMobile ? '#menuSyncNow' : '#barSync') as HTMLDivElement
    if (!dom) {
      console.warn('调用同步功能失败：未找到同步按钮。')
      return
    }

    if (!state.value.isSync) {
      dom.click();
    } else {
      needSync = dom
    }
  }

  let firedByEnter = false
  const enterPressListener = (event) => {
    if (event.key !== 'Enter') {
      return
    }
    firedByEnter = true
    startSync()
  }

  let registered = false

  let destroyEvent = null
  const init = () => {
    if (registered) {
      return
    }
    destroyEvent = onEditorUpdate(() => {
      if (firedByEnter) {
        firedByEnter = false
        return
      }
      startSync()
    }, 2000)

    document.body.addEventListener('keydown', enterPressListener, true)
    registered = true
  }
  const destroy = () => {
    if (destroyEvent) {
      destroyEvent()
    }
    document.body.removeEventListener('keydown', enterPressListener)
    registered = false
  }

  watchEffect(() => {
    if (settings.value.enableAutoSync) {
      init()
    } else {
      destroy()
    }
  })
}
