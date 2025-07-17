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
        <slot v-bind="{ hasAuth }"></slot>
      </div>
      <div
        v-if="hasFooterSlot"
        class="en_settings_module_footer"
      >
        <slot name="footer"></slot>
      </div>
      <a-button
        v-if="!withoutReset"
        type="outline"
        status="danger"
        size="mini"
        @click="resetModule"
      >
        重置为默认
      </a-button>
      <div
        v-if="needAuthMask && !hasAuth"
        class="mask"
      >
        <a-button
          type="text"
          @click="goToUnlock"
        >
          <a-typography-text type="primary">
            Lv.{{ authLevel }} 可解锁
          </a-typography-text>
        </a-button>
      </div>
    </div>
  </EnSettingsTeleport>
</template>

<script setup lang="ts">
import {
  injectAuthStatus,
  injectParentAuth,
} from '@/logic/Auth'
import EnSettingsItemAreaHeading from '@/modules/Settings/EnSettingsItemAreaHeading.vue'
import EnSettingsTeleport from '@/modules/Settings/EnSettingsTeleport.vue'
import { resetModuleOptions } from '@/modules/Settings/SettingsModuleControl'
import { EN_EVENT_BUS_KEYS } from '@/utils/Constants'
import { enEventBus } from '@/utils/EnEventBus'
import {
  computed,
  onBeforeUnmount,
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
  withoutReset?: boolean

  noAuthMask?: boolean
  authLevel?: number | string

  manual?: boolean
}>()

const emit = defineEmits(['moduleEnabled', 'moduleDisabled'])

const needAuthMask = computed(() => !props.noAuthMask)

const {
  computedLevel,
} = injectAuthStatus()
const hasLevelAuth = computedLevel(props.authLevel)

// 获取父级权限
// 如果父级使用过 computedLevel, 则会自动注入父级权限
const parentAuth = injectParentAuth()

const hasAuth = computed(() => {

  // 如果父级提供了权限，则按照父级的权限进行判断
  if (parentAuth) {
    return parentAuth.value
  }

  // 如果父级没有提供权限，则按照 authLevel 的权限进行判断
  return hasLevelAuth.value
})

const goToUnlock = () => {
  enEventBus.emit(EN_EVENT_BUS_KEYS.AUTH_OPEN_MODAL)
}

const slots = useSlots()
const hasFooterSlot = computed(() => {
  return !!slots.footer
})

const module = computed(() => props.module)
const moduleData = computed(() => module.value.data)
const moduleBooleanOptionKeys = computed(() => {
  return Object.keys(moduleData.value || {})
    .filter((key) => typeof moduleData.value[key] === 'boolean')
})

// 模块中是否存在布尔值选项
// 允许模块中不存在布尔值选项的同时，也能进行开关
const hasBooleanOptions = computed(() => {
  return !!moduleBooleanOptionKeys.value.length
})

// 除了 enabled 之外，模块中其他布尔值选项
const moduleBooleanOptionsKeysWithoutEnabledAttr = computed(() => {
  return moduleBooleanOptionKeys.value.filter((key) => key !== 'enabled')
})

// 模块中是否存在布尔值选项
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
  if (props.manual) {
    return
  }
  moduleBooleanOptionKeys.value.forEach((key) => {
    moduleData.value[key] = enabled
  })
}

// 防止重复处理模块的开关
let resetFlag = false
const resetModule = () => {
  resetFlag = true
  resetModuleOptions(module)
}

watch(() => moduleData.value.enabled, (enabled) => {
  if (enabled) {
    emit('moduleEnabled')
  } else {
    emit('moduleDisabled')
  }
}, {
  immediate: true,
})
onBeforeUnmount(() => {
  emit('moduleDisabled')
})

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

    if (props.manual) {
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

  .en_settings_module_head {
    padding: 2px 0px;

    position: sticky;
    top: 0px;
    z-index: 1;

    background-color: var(--b3-theme-surface);
  }

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
