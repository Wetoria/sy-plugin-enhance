import { useSyncDataWith } from '@/utils/SyncData/useSyncData'
import {
  ref,
  watchEffect,
} from 'vue'

export function useTestSyncData() {

  const testRef = ref({
    name: 'test',
  })

  watchEffect(() => {
    console.log('testRef', testRef.value)
  })

  const {
    needSync,
    dontSync,
  } = useSyncDataWith('test', testRef, {
    custom: (data) => {
      console.log('custom', data)
      if (data.name === 'test4') {
        console.log('放弃更改')
      } else {
        testRef.value = data
      }
    },
  })

  const testNeedSync = () => {
    testRef.value.name = 'test1'
    testRef.value.name = 'test2'
  }

  const testDontSync = () => {
    dontSync()
    testRef.value.name = 'test3'
  }

  const testAfterMark = () => {
    testRef.value.name = 'test4'
  }


  return {
    refData: testRef,
    needSync,
    dontSync,
    testNeedSync,
    testDontSync,
    testAfterMark,
  }
}
