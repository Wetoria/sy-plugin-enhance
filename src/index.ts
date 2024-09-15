import {
  Plugin,
  getFrontend,
} from "siyuan";
import PluginInfoString from '@/../plugin.json?raw'
let PluginInfo = {
  version: '',
}
try {
  PluginInfo = JSON.parse(PluginInfoString)
} catch(err) {
  console.log('err is ', err)
}
const {
  version
} = PluginInfo

import { destroy, init } from './main';
import { openSettings } from './modules/Settings/EnSettings.vue';
import { SyFrontendTypes } from './utils/Siyuan';

export default class EnhancePlugin extends Plugin {
  public isMobile: boolean;
  public isBrowser: boolean;
  public isLocal: boolean;
  public isElectron: boolean;
  public platform: SyFrontendTypes;
  public readonly version = version;

  async onload() {
    const frontEnd = getFrontend();
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
    this.isBrowser = frontEnd.includes('browser')
    this.isLocal = location.href.includes('127.0.0.1') || location.href.includes('localhost')
    console.log('require is ', require)
    try {
      require("@electron/remote")
      .require("@electron/remote/main")
      this.isElectron = true
    } catch(err) {
      this.isElectron = false
    }

    init(this);
  }

  onunload() {
    destroy()
  }

  openSetting() {
    openSettings()
  }
}
