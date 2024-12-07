import chalk from 'chalk'

const prefix = '[SEP by Wetoria]'
const isDeveloping = true


export function enLog(...args: [string, ...any[]]) {
  if (!isDeveloping)
    return
  const [first, ...rest] = args
  // console.log()
  console.groupCollapsed(`${chalk.bgWhite.whiteBright(` ${prefix} `)} ${first}`, ...rest)
  console.trace()
  console.groupEnd()
}
window.enLog = enLog

export function enWarn(...args: [string, ...any[]]) {
  const [first, ...rest] = args
  console.groupCollapsed(`${chalk.bgYellowBright.yellow(` ${prefix} ${first} `)}`)
  if (rest.length > 0) {
    console.warn(...rest)
  }
  console.groupEnd()
}
export function getColorStringWarn(text: string) {
  return chalk.bold.yellow(text)
}
window.enWarn = enWarn

export function enError(...args: [string, ...any[]]) {
  const [first, ...rest] = args
  console.groupCollapsed(`${chalk.bgRed.whiteBright(` ${prefix} ${first} `)}`)
  if (rest.length > 0) {
    console.error(...rest)
  }
  console.groupEnd()
}
export function getColorStringError(text: string) {
  return chalk.bold.redBright(text)
}
window.enError = enError

export function enSuccess(...args: [string, ...any[]]) {
  if (!isDeveloping)
    return
  const [first, ...rest] = args
  console.groupCollapsed(`${chalk.bgGreen.whiteBright(` ${prefix} ${first} `)}`, ...rest)
  if (rest.length > 0) {
    console.trace()
  }
  console.groupEnd()
}
export function getColorStringSuccess(text: string) {
  return chalk.bold.greenBright(text)
}
window.enSuccess = enSuccess

const testLogStyle = false
if (testLogStyle) {
  enLog('Test Log style')
  enWarn('Test Log style', 'test')
  enError('Test Log style', 'test')
  enSuccess('Test Log style', 'test')

  enLog(getColorStringWarn('Test'))
  enLog(getColorStringError('Test'))
  enLog(getColorStringSuccess('Test'))
}
