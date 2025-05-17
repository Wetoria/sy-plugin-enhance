import { useDataLoaderWith } from '@/utils/DataManager/useDataLoader'
import {
  ref,
  watchEffect,
} from 'vue'

export function testAsyncData() {
  const data = ref({})
  const {
    loading,
    loaded,
    isReady,
    load,
    onInit,
  } = useDataLoaderWith('test', data)

  onInit(() => {
    console.log('onInit')
  })
  watchEffect(() => {
    console.log(`isLoading: ${loading.value}, isLoaded: ${loaded.value}, isReady: ${isReady.value}`)
    console.log(`data: `, data.value)
  })

  return {
    data,
    loading,
    loaded,
    isReady,
    load,
  }
}
