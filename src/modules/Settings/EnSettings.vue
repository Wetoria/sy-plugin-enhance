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
      <div
        v-for="refItem of Object.keys(settingsRefMap)"
        :ref="(el) => settingsRefMap[refItem] = el"
        :data-ref-name="refItem"
      >
      </div>
      <div ref="settingsTestRef"></div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { ref, watch, watchEffect } from 'vue';
const plugin = usePlugin()

console.log('en settings 1')
</script>

<script lang="ts">
console.log('en settings 2')
export const editingSettings = ref(false);

const settingsRefMap = ref({})
watchEffect(() => {
  console.log('settingsRefMap is ', settingsRefMap.value)
})
export function registerSettingRef(refName: string) {
  const newRef = ref()
  settingsRefMap.value[refName] = newRef
  console.log(`register setting, setting module name is: ${refName}`)
  console.log(`ref is ${settingsRefMap.value[refName]}`)
  watch(() => newRef, () => {
    console.log(`newRef is ${newRef}`)
  })
  return newRef
}

export const settingsTestRef = ref();

export const openSettings = () => {
  console.log('test')
  editingSettings.value = true;
}

export const closeSettings = () => {
  editingSettings.value = false;
}
</script>

<style lang="scss" scoped>
.en_settings_list {
}
</style>
