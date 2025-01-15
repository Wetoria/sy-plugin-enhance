<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
    :authLevel="1"
    @moduleEnabled="onModuleEnabled"
    @moduleDisabled="onModuleDisabled"
  >
    <div>
      格式刷功能{{ hasAuth ? '已开启' : '未开启' }}
    </div>
  </EnSettingsTeleportModule>
  <template
    v-for="protyleToolbarBrushContainerTarget in toolbarDomList"
    :key="protyleToolbarBrushContainerTarget.dataset.en_loop_key"
  >
    <Teleport
      :to="protyleToolbarBrushContainerTarget"
    >
      <button
        class="protyle-toolbar__item b3-tooltips b3-tooltips__n"
        data-type="EnFormatBrush"
        :aria-label="getAriaLabel()"
        :data-en_brush_enabled="brushing"
        @click="onToolbarBrushClick"
      >
        <svg>
          <use :xlink:href="brushing ? '#EnIconFormatBrushActived' : '#EnIconFormatBrush'"></use>
        </svg>
      </button>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import {
  injectAuthStatus,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsTeleportModule from '@/modules/Settings/EnSettingsTeleportModule.vue'
import {
  generateShortUUID,
  moduleEnableStatusSwitcher,
} from '@/utils'
import {
  addCommand,
  removeCommand,
} from '@/utils/Commands'


import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  appendTargetDomAsClassOrder,
  queryAllByDom,
} from '@/utils/DOM'
import {
  useSiyuanEventLoadedProtyleStatic,
  useSiyuanEventProtyleDestroy,
} from '@/utils/EventBusHooks'
import { useCurrentProtyle } from '@/utils/Siyuan'

import { IProtyle } from 'siyuan'
import {
  computed,
  nextTick,
  ref,
  watch,
} from 'vue'

const plugin = usePlugin()

const {
  module,
  moduleOptions,
} = useModule(EN_MODULE_LIST.EN_FORMAT_BRUSH, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.EN_FORMAT_BRUSH,
    moduleDisplayName: EN_CONSTANTS.EN_FORMAT_BRUSH_DISPLAY,
  },
  needSave: false,
})

const { computedLevel } = injectAuthStatus()
const hasAuth = computedLevel(1)
// 有权限时，自动开启格式刷功能
watch(hasAuth, () => {
  if (hasAuth.value) {
    moduleOptions.value.enable = true
  }
})

plugin.addIcons(`
  <symbol id="EnIconFormatBrushActived" viewBox="0 0 32 32">
    <path fill="#3d7bfc" style="fill: var(--color1, #3d7bfc)" d="M10.816 9.008l11.328 12.928 6.016-5.728-10.896-13.040-6.448 5.84zM31.952 5.408l-3.152-3.6-7.456 4.736 5.312 6.016 5.296-7.152z"></path>
    <path fill="#e1f0ff" style="fill: var(--color2, #e1f0ff)" d="M10.608 10.512s-6.304 3.008-9.6 1.792l13.68 17.344s4.944-7.088 5.952-7.168l-10.032-11.968z"></path>
    <path fill="#3d7bfc" style="fill: var(--color1, #3d7bfc)" d="M19.824 23.52c0.368-0.432 0.752-0.88 1.088-1.232l-10.224-12.176-0.224 0.112c-0.064 0.032-6.224 2.944-9.344 1.776l-1.072-0.4 14.672 18.592 0.256-0.352c0.016-0.016 1.216-1.744 2.544-3.472 0.736-0.96 1.312-1.664 1.744-2.176 0.208-0.288 0.4-0.496 0.56-0.672zM17.024 25.904c-0.992 1.296-1.92 2.608-2.352 3.216l-12.832-16.272c3.12 0.464 7.6-1.456 8.672-1.936l9.616 11.456c-0.24 0.176-0.576 0.48-1.072 1.040-0.56 0.608-1.232 1.456-2.032 2.496z"></path>
  </symbol>
`)
plugin.addIcons(`
  <symbol id="EnIconFormatBrush" viewBox="0 0 32 32">
  <path fill="#8a8a8a" style="fill: var(--color1, #8a8a8a)" d="M10.816 9.008l11.328 12.928 6.016-5.728-10.896-13.040-6.448 5.84zM31.952 5.408l-3.152-3.6-7.456 4.736 5.312 6.016 5.296-7.152z"></path>
  <path fill="#8a8a8a" style="fill: var(--color1, #8a8a8a)" d="M10.608 10.512s-6.304 3.008-9.6 1.792l13.68 17.344s4.944-7.088 5.952-7.168l-10.032-11.968z"></path>
  <path fill="#8a8a8a" style="fill: var(--color1, #8a8a8a)" d="M19.824 23.52c0.368-0.432 0.752-0.88 1.088-1.232l-10.224-12.176-0.224 0.112c-0.064 0.032-6.224 2.944-9.344 1.776l-1.072-0.4 14.672 18.592 0.256-0.352c0.016-0.016 1.216-1.744 2.544-3.472 0.736-0.96 1.312-1.664 1.744-2.176 0.208-0.288 0.4-0.496 0.56-0.672zM17.024 25.904c-0.992 1.296-1.92 2.608-2.352 3.216l-12.832-16.272c3.12 0.464 7.6-1.456 8.672-1.936l9.616 11.456c-0.24 0.176-0.576 0.48-1.072 1.040-0.56 0.608-1.232 1.456-2.032 2.496z"></path>
  </symbol>
`)

