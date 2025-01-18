/* eslint-disable node/prefer-global/process */
export const getOS = () => {
  // 如果是 Electron 环境
  if (typeof process !== 'undefined') {
    return {
      isMac: process.platform === 'darwin',
      isWindows: process.platform === 'win32',
    }
  }

  // 降级到浏览器环境判断
  const userAgent = window.navigator.userAgent.toLowerCase()
  return {
    isMac: /macintosh|mac os x/i.test(userAgent),
    isWindows: /win32|win64|windows|wince/i.test(userAgent),
  }
}
