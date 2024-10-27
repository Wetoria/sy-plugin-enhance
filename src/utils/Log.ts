export function log(...args) {
  return console.log('[Enhance] ', ...args)
}
window.enLog = log
export function warn(...args) {
  return console.warn('[Enhance] ', ...args)
}
window.enWarn = warn
export function error(...args) {
  return console.error('[Enhance] ', ...args)
}
window.enError = error
