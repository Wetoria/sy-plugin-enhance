import {
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'


// CF 代理
const server1 = 'https://server.wetoria.vip'
// 云服务器
const wetoriaVip = 'https://api.wetoria.vip'
const wetoriaMe = 'https://api.wetoria.me'
// IPV6 直连
const ipv6Http = 'http://api.wetoria.cn'
// IPV6 直连 HTTPS
const ipv6Https = 'https://api.wetoria.cn'

const serverList = [
  ipv6Https,
  wetoriaMe,
  wetoriaVip,
]

const validServer = ref('')
const getValidServerTimeout = 5
const getValidServer = async () => {
  for (const server of serverList) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 1000 * getValidServerTimeout)

      const res = await Promise.race([
        fetch(`${server}/ping`, {
          method: 'POST',
          signal: controller.signal,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 1000 * getValidServerTimeout),
        ),
      ])

      clearTimeout(timeoutId)

      if ((res as Response)?.ok) {
        validServer.value = server
        break
      }
    } catch (err) {
      validServer.value = ''
      continue
    }
  }
}
let getValidServerFlag = null

export function useValidServer() {

  if (!validServer.value) {
    onMounted(() => {
      getValidServer()
      if (getValidServerFlag) {
        clearTimeout(getValidServerFlag)
      }
      getValidServerFlag = setInterval(() => {
        getValidServer()
        // 30分钟检查一次可用的服务器
      }, 1000 * 60 * 30)
    })
    onBeforeUnmount(() => {
      if (getValidServerFlag) {
        clearInterval(getValidServerFlag)
      }
    })
  }

  return {
    validServer,
    getValidServer,
  }
}
