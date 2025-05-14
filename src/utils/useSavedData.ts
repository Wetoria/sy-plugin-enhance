import { saveData } from '@/utils/DataManager'
import { createVuePromiseQueue } from '@/utils/promiseQueue'
import { toggleSiyuanSync } from '@/utils/Siyuan'
import { Namespace } from '@/utils/SyncData'
import { Notification } from '@arco-design/web-vue'
import { watchDebounced } from '@vueuse/core'
import { ref, Ref } from 'vue'

export function getModuleStorageKey(namespace: Namespace) {
  // 前缀 SEP 不能改，否则旧版本的数据会有问题
  return `SEP-${namespace}`
}



async function checkAndSyncSiyuan() {
  // console.log(`checkAndSyncSiyuan`)
  await toggleSiyuanSync()
}

const queue = createVuePromiseQueue()
// 假设所有的保存请求都是能正常完成
queue.onSuccess(() => {
  checkAndSyncSiyuan()
}).onError((errors) => {
  const errorNamespaceList = errors.map((error) => error.key)
  Notification.error(`叶归｜数据保存失败: ${errorNamespaceList.join(', ')}`)
})

const saveStatusMap = ref<{
  [namespace: Namespace]: {
    saving: boolean
    saved: boolean
  }
}>({})

export function useSavedData<T>(
  namespace: Namespace,
  source: Ref<T, any>,
  options?: {
    debounce?: number
    maxWait?: number
  },
) {
  const {
    debounce = 100,
    maxWait = 500,
  } = options || {}

  let dontSaveFlag = false

  const dontSave = () => {
    dontSaveFlag = true
  }

  const needSave = () => {
    dontSaveFlag = false
  }

  watchDebounced(
    source,
    () => {
      if (dontSaveFlag) {
        needSave()
        return
      }

      let saveStatus = saveStatusMap.value[namespace]
      if (!saveStatus) {
        saveStatus = {
          saving: false,
          saved: false,
        }
        saveStatusMap.value[namespace] = saveStatus
      }

      const storageKey = getModuleStorageKey(namespace)

      queue.addPromise(namespace, () => new Promise(async (resolve) => {
        saveStatus.saved = false
        saveStatus.saving = true
        await saveData(storageKey, source.value)
        saveStatus.saved = true
        saveStatus.saving = false
        resolve(true)
      }))

    },
    {
      deep: true,
      debounce,
      maxWait,
    },
  )

  return {
    dontSave,
    needSave,
  }
}
