import {
  ref,
} from 'vue'

export const settingsVisible = ref(false)
export const openSettings = () => {
  settingsVisible.value = true
}

export const closeSettingsPanel = () => {
  settingsVisible.value = false
}

export const switchSettingsDisplay = () => {
  if (settingsVisible.value) {
    closeSettingsPanel()
  } else {
    openSettings()
  }
}
