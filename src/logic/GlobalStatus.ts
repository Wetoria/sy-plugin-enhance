import { usePlugin } from '@/main';
import { ref } from 'vue';

interface EnhancerState {
  isSync: boolean;
  isStandalone: boolean;
}

let EnhancerState = ref<EnhancerState>({} as EnhancerState)

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
