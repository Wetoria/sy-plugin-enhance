<template>
  <Teleport :to="settingRef" v-if="settingRef">
    <div
      class="en_settings_module flexColumn"
    >
      <div class="en_settings_module_head">
        <EnSettingsItemAreaHeading>
          <div class="moduleHead">
            <span>
              {{ display }}
            </span>
            <a-switch
              v-model="module.enabled"
              @change="onModuleSwitch"
            />
          </div>
        </EnSettingsItemAreaHeading>
      </div>
      <div class="en_settings_module_body flexColumn">
        <slot></slot>
      </div>
      <div
        class="en_settings_module_footer"
        v-if="hasFooterSlot"
      >
        <slot name="footer"></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, useSlots, watch } from 'vue';
import { EnModuleType, registerSettingRef } from './EnSettings.vue';
import EnSettingsItemAreaHeading from './EnSettingsItemAreaHeading.vue';

const props = defineProps<{
  name: string
  display: string
  module: EnModuleType
}>()

const settingRef = registerSettingRef(props.name)

const slots = useSlots();
const hasFooterSlot = computed(() => {
  return !!slots.footer;
});

const module = computed(() => props.module)
const onModuleSwitch = (enabled) => {
  Object.keys(module.value.options).forEach((key) => {
    const value = module.value.options[key]
    if (typeof value == 'boolean') {
      module.value.options[key] = enabled
    }
  })
}

watch(() => module.value.options, () => {
  const optionsKeys = Object.keys(module.value.options)
      .filter((key) => typeof module.value.options[key] == 'boolean')
  if (!optionsKeys.length) {
    return
  }
  if (module.value.enabled) {
    const noEnabled = optionsKeys.every((key) => !module.value.options[key])
    if (noEnabled) {
      module.value.enabled = false
    }
  } else {
    const hasEnabled = optionsKeys.some((key) => module.value.options[key])
    if (hasEnabled) {
      module.value.enabled = true
    }
  }
}, {deep: true})
</script>

<style lang="scss" scoped>
.moduleHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
