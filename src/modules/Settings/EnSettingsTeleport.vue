<template>
  <Teleport :to="settingRef" v-if="settingRef">
    <div
      class="en_settings_module flexColumn"
    >
      <div class="en_settings_module_head">
        <slot name="header">{{ name }}</slot>
      </div>
      <div class="en_settings_module_body">
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
import { computed, useSlots } from 'vue';
import { registerSettingRef } from './EnSettings.vue';

const props = defineProps<{
  name: string
}>()

const settingRef = registerSettingRef(props.name)

const slots = useSlots();
const hasFooterSlot = computed(() => {
  return !!slots.footer;
});
</script>

<style lang="scss" scoped>
</style>
