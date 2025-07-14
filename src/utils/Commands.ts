import { usePlugin } from '@/main'
import { EN_COMMAND_KEYS } from '@/utils/Constants'
import { ICommand } from 'siyuan'
import {
  onBeforeUnmount,
  onMounted,
} from 'vue'

const commandsKeyList: string[] = []

const commandOrder = [
  EN_COMMAND_KEYS.EN_PLUGIN_SWITCH,
  'En_OpenSettings',

  'En_OpenQuickNote',
  'En_DailyNote_GoPrev',
  'En_DailyNote_GoNext',

  'En_Comment_EnableBtn',
  'En_Comment',

  'En_FormatBrush_Enable',
  'En_FormatBrush_Paste',

  'En_VideoAndAudio_Pin',

  EN_COMMAND_KEYS.EN_LIFELOG_OPEN_GRAPH_MODAL,

  'En_FontStyle',
]

function sortCommandKeys() {
  // 根据 key 的字符串顺序，将 command 排序
  commandsKeyList.sort((a, b) => {
    const aIndex = commandOrder.findIndex((key) => key === a)
    const bIndex = commandOrder.findIndex((key) => key === b)

    // 如果都记录了顺序，则按照顺序排序
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }

    // // 如果 a 没有记录顺序，则 a 排在 b 后面
    if (aIndex === -1 && bIndex !== -1) {
      return 1
    }
    // 如果 b 没有记录顺序，则 b 排在 a 后面
    if (bIndex === -1 && aIndex !== -1) {
      return -1
    }

    // 如果都没有记录顺序，则按照字符串顺序排序
    if (a < b) {
      return -1
    } else if (a > b) {
      return 1
    }
    return 0
  })
}

export function addCommand(command: ICommand) {
  if (!command) {
    return
  }

  const plugin = usePlugin()

  const existInKeyList = commandsKeyList.find((key) => key === command.langKey)

  // 如果没有添加过
  if (!existInKeyList) {
    // 记录当前 command 的 key
    commandsKeyList.push(command.langKey)
  }

  plugin.addCommand(command)

  const temp = plugin.commands
  temp.push(command)

  const result = []
  plugin.commands = []


  sortCommandKeys()
  // 根据已经存储的 command 列表，从已经注册的 command 中，找到对应的 cmd 存储下来
  commandsKeyList.forEach((key) => {
    const targetCmd = temp.find((cmd) => cmd.langKey === key)
    if (targetCmd) {
      // 防止显示 undefined
      targetCmd.hotkey = targetCmd.hotkey || ''
      // 防止显示 undefined
      targetCmd.customHotkey = targetCmd.customHotkey || ''
      result.push(targetCmd)
    }
  })

  // 更新插件的 commands
  plugin.commands = result
}

export function removeCommand(command: ICommand) {
  const plugin = usePlugin()

  plugin.commands = plugin.commands
    .filter((i) => i.langKey !== command.langKey)
}

/**
 * 在模块中添加 Command，在模块卸载时，自动移除 Command
 * @param command 命令
 */
export function addCommandInModule(command: ICommand) {
  onMounted(() => {
    addCommand(command)
  })
  onBeforeUnmount(() => {
    removeCommand(command)
  })
}
