import { debounce } from '@/utils'
import { EN_MODULE_LIST } from '@/utils/Constants'
import { getColorStringError } from '@/utils/Log'
import {
  getModuleRefByNamespace,
} from '@/utils/SyncData'
import {
  computed,
  ref,
} from 'vue'





// #region 模块 TeleportRef 的控制逻辑


const settingRefKeys = ref<string[]>([])
export const settingsRefMap = ref({})

export function registerSettingRef(refName: string) {
  const registered = settingRefKeys.value.includes(refName)
  let settingRef = settingsRefMap.value[refName]
  if (!registered) {
    settingRef = ref()
    settingRefKeys.value.push(refName)
    settingsRefMap.value[refName] = settingRef
  }

  enSuccess('Setting Ref Registered', refName)
  return settingRef
}

export function unregisterSettingRef(refName: string) {
  settingRefKeys.value = settingRefKeys.value.filter((key) => {
    if (key === refName) {
      return false
    }
    return true
  })
  enSuccess('Setting Ref Unregistered', refName)
}


export function resetModuleOptions<T>(aModule: EnSyncModuleDataRef<T>) {
  aModule.value.data = JSON.parse(JSON.stringify(aModule.value.defaultValue))
}

export const resetAllModule = () => {
  settingRefKeys.value.forEach((moduleName) => {
    const moduleRef = getModuleRefByNamespace(moduleName)
    resetModuleOptions(moduleRef)
  })
}


const moduleOrder = [
  EN_MODULE_LIST.DAILY_NOTE,
  EN_MODULE_LIST.QUICK_NOTE,
  'EnComment',
  EN_MODULE_LIST.EN_WHITE_BOARD,
  'EnBottomBacklink',
  'EnLifeLog',
]

// 将模块进行排序，用于固定在设置页面的顺序
export const settingRefKeysSorted = computed(() => {
  const moduleKeys = settingRefKeys.value
  enLog(getColorStringError('moduleKeys is'), moduleKeys)

  moduleKeys.sort((a, b) => {
    const aIndex = moduleOrder.findIndex((moduleName) => moduleName === a)
    const bIndex = moduleOrder.findIndex((moduleName) => moduleName === b)
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }
    if (aIndex !== -1 && bIndex === -1) {
      return -1
    }
    if (aIndex === -1 && bIndex !== -1) {
      return 1
    }
    return 0
  })

  return moduleKeys
})

// #endregion 模块 TeleportRef 的控制逻辑






// #region 控制设置页面的模块滚动逻辑



export const settingModulesList = computed(() => {
  return settingRefKeysSorted.value.map((moduleKey) => {
    const moduleRef = getModuleRefByNamespace<EnModule>(moduleKey)
    return moduleRef.value.data
  })
})

const changedByClick = ref(false)
export const currentModuleIndex = ref(0)
export const onSelectModule = (index: number) => {
  currentModuleIndex.value = index
  const moduleInfo = settingModulesList.value[index]
  const el = document.querySelector(`[data-en-setting-ref-module-name="${moduleInfo.moduleName}"]`) as HTMLDivElement
  if (el) {
    changedByClick.value = true
    el.scrollIntoView({
      behavior: 'smooth',
    })
  }
}

const triggerScrollEnd = debounce(() => {
  enLog('scroll end')
  changedByClick.value = false
}, 300)

export const onSettingListScroll = (e: Event) => {
  if (changedByClick.value) {
    triggerScrollEnd()
    return
  }

  const target = e.target as HTMLElement
  const targetRect = target.getBoundingClientRect()

  // 获取所有模块元素
  const moduleElements = Array.from(document.querySelectorAll('[data-en-setting-ref-module-name]'))

  // 找到当前在视口中最靠近顶部的模块
  let closestModule = null
  let minDistance = Infinity

  moduleElements.forEach((el) => {
    const rect = el.getBoundingClientRect()
    const distance = Math.abs(rect.top - targetRect.top)

    if (distance < minDistance) {
      minDistance = distance
      closestModule = el
    }
  })

  if (closestModule) {
    const moduleName = closestModule.getAttribute('data-en-setting-ref-module-name')
    const moduleIndex = settingModulesList.value.findIndex((m) => m.moduleName === moduleName)
    if (moduleIndex !== -1) {
      currentModuleIndex.value = moduleIndex
      const el = document.querySelector(`[data-en-setting-module-index="${moduleIndex}"]`) as HTMLDivElement
      if (el) {
        el.scrollIntoView({
          behavior: 'auto',
          block: 'nearest',
        })
      }
    }
  }
}

// #endregion 控制设置页面的模块滚动逻辑
