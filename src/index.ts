import {
  Plugin,
  getFrontend,
} from "siyuan";

import { init } from './main';

export default class VPlugin extends Plugin {
  public isMobile: boolean;

  async onload() {
    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    init(this);

  }
}
