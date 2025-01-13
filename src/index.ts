
import '@/utils/GlobalModule'
import PluginInfoString from '@/../plugin.json'
import '@/utils/Log'
import {
  destroy,
  init,
} from './main'
import {
  getFrontend,
  Plugin,
} from "siyuan"

import { SyFrontendTypes } from './utils/Siyuan'


let PluginInfo = {
  version: '',
}
try {
  PluginInfo = PluginInfoString
} catch (err) {
  console.log('err is ', err)
}
window.SEP_GLOBAL.PluginInfo = PluginInfo
const {
  version,
} = PluginInfo

export default class EnhancePlugin extends Plugin {
  public isMobile: boolean
  public isBrowser: boolean
  public isLocal: boolean
  public isElectron: boolean
  public isInWindow: boolean
  public platform: SyFrontendTypes
  public readonly version = version
  // @ts-expect-error fix siyuan i18n type doesn't match
  declare readonly i18n: I18nType

  async onload() {
    const frontEnd = getFrontend()
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile"
    this.isBrowser = frontEnd.includes('browser')
    this.isLocal =
      location.href.includes('127.0.0.1')
      || location.href.includes('localhost')
    this.isInWindow = location.href.includes('window.html')

    try {
      require("@electron/remote")
        .require("@electron/remote/main")
      this.isElectron = true
    } catch (err) {
      this.isElectron = false
    }

    init(this)
  }

  onunload() {
    destroy()
  }

  openSetting() {
    window.SEP_GLOBAL?.globalFunc?.openSettings?.()
  }
}
