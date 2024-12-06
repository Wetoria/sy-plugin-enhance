import chalk from 'chalk'

const prefix = '[SEP by Wetoria]'
const isDeveloping = false


export function enLog(...args: [string, ...any[]]) {
  if (!isDeveloping)
    return
  const [first, ...rest] = args
  console.log(`${chalk.bgWhite.whiteBright(` ${prefix} `)} ${first}`, ...rest)
}
window.enLog = enLog

export function enWarn(...args: [string, ...any[]]) {
  const [first, ...rest] = args
  console.log(`${chalk.bgYellowBright.yellow(` ${prefix} ${first} `)}`)
  console.warn(...rest)
}
export function getColorStringWarn(text: string) {
  return chalk.bold.yellow(text)
}
window.enWarn = enWarn

export function enError(...args: [string, ...any[]]) {
  const [first, ...rest] = args
  console.log(`${chalk.bgRed.whiteBright(` ${prefix} ${first} `)}`)
  console.error(...rest)
}
export function getColorStringError(text: string) {
  return chalk.bold.redBright(text)
}
window.enError = enError

export function enSuccess(...args: [string, ...any[]]) {
  const [first, ...rest] = args
  console.log(`${chalk.bgGreen.whiteBright(` ${prefix} ${first} `)}`, ...rest)
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
