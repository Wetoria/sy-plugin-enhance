import chalk from 'chalk'

const prefix = '[SEP by Wetoria]'
const isDeveloping = false


export function enLog(...args: [string, ...any[]]) {
  if (!isDeveloping) return
  const [first, ...rest] = args
  console.log(`${chalk.bgWhite.whiteBright(` ${prefix} `)} ${first}`, ...rest)
}
window.enLog = enLog

export function enWarn(...args: [string, ...any[]]) {
  if (!isDeveloping) return
  const [first, ...rest] = args
  console.log(`${chalk.bgYellow.yellowBright(` ${prefix} ${first} `)}`)
  console.warn(...rest)
}
window.enWarn = enWarn

export function enError(...args: [string, ...any[]]) {
  if (!isDeveloping) return
  const [first, ...rest] = args
  console.log(`${chalk.bgRed.redBright(` ${prefix} ${first} `)}`)
  console.error(...rest)
}
window.enError = enError

export function enSuccess(...args: [string, ...any[]]) {
  if (!isDeveloping) return
  const [first, ...rest] = args
  console.log(`${chalk.bgGreen.greenBright(` ${prefix} ${first} `)}`, ...rest)
}
window.enSuccess = enSuccess

if (isDeveloping) {
  enLog('Test Log style')
  enWarn('Test Log style', 'test')
  enError('Test Log style', 'test')
  enSuccess('Test Log style', 'test')
}
