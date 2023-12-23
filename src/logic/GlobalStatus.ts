import { ref } from 'vue';

interface EnhancerState {
  isSync: boolean;
}


let EnhancerState = ref<EnhancerState>({} as EnhancerState)

export function useEnhancer() {
  return EnhancerState
}
