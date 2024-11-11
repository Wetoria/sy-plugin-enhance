<template>
  <EnSettingsTeleport :name="name">
    <div
      class="en_settings_module flexColumn"
    >
      <div class="en_settings_module_head">
        <EnSettingsItemAreaHeading>
          <div class="moduleHead">
            <span>
              {{ display }}
            </span>
            <div>
              <a-switch
                v-if="!always"
                v-model="moduleData.enabled"
                @change="onModuleSwitch"
              />
            </div>
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
      <a-button
        type="outline"
        size="mini"
        @click="resetModule"
      >
        设为默认
      </a-button>
    </div>
  </EnSettingsTeleport>
</template>

<script setup lang="ts">
import { computed, useSlots, watch } from 'vue';
import { EnModule, EnSettingModule, resetModuleOptions, useSettingModuleData } from '@/modules/Settings/EnSettings.vue';
import EnSettingsItemAreaHeading from '@/modules/Settings/EnSettingsItemAreaHeading.vue';
import EnSettingsTeleport from '@/modules/Settings/EnSettingsTeleport.vue';

const props = defineProps<{
  name: string
  display: string
  module: EnSettingModule<EnModule>
  always?: boolean
}>()

const slots = useSlots();
const hasFooterSlot = computed(() => {
  return !!slots.footer;
});

const module = computed(() => props.module)
const moduleData = useSettingModuleData(props.name)
const moduleBooleanOptionKeys = computed(() => {
  return Object.keys(moduleData.value || {})
    .filter(key => typeof moduleData.value[key] === 'boolean')
})
const hasBooleanOptions = computed(() => {
  return !!moduleBooleanOptionKeys.value.length
})

const moduleBooleanOptionsKeysWithoutEnabledAttr = computed(() => {
  return moduleBooleanOptionKeys.value.filter(key => key !== 'enabled')
})
const hasSubBooleanOptions = computed(() => {
  return !!moduleBooleanOptionsKeysWithoutEnabledAttr.value.length
})


/**
 * 模块开关切换
 * @param enabled 是否启用
 *
 * 在模块上进行开关时，需要将相关的设置全部开启或关闭
 */
const onModuleSwitch = (enabled) => {
  if (!hasBooleanOptions.value) {
    enLog('Module has no boolean options')
    return
  }
  moduleBooleanOptionKeys.value.forEach((key) => {
    moduleData.value[key] = enabled
  })
}

const resetModule = () => {
  resetModuleOptions(module)
}

/**
 * 监听模块数据变化
 *
 * 在切换模块内部设置时，需要控制整个模块的开关。
 */
watch(moduleData, () => {

  // 如果模块没有子模块，则不需要进行开关控制
  if (!hasSubBooleanOptions.value) {
    return
  }

  // 如果模块开启中，最新的子模块数据全部为关闭时，需要关闭当前模块
  if (moduleData.value.enabled) {
    const allSubOptionsDisabled = moduleBooleanOptionsKeysWithoutEnabledAttr.value.every((key) => !moduleData.value[key])
    if (allSubOptionsDisabled) {
      moduleData.value.enabled = false
    }
  } else {
    // 如果模块关闭中，最新的子模块数据中存在开启时，需要开启当前模块
    const hasEnabled = moduleBooleanOptionsKeysWithoutEnabledAttr.value.some((key) => moduleData.value[key])
    if (hasEnabled) {
      moduleData.value.enabled = true
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
