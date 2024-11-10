const prefix = '[SEP by Wetoria]'
const isDebug = true

export function enLog(...args) {
  if (!isDebug) return
  return console.log(`%c${prefix} `, 'background-color: gray; color: white;', ...args)
}
window.enLog = enLog

export function enWarn(...args) {
  if (!isDebug) return
  return console.warn(`%c${prefix} `, 'background-color: yellow; color: black;', ...args)
}
window.enWarn = enWarn

export function enError(...args) {
  if (!isDebug) return
  return console.error(`%c${prefix} `, 'background-color: red; color: white;', ...args)
}
window.enError = enError
