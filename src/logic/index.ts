import { usePlugin } from '@/main';
import { ref, watch } from 'vue';

interface EnhancerSettings {
  useVip: boolean
}

const defaultSettings: EnhancerSettings = {
  useVip: true,
}

let settings = ref<EnhancerSettings>({} as EnhancerSettings)
let STORAGE_KEY = 'SyEnhancerSettings'
let loaded = false

export function useSettings() {
  if (!loaded) {
    const plugin = usePlugin()
    plugin.loadData(STORAGE_KEY).then((res) => {
      if (res) {
        settings.value = res
      } else {
        settings.value = JSON.parse(JSON.stringify(defaultSettings))
      }
      loaded = true
    })
  }

  watch(settings, () => {
    if (loaded) {
      saveSettings()
    }
  }, {
    deep: true,
  })

  return settings
}

export function saveSettings() {
  const plugin = usePlugin()
  const info = JSON.stringify(settings.value);
  plugin.saveData(STORAGE_KEY, info)
}
