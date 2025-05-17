import { saveData } from '@/utils/DataManager/api'
import { getModuleStorageKey } from '@/utils/GlobalModule'
import { createVuePromiseQueue } from '@/utils/promiseQueue'
import { toggleSiyuanSync } from '@/utils/Siyuan'
import { Notification } from '@arco-design/web-vue'
import { watchDebounced } from '@vueuse/core'
import {
  ref,
  Ref,
} from 'vue'


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


/**
 * 仅负责发送和接收需要保存的数据
 */
export function useDataSaverWith<T>(
  namespace: Namespace,
  source: Ref<T>,
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

  const save = () => {
    let saveStatus = saveStatusMap.value[namespace]
    if (!saveStatus) {
      saveStatus = {
        saving: false,
        saved: false,
      }
      saveStatusMap.value[namespace] = saveStatus
    }

    const storageKey = getModuleStorageKey(namespace)

    queue.addPromise(namespace, async () => {
      saveStatus.saved = false
      saveStatus.saving = true
      await saveData(storageKey, source.value)
      saveStatus.saved = true
      saveStatus.saving = false
    })
  }

  const unwatchSave = watchDebounced(
    source,
    () => {
      if (dontSaveFlag) {
        needSave()
        return
      }

      save()

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
    save,
    unwatchSave,
  }
}
