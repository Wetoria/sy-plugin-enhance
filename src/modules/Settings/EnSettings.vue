<template>

  <a-drawer
    popup-container="#parentNode"
    :visible="editingSettings"
    :unmountOnClose="true"
    :drawer-style="{
      maxHeight: '90vh',
      height: 'unset',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
    }"
    height="unset"
    placement="bottom"
    @cancel="closeSettings"
  >
    <template #title>
      <div class="SyEnhancerDialogTitle">
        {{plugin.i18n.pluginName}}
      </div>
    </template>

    <div class="flexColumn en_settings_list">
      <template
        v-for="(refItem, index) of settingRefKeys"
      >
        <div
          :ref="(el) => settingsRefMap[refItem] = el"
          :data-ref-name="refItem"
        >
        </div>
        <EnDivider v-if="index != settingRefKeys.length - 1" />
      </template>
    </div>

    <template #footer>
      <div class="enSettingsFooter">
        <span>
          使用说明：
          <a href="https://simplest-frontend.feishu.cn/docx/B3NndXHi7oLLXJxnxQmcczRsnse">{{plugin.version ? `v${plugin.version}` : ''}}</a>
        </span>
        <span>
          作者：
          <a href="https://wetoria.me">Wetoria</a>
        </span>
      </div>
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import EnDivider from '@/components/EnDivider.vue';
import { loadSettings } from '@/logic/Settings';
import { usePlugin } from '@/main';
import { computed, onMounted, ref } from 'vue';
const plugin = usePlugin()


onMounted(() => {
  loadSettings()
})
</script>

<script lang="ts">
export const editingSettings = ref(false);

const settingsRefMap = ref({})
const settingRefKeys = computed(() => Object.keys(settingsRefMap.value))

export function registerSettingRef(refName: string) {
  const newRef = ref()
  settingsRefMap.value[refName] = newRef
  return newRef
}

export const openSettings = () => {
  editingSettings.value = true;
}

export const closeSettings = () => {
  editingSettings.value = false;
}
</script>

<style lang="scss" scoped>
.en_settings_list {
}

.enSettingsFooter {
  display: flex;
  justify-content: flex-end;
  gap: var(--en-gap);
}
</style>
