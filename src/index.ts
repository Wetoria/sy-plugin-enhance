import {
  Plugin,
  Menu,
  getFrontend,
} from "siyuan";
import "@/index.scss";

import { init } from './main';

export default class VPlugin extends Plugin {
  public isMobile: boolean;

  async onload() {
    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    console.log("Test on load");
    init(this);



    const topBarElement = this.addTopBar({
      icon: "iconVIP",
      title: this.i18n.addTopBarIcon,
      position: "right",
      callback: () => {
        if (this.isMobile) {
          this.addMenu();
        } else {
          let rect = topBarElement.getBoundingClientRect();
          // 如果被隐藏，则使用更多按钮
          if (rect.width === 0) {
            rect = document.querySelector("#barMore").getBoundingClientRect();
          }
          if (rect.width === 0) {
            rect = document
              .querySelector("#barPlugins")
              .getBoundingClientRect();
          }
          this.addMenu(rect);
        }
      },
    });
  }

  private addMenu(rect?: DOMRect) {
    const menu = new Menu("topBarSample", () => {
      console.log(this.i18n.byeMenu);
    });
    menu.addItem({
      label: "Open Doc Window(open help first)",
      click: () => {},
    });
    if (this.isMobile) {
      menu.fullscreen();
    } else {
      menu.open({
        x: rect.right,
        y: rect.bottom,
        isLeft: true,
      });
    }
  }
}
