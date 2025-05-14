import {
  injectLocal,
  provideLocal,
  useStorage,
} from '@vueuse/core'
import chalk from 'chalk'
import { getCurrentInstance } from 'vue'

const prefix = '[SEP by Wetoria]'
const isDeveloping = useStorage('en-debugging', false)


export const setLogContextEnabled = (enabled: boolean) => {
  provideLocal('enLog', enabled)
}
export const enableLogContext = () => {
  setLogContextEnabled(true)
}
window.enEnableLogContext = enableLogContext

export const disableLogContext = () => {
  setLogContextEnabled(false)
}
window.enDisableLogContext = disableLogContext


const canLog = () => {
  const isInVue = !!getCurrentInstance()
  const isNotInVue = !isInVue
  if (isNotInVue) {
    return isDeveloping.value
  }
  const enabled = injectLocal('enLog', false)
  return enabled
}

const cannotLog = () => {
  return !canLog()
}

export function enLog(...args: [string, ...any[]]) {
  if (cannotLog())
    return
  const [first, ...rest] = args

  console.groupCollapsed(`${chalk.bgWhite.whiteBright(` ${prefix} `)} ${first}`, ...rest)
  console.trace()
  console.groupEnd()
}
window.enLog = enLog




export function enWarn(...args: [string, ...any[]]) {
  const [first, ...rest] = args
  console.groupCollapsed(`${chalk.bgYellowBright.yellow(` ${prefix} `)} ${first}`, ...rest)
  console.trace()
  console.groupEnd()
}
export function getColorStringWarn(text: string) {
  return chalk.bold.yellow(text)
}
export function enWarnLogText(text: string) {
  return chalk.bold.yellow(text)
}
window.enWarn = enWarn
window.enWarnLogText = enWarnLogText




export function enError(...args: [string, ...any[]]) {
  const [first, ...rest] = args
  console.groupCollapsed(`${chalk.bgRed.whiteBright(` ${prefix} `)} ${first}`, ...rest)
  console.trace()
  console.groupEnd()
}
export function getColorStringError(text: string) {
  return chalk.bold.redBright(text)
}
export function enErrorLogText(text: string) {
  return chalk.bold.redBright(text)
}
window.enError = enError
window.enErrorLogText = enErrorLogText



export function enSuccess(...args: [string, ...any[]]) {
  if (cannotLog())
    return
  const [first, ...rest] = args
  console.groupCollapsed(`${chalk.bgGreen.whiteBright(` ${prefix} `)} ${first}`, ...rest)
  console.trace()
  console.groupEnd()
}
export function getColorStringSuccess(text: string) {
  return chalk.bold.greenBright(text)
}
export function enSuccessLogText(text: string) {
  return chalk.bold.greenBright(text)
}
window.enSuccess = enSuccess
window.enSuccessLogText = enSuccessLogText



// 测试日志样式
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
