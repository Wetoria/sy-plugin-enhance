
import { useDataSaverWith } from '@/utils/DataManager/useDataSaver'
import { useSyncDataWith } from '@/utils/DataManager/useDataSyncer'
import {
  ref,
  watchEffect,
} from 'vue'

export function useTestSaveAndSyncData() {

  const testRef = ref({
    name: 'test',
  })

  watchEffect(() => {
    console.log('testRef', testRef.value)
    console.log('testRef', testRef.value.name)
  })

  const {
    dontSave,
    needSave,
  } = useDataSaverWith('test', testRef)

  const {
    dontSync,
    needSync,
  } = useSyncDataWith('test', testRef)

  const need = () => {
    testRef.value.name = 'test1'
    testRef.value.name = 'test2'
  }

  const dont = () => {
    dontSave()
    dontSync()
    testRef.value.name = 'test3'
  }

  const markDontSave = () => {
    dontSave()
    testRef.value.name = 'test5'
  }
  const markDontSync = () => {
    dontSync()
    testRef.value.name = 'test6'
  }

  const afterMark = () => {
    testRef.value.name = 'test4'
  }


  return {
    refData: testRef,
    dontSave,
    needSave,
    dontSync,
    needSync,
    need,
    dont,
    afterMark,
    markDontSave,
    markDontSync,
  }
}
