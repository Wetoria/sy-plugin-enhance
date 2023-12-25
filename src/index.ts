import {
  Plugin,
  getFrontend,
} from "siyuan";
import "./index.scss";
import PluginInfo from '@/../plugin.json' assert { type: "json" }
const {
  version
} = PluginInfo

import { destroy, init } from './main';

export default class VPlugin extends Plugin {
  public isMobile: boolean;
  public readonly version = version;

  async onload() {
    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    init(this);
  }

  onunload() {
    destroy()
  }
}
