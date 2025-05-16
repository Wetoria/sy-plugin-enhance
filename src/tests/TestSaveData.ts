
import { useSavedData } from '@/utils/DataManager/useDataSaver'
import {
  ref,
  watchEffect,
} from 'vue'

export function useTestSaveData() {

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
  } = useSavedData('test', testRef)

  const need = () => {
    testRef.value.name = 'test1'
    testRef.value.name = 'test2'
  }

  const dont = () => {
    dontSave()
    testRef.value.name = 'test3'
  }

  const afterMark = () => {
    testRef.value.name = 'test4'
  }


  return {
    refData: testRef,
    dontSave,
    needSave,
    need,
    dont,
    afterMark,
  }
}
