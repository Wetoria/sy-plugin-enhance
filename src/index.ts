import PluginInfoString from '@/../plugin.json'
import '@/utils/GlobalModule'
import '@/utils/Log'
import {
  getFrontend,
  IObject,
  Plugin
} from "siyuan"
import {
  destroy,
  init,
} from './main'

import { initDock } from '@/modules/EnLeafPanel/EnLeafPanel'
import { openSettings } from '@/modules/Settings/Settings'
import { SyFrontendTypes } from './utils/Siyuan'



let PluginInfo = {
  version: '',
}
try {
  PluginInfo = PluginInfoString
} catch (err) {
  console.log('err is ', err)
}
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
  // 修正类型声明
  declare readonly i18n: IObject
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

    // 初始化叶归侧边栏
    initDock(this)
    init(this)
  }

  onunload() {
    destroy()
  }

  openSetting() {
    openSettings()
  }
}
