import { reactive } from 'vue';

interface EnhancerGlobal {
  modules: {
    [module: string]: {
      enabled: boolean
      options: object
      defaultOptions: object
    }
  }
}

export let EnhancerGlobal = reactive<EnhancerGlobal>({
  modules: {}
} as EnhancerGlobal)

export interface BaseModule extends Object {
  enabled?: boolean
}

export function registerModule(module: string, defaultOptions: BaseModule) {
  const isInSetting = module in EnhancerGlobal.modules
  if (!isInSetting) {
    EnhancerGlobal.modules[module] = {
      enabled: false,
      options: defaultOptions,
      defaultOptions: defaultOptions,
    }
  }
}

export function resetModuleOptions(module: string) {
  const targetModule = EnhancerGlobal.modules[module]
  if (!targetModule) {
    return
  }
  targetModule.options = targetModule.defaultOptions || {}
}
