<template>
  <div>
    <a-modal
      v-model:visible="modalVisible"
      :footer="false"
      :mask-style="{
        backgroundColor: 'rgba(0,0,0,0)',
      }"
      :width="580"
      @ok="handleOk"
      @cancel="handleCancel"
    >
      <template #title>
        添加字体样式快捷键
      </template>

      <div class="EnFontCommandSetterMain">
        <div class="line">
          选择字体颜色
        </div>
        <div class="line">
          <button
            v-for="item of siyuanColorList"
            :key="item"
            class="color__square"
            data-type="color"
            :style="`color:${item}`"
            @click="setColor(item)"
          >
            A
          </button>
        </div>
        <div class="line">
          选择背景色
        </div>
        <div class="line">
          <button
            v-for="item of siyuanBgColorList"
            :key="item"
            class="color__square"
            data-type="backgroundColor"
            :style="`background-color:${item}`"
            @click="setBgColor(item)"
          >
          </button>
        </div>
        <div class="line">
          选择字体大小
        </div>
        <div class="line">
          <a-select
            v-model="currentFontSize"
            :style="{
              width: '100%',
            }"
          >
            <a-option
              v-for="fontSize of fontSizeList"
              :key="fontSize"
              :value="fontSize"
              :label="fontSize"
            />
          </a-select>
        </div>
        <div class="line">
          当前选择的效果
        </div>
        <div class="line">
          <span
            class="color__square"
            :style="{
              backgroundColor: currentBgColor,
              color: currentColor,
              fontSize: currentFontSize,
              width: currentFontSize || undefined,
              height: currentFontSize || undefined,
            }"
          >
            A
          </span>
          <a-button
            type="primary"
            size="mini"
            @click="createCommand"
          >
            添加样式快捷键
          </a-button>
          <a-button
            size="mini"
            @click="clearCurrentFontStyle"
          >
            清除样式
          </a-button>
        </div>
        <template v-if="configgedFontStyleList.length">
          <div class="line">
            当前已设置的颜色列表（点击删除）
          </div>
          <div
            class="line"
            style="
              align-items: flex-end;
            "
          >
            <button
              v-for="item of configgedFontStyleList"
              :key="item.key"
              class="color__square"
              :style="{
                backgroundColor: item.bgColor,
                color: item.color,
                fontSize: item.fontSize,
                width: item.fontSize || undefined,
                height: item.fontSize || undefined,
              }"
              @click="removeConfiggedFont(item)"
            >
              A
            </button>
          </div>

          <div class="line">
            请重新打开 设置 - 快捷键 页面，进行快捷键的设置
          </div>
        </template>
      </div>

      <template #footer>
      </template>
    </a-modal>
  </div>
</template>

<script lang="ts">
import { usePlugin } from "@/main"
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import {
  addCommand,
  removeCommand,
} from '@/utils/Commands'
import {
  ICommand,
  showMessage,
} from 'siyuan'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watchEffect,
} from "vue"
import {
  EnModule,
  isFree,
} from '../Settings/EnSettings.vue'

export interface ICommandItem {
  key: string
  color: string
  bgColor: string
  fontSize: string
}

export const siyuanColorList = [
  "var(--b3-font-color1)",
  "var(--b3-font-color2)",
  "var(--b3-font-color3)",
  "var(--b3-font-color4)",
  "var(--b3-font-color5)",
  "var(--b3-font-color6)",
  "var(--b3-font-color7)",
  "var(--b3-font-color8)",
  "var(--b3-font-color9)",
  "var(--b3-font-color10)",
  "var(--b3-font-color11)",
  "var(--b3-font-color12)",
  "var(--b3-font-color13)",
]

export const siyuanBgColorList = [
  "var(--b3-font-background1)",
  "var(--b3-font-background2)",
  "var(--b3-font-background3)",
  "var(--b3-font-background4)",
  "var(--b3-font-background5)",
  "var(--b3-font-background6)",
  "var(--b3-font-background7)",
  "var(--b3-font-background8)",
  "var(--b3-font-background9)",
  "var(--b3-font-background10)",
  "var(--b3-font-background11)",
  "var(--b3-font-background12)",
  "var(--b3-font-background13)",
]

export const fontSizeList = [
  '12px',
  '13px',
  '14px',
  '15px',
  '16px',
  '19px',
  '22px',
  '24px',
  '29px',
  '32px',
  '40px',
  '48px',
]
</script>

<script setup lang="ts">

const plugin = usePlugin()


const parentDatasetKey = 'en_cmd_font_style'

