import {
  injectSettings,
} from '@/modules/EnModuleControl/ModuleProvide'
import { moduleEnableStatusSwitcher } from '@/utils'


import { onCountClick } from '@/utils/DOM'


import {
  onBeforeUnmount,
  ref,
  watchEffect,
} from 'vue'

// #region 控制设置页面的显示

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

// #endregion 控制设置页面的显示




// 设置页面 手势控制的 Ref
export const enSettingsMainContentRef = ref<HTMLDivElement>()


export const useDebugSwitcher = () => {
  const settings = injectSettings()
  // 点击设置标题切换调试模式
  const onTitleClicked = onCountClick((count) => {
    if (count >= 10) {
      settings.value.isDebugging = !settings.value.isDebugging
    }
  })
  watchEffect(() => {
    moduleEnableStatusSwitcher('EnDebugging', settings.value.isDebugging)
  })
  onBeforeUnmount(() => {
    moduleEnableStatusSwitcher('EnDebugging')
  })

  return {
    onTitleClicked,
  }
}

