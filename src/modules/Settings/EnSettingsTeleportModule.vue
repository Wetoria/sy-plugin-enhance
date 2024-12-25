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
                :disabled="!hasAuth"
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
        v-if="hasFooterSlot"
        class="en_settings_module_footer"
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
      <div
        v-if="!hasAuth"
        class="mask"
      >
        <a-typography-text type="primary">
          Lv.{{ authLevel }} 可解锁
        </a-typography-text>
      </div>
    </div>
  </EnSettingsTeleport>
</template>

<script setup lang="ts">
import {
  EnModule,
  EnSettingModule,
  resetModuleOptions,
  useSettingModuleData,
} from '@/modules/Settings/EnSettings.vue'
import { useAuthLevel } from '@/modules/Settings/EnSettingsAuth.vue'
import EnSettingsItemAreaHeading from '@/modules/Settings/EnSettingsItemAreaHeading.vue'
import EnSettingsTeleport from '@/modules/Settings/EnSettingsTeleport.vue'
import {
  computed,
  onMounted,
  onUnmounted,
  useSlots,
  watch,
} from 'vue'

const props = defineProps<{
  name: string
  display: string
  module: EnSettingModule<EnModule>
  always?: boolean
  authLevel?: number | string
}>()

const hasAuth = useAuthLevel(props.authLevel)

const slots = useSlots()
const hasFooterSlot = computed(() => {
  return !!slots.footer
})

const module = computed(() => props.module)
const moduleData = useSettingModuleData(props.name)
const moduleBooleanOptionKeys = computed(() => {
  return Object.keys(moduleData.value || {})
    .filter((key) => typeof moduleData.value[key] === 'boolean')
})
const hasBooleanOptions = computed(() => {
  return !!moduleBooleanOptionKeys.value.length
})

const moduleBooleanOptionsKeysWithoutEnabledAttr = computed(() => {
  return moduleBooleanOptionKeys.value.filter((key) => key !== 'enabled')
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

let resetFlag = false
const resetModule = () => {
  resetFlag = true
  resetModuleOptions(module)
}

onMounted(() => {
  /**
   * 监听模块数据变化
   *
   * 在切换模块内部设置时，需要控制整个模块的开关。
   */
  const unwatchFunc = watch(moduleData, () => {
    if (resetFlag) {
      resetFlag = false
      return
    }

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
  }, { deep: true })

  onUnmounted(() => {
    unwatchFunc()
    enSuccess('Module unmounted', props.name)
  })

  enSuccess('Module mounted', props.name)
})

</script>

<style lang="scss" scoped>
.moduleHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.en_settings_module {
  position: relative;

  .mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color:  color-mix(in srgb, var(--color-bg-3) 50%, transparent);
    z-index: 10;

    display: flex;
    justify-content: center;
    align-items: center;
  }
}
</style>
