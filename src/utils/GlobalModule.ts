import { reactive } from 'vue'

window.SEP_GLOBAL = reactive({
  functions: {},
} as any)


export function getModuleStorageKey(namespace: Namespace) {
  // 前缀 SEP 不能改，否则旧版本的数据会有问题
  return `SEP-${namespace}`
}
