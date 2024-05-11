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
  public platform: SyFrontendTypes;
  public readonly version = version;

  async onload() {
    const frontEnd = getFrontend();
    this.platform = frontEnd as SyFrontendTypes
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    init(this);
  }

  onunload() {
    destroy()
  }

  openSetting() {
    openSettings()
  }
}