// @ts-expect-error ignore
// eslint-disable-next-line unused-imports/no-unused-vars
const INLINE_TYPE = [
  "block-ref",
  "text",
  "file-annotation-ref",
  "a",
  "strong",
  "em",
  "u",
  "s",
  "mark",
  "sup",
  "sub",
  "code",
  "kbd",
  "tag",
  "inline-math",
  "inline-memo",
  "clear",
]

const FONT_STYLE_INLINE_TYPE = [
  "text",
  "strong",
  "em",
  "u",
  "s",
  "mark",
  "sup",
  "sub",
  "code",
  "kbd",
  "tag",
]

const FONT_STYLE_KEYS = [
  'color',
  'fontSize',
  'backgroundColor',
  'webkitTextStroke',
  'webkitTextFillColor',
  'textShadow',
]

const SELECTION_KEYS = [
  'anchorNode',
  'anchorOffset',
  'baseNode',
  'baseOffset',
  'extentNode',
  'extentOffset',
  'focusNode',
  'focusOffset',
]

interface IStyle {
  style: object
  dataType: string[]
  selection: {
    anchorNode: HTMLElement
    anchorOffset: number
    baseNode: HTMLElement
    baseOffset: number
    extentNode: HTMLElement
    extentOffset: number
    focusNode: HTMLElement
    focusOffset: number
  }
}

const currentProtyle = useCurrentProtyle()


const currentFontStyle = ref<IStyle>()
const brushing = computed(() => !!currentFontStyle.value)




const changeBrushStatusIndomTo = (enable: boolean) => {
  moduleEnableStatusSwitcher('EnFormatBrush', enable)
}

const escapeEvent = (event) => {
  if (event.code === 'Escape') {
    event.preventDefault()
    event.stopImmediatePropagation()
    event.stopPropagation()
    // eslint-disable-next-line ts/no-use-before-define
    cancelBrush()
  }
}

const pasteStyleOnMouseUp = () => {
  const selection = window.getSelection()

  if (selection.isCollapsed) {
    return
  }
  setTimeout(() => {
    // eslint-disable-next-line ts/no-use-before-define
    pasteCurrentStyle()
  }, 30)
}

const cancelBrush = () => {
  currentFontStyle.value = null
  changeBrushStatusIndomTo(false)

  document.removeEventListener('keydown', escapeEvent, true)
  document.removeEventListener('mouseup', pasteStyleOnMouseUp)
}

