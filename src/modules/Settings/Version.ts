import { putFile, unzip } from '@/api'
import { usePlugin } from '@/main'
import { Notification } from '@arco-design/web-vue'

export async function getNewVersion() {
  const url = 'https://api.github.com/repos/wetoria/sy-plugin-enhance/releases/latest'
  return fetch(url)
}

export async function hasNewVersion() {
  const res = await getNewVersion()
  if (!res.ok) {
    return {
      hasNew: false,
      info: null,
    }
  }
  const data = await res.json()

  const plugin = usePlugin()
  const newVersion = data.tag_name
  const currentVersion = `v${plugin.version}`
  return {
    hasNew: newVersion !== currentVersion,
    info: data,
  }
}

export async function getNewPackageAndUnzip() {
  const versionRes = await getNewVersion()
  if (!versionRes.ok) {
    Notification.warning('获取新版本失败')
    return
  }
  const newVersionInfo = await versionRes.json()
  const assets = newVersionInfo.assets || []
  const assetInfo = assets[0]
  if (!assetInfo) {
    Notification.warning('获取新版本包失败')
    return
  }
  const packageRes = await fetch(assetInfo.browser_download_url)
  if (!packageRes.ok) {
    Notification.warning('获取新版本包失败')
    return
  }

  const zipBlob = await packageRes.blob();
  const filename = 'sy-plugin-enhance.zip';

  const file = new File([zipBlob], filename, {
    type: 'application/zip',
  });
  await putFile(
    '/temp/install/sy-plugin-enhance.zip',
    false,
    file,
  )
  unzip('/temp/install/sy-plugin-enhance.zip', '/data/plugins/sy-plugin-enhance')
}
