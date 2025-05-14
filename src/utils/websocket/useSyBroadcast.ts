import {
  useWebSocket,
  UseWebSocketOptions,
} from '@vueuse/core'
import { computed } from 'vue'

export const useSyBroadcast = (channel: string, options?: UseWebSocketOptions) => {
  const wsUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/broadcast?channel=${channel}`

  const {
    status,
    data,
    send,
    open,
    close,
  } = useWebSocket(wsUrl, options)

  const isOpen = computed(() => {
    return status.value === 'OPEN'
  })

  return {
    status,
    isOpen,
    data,
    send,
    open,
    close,
  }
}
