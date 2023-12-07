import { exec } from 'child_process'
import PluginInfo from './plugin.json' assert { type: "json" }

const {
  version
} = PluginInfo

exec(`git tag v${version}`, (err, stdout) => {
  if (!err) {
    exec(`git push origin v${version}`)
  } else {
    console.log()
    console.error('Error is: ', err)
    console.log(stdout)
  }
})
