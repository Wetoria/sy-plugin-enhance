import { useSyncDataWith } from '@/utils/DataManager/useDataSyncer'
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
    console.log('testRef', testRef.value.name)
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

  const need = () => {
    testRef.value.name = 'test1'
    testRef.value.name = 'test2'
  }

  const dont = () => {
    dontSync()
    testRef.value.name = 'test3'
  }

  const afterMark = () => {
    testRef.value.name = 'test4'
  }


  return {
    refData: testRef,
    needSync,
    dontSync,
    need,
    dont,
    afterMark,
  }
}
