import { loadEnv } from 'vite'

const pluginInfo = require("../public/plugin.json")

export function getDistDir(mode) {
  // console.log('mode=>', mode)

  // eslint-disable-next-line node/prefer-global/process
  const env = loadEnv(mode, process.cwd())
  const {
    VITE_SIYUAN_WORKSPACE_PATH,
    VITE_DEV_DIST_DIR,
  } = env
  // console.log('env=>', env)


  const siyuanWorkspacePath = VITE_SIYUAN_WORKSPACE_PATH
  let devDistDir = './dev'
  if (!siyuanWorkspacePath) {
    console.log("\n\x1B[33m%s\x1B[0m", "⚠️ Siyuan workspace path is not set.")
  } else {
    // console.log("\x1B[32m%s\x1B[0m", `\nSiyuan workspace path`, ` is set:\n${siyuanWorkspacePath}`)
    devDistDir = `${siyuanWorkspacePath}/data/plugins/${pluginInfo.name}`
  }
  if (VITE_DEV_DIST_DIR) {
    // console.log(`\nDev dist dir is set:\n${VITE_DEV_DIST_DIR}`)
    devDistDir = VITE_DEV_DIST_DIR
  }
  console.log(`\nBase on directory:`)
  console.log("\x1B[32m%s\x1B[0m", `\n${devDistDir}`)

  return devDistDir
}
