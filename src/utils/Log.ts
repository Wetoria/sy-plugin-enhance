const prefix = '[SEP by Wetoria]'
export function log(...args) {
  return console.log(`%c${prefix} `, 'background-color: gray; color: white;', ...args)
}
window.enLog = log
enLog('测试 Log')
export function warn(...args) {
  return console.warn(`%c${prefix} `, 'background-color: yellow; color: black;', ...args)
}
window.enWarn = warn
enWarn('测试 Warn')
export function error(...args) {
  return console.error(`%c${prefix} `, 'background-color: red; color: white;', ...args)
}
window.enError = error
enError('测试 Error')
