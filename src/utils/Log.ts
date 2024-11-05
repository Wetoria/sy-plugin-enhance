export function log(...args) {
  return console.log('%c[Enhance] ', 'background-color: gray; color: white;', ...args)
}
window.enLog = log
export function warn(...args) {
  return console.warn('%c[Enhance] ', 'background-color: yellow; color: black;', ...args)
}
window.enWarn = warn
export function error(...args) {
  return console.error('%c[Enhance] ', 'background-color: red; color: white;', ...args)
}
window.enError = error
