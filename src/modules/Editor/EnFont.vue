<template>
  <div>
    <a-modal
      v-model:visible="modalVisible"
      :footer="false"
      :mask-style="{
        backgroundColor: 'rgba(0,0,0,0)'
      }"
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
          当前选择的效果
        </div>
        <div class="line">
          <span
            class="color__square"
            :style="{
              backgroundColor: currentBgColor,
              color: currentColor,
            }"
          >
            A
          </span>
          <a-button
            type="primary"
            @click="createCommand"
            size="mini"
          >
            添加样式快捷键
          </a-button>
        </div>
        <template v-if="configgedFontStyleList.length">
          <div class="line">
            当前已设置的颜色列表（点击删除）
          </div>
          <div class="line">
            <button
              v-for="item of configgedFontStyleList"
              :key="item.key"
              class="color__square"
              :style="{
                backgroundColor: item.bgColor,
                color: item.color,
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

<script setup lang="ts">
import { usePlugin } from "@/main";
import { addCommand, removeCommand } from '@/utils/Commands';
import { showMessage } from 'siyuan';
import { onBeforeUnmount, onMounted, ref, watchEffect } from "vue";
import { isFree, useSettings } from '../Settings/EnSettings.vue';

const plugin = usePlugin();

const siyuanColorList = [
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
];

const siyuanBgColorList = [
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
];

const parentDatasetKey = 'en_cmd_font_style'

const colorCommandHTML = `
  <div data-${parentDatasetKey}>
    <span>点击创建字体快捷键</span>
  </div>
`;

const command = {
  langKey: "enHighlight",
  langText: colorCommandHTML,
  hotkey: "",
};

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

const settings = useSettings()

const configgedFontStyleList = ref<ICommandItem[]>(settings.value.configgedFontStyleList)
watchEffect(() => {
  settings.value.configgedFontStyleList = configgedFontStyleList.value
})

const EnFontStyleItem = `en_cmd_font_style_item`

const addCommandsByList = () => {
  plugin.commands = plugin.commands.filter((item) => !item.langKey.startsWith('EnFontStyle_'))
  configgedFontStyleList.value.forEach((item) => {
    const {
      key,
      color,
      bgColor,
    } = item
    plugin.addCommand({
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
          "
        >
          A
        </span>
      </div>
    `,
    hotkey: "",
    editorCallback(protyle) {
      protyle?.toolbar?.setInlineMark(protyle, "EnFont text", "range", {type: 'color', color: color });
      protyle?.toolbar?.setInlineMark(protyle, "EnFont text", "range", {type: 'backgroundColor', color: bgColor });
    }
  });
  })
}

const removeConfiggedFont = (item: ICommandItem) => {
  configgedFontStyleList.value = configgedFontStyleList.value.filter(i => i.key !== item.key)
}

watchEffect(() => {
  addCommandsByList()
})


const createCommand = () => {
  const color = currentColor.value
  const bgColor = currentBgColor.value
  const key = `EnFontStyle_${color}_${bgColor}`
  const exist = configgedFontStyleList.value.find((item) => item.key === key)

  if (exist) {
    showMessage('已经添加过该样式')
    return
  }
  const newLen = configgedFontStyleList.value.length + 1
  if (isFree.value && newLen > 3) {
    showMessage('免费版最多添加三个样式快捷键')
    return
  }
  configgedFontStyleList.value.push({
    key,
    color,
    bgColor,
  })
}


const handleClickStyle = (event) => {
  const target = event.target as HTMLElement;
  if (target?.parentElement) {
    if (parentDatasetKey in target.parentElement.dataset) {
      modalVisible.value = !modalVisible.value
    }
  }
};

onMounted(() => {
  addCommand(command);
  document.documentElement.addEventListener("click", handleClickStyle, true);
});
onBeforeUnmount(() => {
  removeCommand(command)
  document.documentElement.removeEventListener("click", handleClickStyle, true);
});
</script>

<script lang="ts">
export interface ICommandItem {
  key: string
  color: string
  bgColor: string
}
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
