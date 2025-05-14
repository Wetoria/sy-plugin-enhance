import {
  onReceiveSyncData,
  sendSyncData,
} from '@/utils/SyncData/useSyncDataChannel'
import { watchDebounced } from '@vueuse/core'
import {
  Ref,
} from 'vue'

/**
 * 仅负责发送和接收需要同步的数据
 */
export function useSyncDataWith<T>(
  namespace: Namespace,
  source: Ref<T>,
  options?: {
    custom?: (data: T) => void
    debounce?: number
    maxWait?: number
  },
) {
  let dontSyncFlag = false

  const {
    custom,
    debounce = 100,
    maxWait = 500,
  } = options || {}

  const changeDontSyncFlag = (value: boolean) => {
    dontSyncFlag = value
  }

  const dontSync = () => {
    changeDontSyncFlag(true)
  }
  const needSync = () => {
    changeDontSyncFlag(false)
  }


  // 监听 source 的变化
  // debounced，避免频繁发送数据
  const unwatchSync = watchDebounced(
    source,
    () => {

      // 如果 dontSyncFlag 为 true，则不发送数据
      if (dontSyncFlag) {
        needSync()
        return
      }

      const msgData: SyncDataMsg<T> = {
        namespace,
        data: source.value,
      }
      sendSyncData(msgData)
    },
    {
      deep: true,
      debounce,
      maxWait,
    },
  )


  onReceiveSyncData((msgData: SyncDataMsg<T>) => {

    // 如果 namespace 不匹配，则不处理
    if (msgData.namespace !== namespace) {
      return
    }


    // 接收到的数据，需要标记成不同步
    dontSync()


    // 允许自定义处理更新逻辑
    if (custom) {
      custom(msgData.data)
    } else {
      source.value = msgData.data
    }
  })

  return {
    needSync,
    dontSync,
    unwatchSync,
  }
}