const enableBrush = () => {
  changeBrushStatusIndomTo(true)
  document.addEventListener('keydown', escapeEvent, true)
  document.addEventListener('mouseup', pasteStyleOnMouseUp)
}



const convertStyleByRange = () => {
  const selection = window.getSelection()

  if (!selection.rangeCount) {
    return
  }
  // 获取选区的第一个范围
  const range = selection.getRangeAt(0)

  // 获取选区的开始容器
  const startContainer = range.startContainer

  // 获取包含选区开始的元素
  const element = (startContainer.nodeType === Node.ELEMENT_NODE ? startContainer : startContainer.parentElement) as HTMLElement


  const tempStyle = {} as any as IStyle
  tempStyle.style = {}
  FONT_STYLE_KEYS.forEach((key) => {
    if (element.style[key]) {
      tempStyle.style[key] = element.style[key]
    }
  })

  const elDataType = element.dataset.type || ''
  let validFontStyleDataType = elDataType.split(' ').filter((i) => FONT_STYLE_INLINE_TYPE.includes(i))
  validFontStyleDataType = Array.from(new Set(validFontStyleDataType))
  tempStyle.dataType = validFontStyleDataType || []

  tempStyle.selection = {} as any
  SELECTION_KEYS.forEach((key) => {
    tempStyle.selection[key] = selection[key]
  })

  enLog('tempStyle is ', tempStyle)
  return tempStyle
}

// @ts-expect-error ignore
// eslint-disable-next-line unused-imports/no-unused-vars
const isSameStyle = (style1: IStyle, style2: IStyle) => {
  if (!style1 || !style2) {
    return false
  }

  const style1Keys = Object.keys(style1.style)
  const style2Keys = Object.keys(style2.style)
  if (style1Keys.length !== style2Keys.length || style1.dataType.length !== style2.dataType.length) {
    return false
  }

  // 检查 style 对象的键和值是否一致
  for (const key of style1Keys) {
    if (!style2Keys.includes(key) || style1.style[key] !== style2.style[key]) {
      return false
    }
  }

  // 检查 dataType 数组的元素是否一致
  for (const type of style1.dataType) {
    if (!style2.dataType.includes(type)) {
      return false
    }
  }

  return true
}

const copyCurrentStyle = () => {
  const tempStyle = convertStyleByRange()
  currentFontStyle.value = tempStyle
  enableBrush()
}

const pasteCurrentStyle = (protyle: IProtyle = currentProtyle.value) => {
  if (!currentFontStyle.value) {
    return
  }

  if (!currentProtyle.value) {
    enLog('未选中 protyle')
    return
  }

  // if (!Object.keys(currentFontStyle.value.style).length && !currentFontStyle.value.dataType.length) {
  //   return
  // }
  // const range = protyle?.toolbar?.range

  // const startContainer = range.startContainer;
  // const element = (startContainer.nodeType === Node.ELEMENT_NODE ? startContainer : startContainer.parentElement) as HTMLElement;

  // let siyuanNode = element
  // while(siyuanNode != null && !siyuanNode.dataset.nodeId) {
  //   siyuanNode = siyuanNode.parentElement
  // }

  // const oldElement = siyuanNode.outerHTML

  // IMP 这里可能会影响到批注的数据
  protyle?.toolbar?.setInlineMark(protyle, 'clear', "range")
  protyle?.toolbar?.setInlineMark(protyle, 'clear', "range")

  currentFontStyle.value.dataType.forEach((item) => {
    protyle?.toolbar?.setInlineMark(protyle, item, "range")
  })

  const specialStyle = [
    'webkitTextStroke',
    'webkitTextFillColor',
    'textShadow',
  ]
  Object.keys(currentFontStyle.value.style).forEach((key) => {
    if (specialStyle.includes(key)) {
      if (key === 'textShadow') {
        protyle?.toolbar?.setInlineMark(protyle, 'text', "range", {
          type: 'style4',
          color: "",
        })
      } else {
        protyle?.toolbar?.setInlineMark(protyle, 'text', "range", {
          type: 'style2',
          color: "",
        })
      }
      return
    }
    protyle?.toolbar?.setInlineMark(protyle, 'text', "range", {
      type: key,
      color: currentFontStyle.value.style[key],
    })
  })
}

