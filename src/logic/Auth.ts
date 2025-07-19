import {
  IGlobalData,
  IGlobalDataOptions,
  useGlobalData,
} from '@/modules/EnModuleControl/ModuleProvide'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  injectLocal,
  provideLocal,
} from '@vueuse/core'
import {
  computed,
  ComputedRef,
  watch,
} from 'vue'


/**
 * 注入权限模块
 */
export function provideAuthModule(authModule: IGlobalData<EnAuth>) {
  provideLocal(`${EN_MODULE_LIST.AUTH}_module`, authModule)
}
export function injectAuthModule(): IGlobalData<EnAuth> {
  const authModule = injectLocal(`${EN_MODULE_LIST.AUTH}_module`) as IGlobalData<EnAuth>
  return authModule
}

/**
 * 注入权限模块数据
 */
export function injectAuth(): IGlobalDataOptions<EnAuth> {
  const authModule = injectAuthModule()
  return authModule.moduleOptions
}

export function useAuthExternal(): IGlobalDataOptions<EnAuth> {
  const {
    moduleOptions: auth,
  } = useGlobalData<EnAuth>(EN_CONSTANTS.AUTH)
  return auth
}


/**
 * 注入权限状态相关的变量
 */
export function provideAuthStatus(authStatus: EnAuthStatus) {
  provideLocal('Auth_Status', authStatus)
}
export function injectAuthStatus(): EnAuthStatus {
  const authStatus = injectLocal('Auth_Status') as EnAuthStatus
  return authStatus
}

/**
 * 提供父级权限
 *
 * 如果父级使用过 computedLevel, 则会自动注入父级权限
 *
 * 在 `TeleportModule` 中，则可以自动获取父级的权限
 */
export function provideParentAuth(parentAuth: ComputedRef<boolean>) {
  provideLocal('parentAuth', parentAuth)
}
/**
 * 用于在 TeleportModule 中，自动获取父级的权限
 */
export function injectParentAuth(): ComputedRef<boolean> {
  const parentAuth = injectLocal('parentAuth') as ComputedRef<boolean>
  return parentAuth
}

export function initAuthData(settings) {
  // #region 权限模块

  const authStorageKey = `en_a`
  const defaultAuthData = {
    lv: 0,
    expiration: null,
  }
  const storagedAuthData = localStorage.getItem(authStorageKey)
  if (storagedAuthData) {
    const lv = storagedAuthData.slice(0, 3)
    const expiration = storagedAuthData.slice(3)
    defaultAuthData.lv = Number(lv)
    defaultAuthData.expiration = Number(expiration)
  }

  const authModule = useGlobalData<EnAuth>(EN_MODULE_LIST.AUTH, {
    defaultData: defaultAuthData,
    needSave: false,
  })

  const { moduleOptions: authModuleData } = authModule
  provideAuthModule(authModule)

  watch(authModuleData, () => {
    const {
      lv,
      expiration,
    } = authModuleData.value
    const prefix = `${lv}`.padStart(3, '0')
    const suffix = `${expiration}`
    localStorage.setItem(authStorageKey, `${prefix}${suffix}`)
  })

  const isFree = computed(() => {
    return authModuleData.value.lv === 0 && settings.value.v === 0
  })
  const isNotFree = computed(() => !isFree.value)

  const isPro = computed(() => {
    return settings.value.v === 1 || authModuleData.value.lv === 1
  })
  const isVip = computed(() => {
    return settings.value.v === 2 || authModuleData.value.lv === 99
  })
  const isPermanent = computed(() => {
    return (!!settings.value.v && settings.value.v >= 1) || authModuleData.value.lv >= 90
  })

  const levelLabel = computed(() => {
    const map = {
      0: '普通版',
      1: 'Pro',
      98: 'Inner',
      99: 'Super',
    }
    return map[authModuleData.value.lv] || (authModuleData.value.lv ? `Lv. ${authModuleData.value.lv}` : '--')
  })

  const computedLevel = (level: number | string, provideParent = true) => {
    const hasAuth = computed(() => {
      return !level || authModuleData.value.lv >= Number(level) || settings.value.v >= 1
    })
    if (provideParent) {
      provideParentAuth(hasAuth)
    }
    return hasAuth
  }

  provideAuthStatus({
    isFree,
    isNotFree,
    isPro,
    isVip,
    isPermanent,
    levelLabel,
    computedLevel,
  })
  // #endregion 权限模块
}
