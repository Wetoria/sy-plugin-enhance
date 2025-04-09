import { exec } from 'node:child_process'
import {
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { createRequire } from 'node:module'
import process from 'node:process'

const require = createRequire(import.meta.url)
const PluginInfo = require('./plugin.json')

const {
  version,
} = PluginInfo
let [major, minor, patch] = version.split('.').map(Number)

const args = process.argv.slice(2)
const mode = args.find((arg) => arg.startsWith('--mode='))?.split('=')[1] || 'patch'
const isManual = mode === 'manual'

console.log(`Update mode: ${mode}`)
switch (mode) {
  case 'manual':
    break
  case 'major':
    major++
    minor = 0
    patch = 0
    break
  case 'minor':
    minor++
    patch = 0
    break
  case 'patch':
    patch++
    break
  default:
    console.log()
    console.error('\x1B[31m%s\x1B[0m', `Invalid [mode] arg. Use major, minor, or patch`)
    console.log()
    process.exit(1)
}

const newVersion = `${major}.${minor}.${patch}`
PluginInfo.version = newVersion

if (isManual) {
  console.log(`Ready to release => v${newVersion}`)
} else {
  console.log(`Ready to release: v${version} => v${newVersion}`)

  const content = readFileSync('./plugin.json', 'utf8')
  const updated = content.replace(
    /"version"\s*:\s*"[^"]+"/,
    `"version": "${newVersion}"`,
  )
  writeFileSync('./plugin.json', updated, 'utf8')
}



exec(
  `git add ./plugin.json && git commit -m "chore: update version to ${newVersion}" && git push && git tag v${newVersion}`,
  (err, stdout) => {
    if (err) {
      console.error('\x1B[31m%s\x1B[0m', 'Error:', err)
      process.exit(1)
    }

    exec(`git push origin v${newVersion}`, (err) => {
      if (err) {
        console.error('\x1B[31m%s\x1B[0m', 'Error pushing tag:', err)
        process.exit(1)
      }
      console.log('\x1B[32m%s\x1B[0m', `✨ Version ${newVersion} released successfully`)
    })
  },
)