const commands = [
  {
    langKey: "En_FormatBrush_Enable",
    langText: "开启格式刷",
    hotkey: "",
    editorCallback: () => {
      copyCurrentStyle()
    },
  },
  // {
  //   langKey: "En_FormatBrush_Paste",
  //   langText: "格式刷（粘贴当前格式）",
  //   hotkey: "",
  //   editorCallback: (protyle) => {
  //     pasteCurrentStyle(protyle)
  //   },
  // },
]


const getAriaLabel = () => {
  const cmd = plugin.commands.find((i) => i.langKey === 'En_FormatBrush_Enable')
  const enableLabels = [`开启格式刷`]
  if (cmd && (cmd.customHotkey || cmd.hotkey)) {
    enableLabels.push(`(${cmd.customHotkey || cmd.hotkey})`)
  }
  return `${!brushing.value ? enableLabels.join('') : `关闭格式刷(Esc 取消)`}`
}


const onToolbarBrushClick = () => {
  if (brushing.value) {
    cancelBrush()
  } else {
    copyCurrentStyle()
  }
}



// #region 👇 工具栏中格式刷按钮的相关逻辑

const toolbarDomList = ref<HTMLElement[]>([])

const registerToolbarBrushContainer = () => {
  const domList = queryAllByDom(document.body, '.protyle-toolbar')

  if (!domList.length) {
    return
  }

  domList.forEach((dom: HTMLElement) => {
    const toolbarItems = [...dom.children]
    const exist = toolbarItems.find((i: HTMLElement) => i.dataset.type === 'EnFormatBrush')
    if (exist) {
      return
    }
    const targetDom = appendTargetDomAsClassOrder('enProtyleToolbarBrushContainer', dom)
    targetDom.setAttribute('data-type', 'EnFormatBrush')
    targetDom.dataset.en_loop_key = generateShortUUID()
    toolbarDomList.value.push(targetDom)
  })
}
const unregisterToolbarBrushContainer = () => {
  toolbarDomList.value.forEach((dom) => {
    dom.remove()
  })
}

const removeToolbarBrushContainerNotInDocument = () => {
  toolbarDomList.value = toolbarDomList.value.filter((dom) => {
    return document.body.contains(dom)
  })
}

let offRegisterToolbarBrush = null
let offOnProtyleDestroy = null
const bindRegisterToolbarBrushListener = () => {
  // 启动时先处理一次，防止已经存在的文档，没有触发 load
  registerToolbarBrushContainer()


  // 监听 protyle 加载，追加格式刷按钮
  offRegisterToolbarBrush = useSiyuanEventLoadedProtyleStatic(() => {
    registerToolbarBrushContainer()
  })

  // 监听 protyle 销毁，移除格式刷按钮
  offOnProtyleDestroy = useSiyuanEventProtyleDestroy(() => {
    nextTick(() => {
      removeToolbarBrushContainerNotInDocument()
    })
  })
}
const unbindRegisterToolbarBrushListener = () => {
  offOnProtyleDestroy?.()
  offRegisterToolbarBrush?.()
  unregisterToolbarBrushContainer()
}

// #endregion 👆 工具栏中格式刷按钮的相关逻辑


const onModuleEnabled = () => {
  bindRegisterToolbarBrushListener()
  // 注册格式刷快捷键和命令
  commands.forEach((command) => {
    addCommand(command)
  })
}

const onModuleDisabled = () => {
  cancelBrush()
  unbindRegisterToolbarBrushListener()

  commands.forEach((command) => {
    removeCommand(command)
  })
}
</script>

<style lang="scss">
html[data-en_enabled_module~="EnFormatBrush"] {

  .protyle * {
    cursor: url('./FormatBrush.png'), default;
  }
}
</style>
