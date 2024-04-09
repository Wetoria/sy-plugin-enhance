export let quickNoteWindow = null
export const urlSearchFlag = `en_quick_note`
export const QuickNoteWindowTitile = 'EnQuickNote'

export const initWindow = () => {
  const { BrowserWindow } = require('@electron/remote')
  const electronWindow = new BrowserWindow({
    width: 1000,
    height: 350,
    show: false,
    resizable: true,
    movable: true,
    frame: false,
    title: QuickNoteWindowTitile,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      webviewTag: true,
      webSecurity: false,
      nativeWindowOpen: true,
    }
  })

  require("@electron/remote")
      .require("@electron/remote/main")
      .enable(electronWindow.webContents);

  electronWindow.setTitle(QuickNoteWindowTitile)
  electronWindow.loadURL(
    `${window.location.protocol}//${window.location.host}/stage/build/app/window.html?${urlSearchFlag}=true`
  )

  quickNoteWindow = electronWindow
}

export function getWindow() {
  require('@electron/remote/main').enable(window);
  const { BrowserWindow } = require('@electron/remote');
  const allWindows = BrowserWindow.getAllWindows();
  console.log('titles is ', allWindows.map(i => i.getTitle()))
  const specificWindow = allWindows.find(window => {
    // 这里可以根据窗口的属性或其他特征来判断是否是你需要的窗口
    return window.getTitle() === QuickNoteWindowTitile;
  });
  return specificWindow
}
