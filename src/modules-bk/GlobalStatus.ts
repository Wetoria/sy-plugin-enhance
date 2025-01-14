import { usePlugin } from '@/main'
import { ref } from 'vue'

interface IEnhancerState {
  isSync: boolean
  isStandalone: boolean
}

const EnhancerState = ref<IEnhancerState>({} as IEnhancerState)

export function useEnhancer() {
  const plugin = usePlugin()
  plugin.eventBus.on('sync-start', () => {
    EnhancerState.value.isSync = true
  })
  plugin.eventBus.on('sync-end', () => {
    EnhancerState.value.isSync = false
  })
  plugin.eventBus.on('sync-fail', () => {
    EnhancerState.value.isSync = false
  })
  return EnhancerState
}
