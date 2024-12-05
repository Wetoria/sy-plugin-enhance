import PluginInfoString from '@/../plugin.json?raw'
import {
  getFrontend,
  Plugin,
} from "siyuan"

import {
  destroy,
  init,
} from './main'
import { openSettings } from './modules/Settings/EnSettings.vue'
import { SyFrontendTypes } from './utils/Siyuan'
import '@/utils/Log'

let PluginInfo = {
  version: '',
}
try {
  PluginInfo = JSON.parse(PluginInfoString)
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
  public platform: SyFrontendTypes
  public readonly version = version

  async onload() {
    enSuccess(`Plugin script loaded, ready to init plugin logics`)
    const frontEnd = getFrontend()
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile"
    this.isBrowser = frontEnd.includes('browser')
    this.isLocal =
      location.href.includes('127.0.0.1')
      || location.href.includes('localhost')
    enLog('require is ', require)
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
    openSettings()
  }
}
