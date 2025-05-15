import { loadData } from '@/utils/DataManager'
import { getModuleStorageKey } from '@/utils/GlobalModule'
import { Notification } from '@arco-design/web-vue'
import {
  Ref,
  ref,
} from 'vue'

export function useAsyncPluginData<T>(
  namespace: Namespace,
  source: Ref<T>,
  options?: {
    custom?: (data: T) => void
  },
) {

  const {
    custom,
  } = options || {}

  const storageKey = getModuleStorageKey(namespace)

  const loading = ref(false)
  const loaded = ref(false)
  const isReady = ref(false)

  let onInitCallback = null
  function onInit(callback) {
    onInitCallback = callback
    return this
  }

  const load = async () => {
    loading.value = true
    isReady.value = false
    try {
      const res = await loadData(storageKey) as any
      loading.value = false
      loaded.value = true
      if (res?.code === 404) {
        // 没有数据，需要在外面标记 isReady 为 true
        onInitCallback?.()
        return
      }
      if (res.code) {
        throw new Error(res.msg)
      }

      if (custom) {
        // 需要在外面标记 isReady 为 true
        custom(res)
      } else {
        source.value = res
        isReady.value = true
      }
    } catch (err) {
      loading.value = false
      enError(`Async plugin data load failed: `, err)
      Notification.error({
        title: 'Async plugin data load failed',
        content: err.message,
      })
    }
  }

  return {
    loading,
    loaded,
    isReady,
    load,
    onInit,
  }
}