const colorCommandHTML = `
  <div data-${parentDatasetKey}>
    <span>点击创建字体快捷键</span>
  </div>
`

const command: ICommand = {
  langKey: "En_FontStyle",
  langText: colorCommandHTML,
  hotkey: "",
  callback() {
    switchModalVisibleStatus()
  },
}

const modalVisible = ref(false)
const handleOk = () => {
  modalVisible.value = true
}
const handleCancel = () => {
  modalVisible.value = false
}

const currentColor = ref('')
const setColor = (color: string) => {
  currentColor.value = color
}
const currentBgColor = ref('')
const setBgColor = (color: string) => {
  currentBgColor.value = color
}

const currentFontSize = ref('')
const setFontSize = (value: string) => {
  currentFontSize.value = value
}

const clearCurrentFontStyle = () => {
  setColor('')
  setBgColor('')
  setFontSize('')
}

// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule {
  configgedFontStyleList: ICommandItem[]
}
const {
  moduleOptions,
} = useModule<ISettingModuleOptions>('EnFont', {
  defaultData: {
    enabled: false,
    moduleName: 'EnFont',
    moduleDisplayName: '字体样式快捷键',

    configgedFontStyleList: [],
  },
})

// #endregion 基本的模块配置

const configgedFontStyleList = computed<ICommandItem[]>(() => moduleOptions.value.configgedFontStyleList)


const EnFontStyleItem = `en_cmd_font_style_item`

const addCommandsByList = () => {
  plugin.commands = plugin.commands.filter((item) => !item.langKey.startsWith('En_FontStyle_'))
  configgedFontStyleList.value.forEach((item) => {
    const {
      key,
      color,
      bgColor,
      fontSize,
    } = item
    addCommand({
      langKey: `${key}`,
      langText: `
      <div data-${EnFontStyleItem} style="display: flex; align-items: center; gap: var(--en-gap);">
        <span>
          字体快捷键:
        </span>
        <span
          class="color__square"
          data-type="backgroundColor"
          style="
            background-color: ${bgColor};
            color: ${color};
            font-size: ${fontSize};
            width: ${fontSize || ''};
            height: ${fontSize || ''};
          "
        >
          A
        </span>
      </div>
    `,
      hotkey: "",
      editorCallback(protyle) {
        protyle?.toolbar?.setInlineMark(
          protyle,
          "EnFont text",
          "range",
          {
            type: 'color',
            color,
          },
        )
        protyle?.toolbar?.setInlineMark(
          protyle,
          "EnFont text",
          "range",
          {
            type: 'backgroundColor',
            color: bgColor,
          },
        )
        protyle?.toolbar?.setInlineMark(
          protyle,
          "EnFont text",
          "range",
          {
            type: 'fontSize',
            color: fontSize,
          },
        )
      },
    })
  })
}

const removeConfiggedFont = (item: ICommandItem) => {
  moduleOptions.value.configgedFontStyleList = configgedFontStyleList.value.filter((i) => i.key !== item.key)
}

watchEffect(() => {
  addCommandsByList()
})


const createCommand = () => {
  const color = currentColor.value
  const bgColor = currentBgColor.value
  const fontSize = currentFontSize.value
  const key = `En_FontStyle_${color}_${bgColor}_${fontSize}`
  const exist = configgedFontStyleList.value.find((item) => item.key === key)

  if (exist) {
    showMessage('已经添加过该样式')
    return
  }
  const newLen = configgedFontStyleList.value.length + 1
  if (isFree.value && newLen > 1) {
    showMessage('免费版最多添加一个样式快捷键')
    return
  }
  configgedFontStyleList.value.push({
    key,
    color,
    bgColor,
    fontSize,
  })
}

const switchModalVisibleStatus = () => {
  modalVisible.value = !modalVisible.value
}

const handleClickStyle = (event) => {
  const target = event.target as HTMLElement
  if (target?.parentElement) {
    if (parentDatasetKey in target.parentElement.dataset) {
      switchModalVisibleStatus()
    }
  }
}

onMounted(() => {
  addCommand(command)
  document.documentElement.addEventListener("click", handleClickStyle, true)
})
onBeforeUnmount(() => {
  removeCommand(command)
  document.documentElement.removeEventListener("click", handleClickStyle, true)
})
</script>

<style lang="scss" scoped>
.EnFontCommandSetterMain {
  display: flex;
  flex-direction: column;
  gap: var(--en-gap);

  .line {
    display: flex;
    gap: var(--en-gap);
    align-items: center;
  }
}
</style>
