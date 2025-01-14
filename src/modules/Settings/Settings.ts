import {
  injectSettings,
} from '@/modules/EnModuleControl/ModuleProvide'
import { moduleEnableStatusSwitcher } from '@/utils'


import { onCountClick } from '@/utils/DOM'


import {
  EnSyncModuleData,
  EnSyncModuleDataRef,
  getModuleRefByNamespace,
  useSyncModuleData,
} from '@/utils/SyncData'
import {
  computed,
  ComputedRef,
  ref,
  watch,
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




// #region 离线模式下的权限控制

const switchID = (time) => {
  const settings = injectSettings()
  let v = settings.value.v
  if (time >= 11 && time < 20) {
    v = v > 0 ? 0 : 1
  } else if (time >= 20) {
    v = 2
  }
  settings.value.l = settings.value.v
  settings.value.v = v
}
export const entryOpenSettings = onCountClick((time) => {
  if (time >= 11) {
    switchID(time)
  } else {
    openSettings()
  }
})


// #endregion 离线模式下的权限控制


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

  return {
    onTitleClicked,
  }
}


// export const isFree = computed(() => {
//   const settings = useSettings()
//   const authModuleData = inject(EN_CONSTANTS.AUTH) as ComputedRef<EnAuth>
//   return authModuleData.value.lv === 0 && settings.value.v === 0
// })
// export const isNotFree = computed(() => !isFree.value)

// export const isPro = computed(() => {
//   const settings = useSettings()
//   const authModuleData = inject(EN_CONSTANTS.AUTH) as ComputedRef<EnAuth>
//   return settings.value.v === 1 || authModuleData.value.lv === 1
// })
// export const isVip = computed(() => {
//   const settings = useSettings()
//   const authModuleData = inject(EN_CONSTANTS.AUTH) as ComputedRef<EnAuth>
//   return settings.value.v === 2 || authModuleData.value.lv === 99
// })

// watchEffect(() => {
//   console.log('flag is ', isFree.value, isPro.value, isVip.value, isNotFree.value)
// })






export interface EnModuleOptions<T extends EnModule> {
  defaultData: T
}

export interface EnSettingModule<T extends EnModule>
  extends EnSyncModuleData<T>
{

}
export interface EnSettingModuleRef<T extends EnModule>
  extends EnSyncModuleDataRef<T>
{

}


export function useSettingModule<T extends EnModule>(
  moduleName: string,
  moduleOptions: EnModuleOptions<T> = {} as EnModuleOptions<T>,
): EnSettingModuleRef<T> {
  const {
    defaultData,
  } = moduleOptions

  const module: EnSettingModuleRef<T> = useSyncModuleData<T>({
    namespace: moduleName,
    defaultData,
  })

  // const recorded = settings.value.modules[moduleName]
  // if (!recorded) {
  // }

  return module
}


export interface EnSettingModuleDataRef<T extends EnModule> extends ComputedRef<T> {
}

export function useSettingModuleData<T extends EnModule>(moduleName: string): EnSettingModuleDataRef<T> {
  const module = getModuleRefByNamespace<T>(moduleName)
  const moduleData = computed(() => module.value.data)
  return moduleData
}


export const useProWatcher = (props: {
  onChange?: (enabled: boolean) => void
  onEnabled?: () => void
  onDisabled?: () => void
}) => {
  const {
    onChange = () => {},
    onEnabled = () => {},
    onDisabled = () => {},
  } = props

  const settings = injectSettings()
  watch(() => settings.value.v, () => {
    const lastEnabled = settings.value.l >= 1
    const enabled = settings.value.v >= 1
    if (lastEnabled === enabled) {
      return
    }
    onChange(enabled)
    if (enabled) {
      onEnabled()
    } else {
      onDisabled()
    }
  }, {
    immediate: true,
  })
}
