import { usePlugin } from '@/main';
import { ICommandOption } from 'siyuan';

const commandsKeyList: string[] = []

export function addCommand(command: ICommandOption) {
  if (!command) {
    return
  }

  const plugin = usePlugin()

  const existInKeyList = commandsKeyList.find((key) => key === command.langKey)

  if (!existInKeyList) {
    commandsKeyList.push(command.langKey)
    commandsKeyList.sort((a, b) => {
      if (a < b) {
        return -1
      } else if (a > b) {
        return 1
      }
      return 0
    })
    plugin.addCommand(command)
  } else {
    const temp = plugin.commands
    temp.push(command)
    const result = []
    plugin.commands = []
    commandsKeyList.forEach((key) => {
      const targetCmd = temp.find((cmd) => cmd.langKey === key)
      if (targetCmd) {
        result.push(targetCmd)
      }
    })
    plugin.commands = result
  }

}

export function removeCommand(command: ICommandOption) {
  const plugin = usePlugin()

  plugin.commands = plugin.commands
    .filter((i) => i.langKey !== command.langKey);
}
