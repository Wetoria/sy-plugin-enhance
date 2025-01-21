<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
  >
    <div>部分样式效果：<a data-type="a">示例</a>、<span data-type="block-ref">示例</span></div>
    <EnSettingsItem>
      <div>
        启用块引及超链接颜色
      </div>
      <template #desc>
        <div>
          是否启用块引及超链接颜色
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableLinkColor" />
      </template>
    </EnSettingsItem>

    <EnSettingsItem>
      <div>
        启用块引双括号
      </div>
      <template #desc>
        <div>
          是否显示块引双括号
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enbaleBlockRefBracket" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem>
      <div>
        启用日记首个容器块背景色
      </div>
      <template #desc>
        <div>
          是否启用日记首个容器块背景色，将首个容易块当作“卡片”。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableDailyNoteFirstBlockBg" />
      </template>
    </EnSettingsItem>

    <EnSettingsItem>
      <div>
        启用图片默认宽度
      </div>
      <template #desc>
        <div>
          是否启用图片默认宽度。不影响单个图片宽度的调整。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableImageDefaultWidth" />
      </template>
    </EnSettingsItem>
    <EnSettingsItem mode="vertical">
      <div>
        图片默认宽度百分比
      </div>
      <template #opt>
        <a-input-number
          v-model="moduleOptions.defaultImageWidth"
          placeholder="Please Enter"
          mode="button"
          :readOnly="plugin.isMobile"
          :step="1"
          :max="100"
          :min="1"
        />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>



<script setup lang="ts">
import { usePlugin } from '@/main'
import {
  useModule,
  watchConfigChanged,
  watchConfigEnableStatus,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import {
  moduleEnableStatusSwitcher,
} from '@/utils'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import EnSettingsTeleportModule from '../modules/Settings/EnSettingsTeleportModule.vue'

const plugin = usePlugin()

// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule {
  useVipStyle: boolean
  enableLinkColor: boolean
  enbaleBlockRefBracket: boolean
  enableImageDefaultWidth: boolean
  defaultImageWidth: number
  enableDailyNoteFirstBlockBg: boolean
}

const {
  module,
  moduleOptions,
} = useModule<ISettingModuleOptions>(EN_MODULE_LIST.EN_OTHER, {
  defaultData: {
    enabled: false,
    moduleName: EN_MODULE_LIST.EN_OTHER,
    moduleDisplayName: EN_CONSTANTS.EN_OTHER_DISPLAY,

    useVipStyle: false,
    enableLinkColor: false,
    enbaleBlockRefBracket: false,
    enableImageDefaultWidth: false,
    defaultImageWidth: 50,
    enableDailyNoteFirstBlockBg: false,
  },
})

// #endregion 基本的模块配置


watchConfigEnableStatus(
  () => moduleOptions.value.enabled,
  () => {
    moduleEnableStatusSwitcher(EN_MODULE_LIST.EN_OTHER, moduleOptions.value.enabled)
    return () => {
      moduleEnableStatusSwitcher(EN_MODULE_LIST.EN_OTHER)
    }
  },
)

watchConfigEnableStatus(
  () => moduleOptions.value.enableLinkColor,
  () => {
    moduleEnableStatusSwitcher(
      EN_CONSTANTS.EN_OTHER_LINK_COLOR,
      moduleOptions.value.enableLinkColor,
    )
    return () => {
      moduleEnableStatusSwitcher(
        EN_CONSTANTS.EN_OTHER_LINK_COLOR,
      )
    }
  },
)

watchConfigEnableStatus(
  () => moduleOptions.value.enbaleBlockRefBracket,
  () => {
    moduleEnableStatusSwitcher(
      EN_CONSTANTS.EN_OTHER_BLOCK_REF_BRACKET,
      moduleOptions.value.enbaleBlockRefBracket,
    )
    return () => {
      moduleEnableStatusSwitcher(
        EN_CONSTANTS.EN_OTHER_BLOCK_REF_BRACKET,
      )
    }
  },
)

watchConfigEnableStatus(
  () => moduleOptions.value.enableDailyNoteFirstBlockBg,
  () => {
    moduleEnableStatusSwitcher(
      EN_CONSTANTS.EN_OTHER_DAILY_NOTE_FIRST_BLOCK_BG,
      moduleOptions.value.enableDailyNoteFirstBlockBg,
    )
    return () => {
      moduleEnableStatusSwitcher(
        EN_CONSTANTS.EN_OTHER_DAILY_NOTE_FIRST_BLOCK_BG,
      )
    }
  },
)

watchConfigEnableStatus(
  () => moduleOptions.value.enableImageDefaultWidth,
  () => {
    moduleEnableStatusSwitcher(
      EN_CONSTANTS.EN_OTHER_IMAGE_DEFAULT_WIDTH,
      moduleOptions.value.enableImageDefaultWidth,
    )
    return () => {
      moduleEnableStatusSwitcher(
        EN_CONSTANTS.EN_OTHER_IMAGE_DEFAULT_WIDTH,
      )
    }
  },
)


watchConfigChanged(
  () => moduleOptions.value.defaultImageWidth,
  () => {
    document.documentElement.style.setProperty('--en-img-default-width', `${moduleOptions.value.defaultImageWidth}%`)
    return () => {
      document.documentElement.style.removeProperty('--en-img-default-width')
    }
  },
)
</script>

<style lang="scss" scoped>
.moduleHead {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

<style lang="scss">
html[data-en_enabled_module~="EnOther"] {
  &[data-en_enabled_module~="EnhancerIsMobile"] {
    .toolbar {
      border-bottom: unset;
    }
  }

  &[data-en_enabled_module~="EnOtherLinkColor"] {
    [data-type="block-ref"],
    [data-type="a"] {
      color: var(--sky-blue) !important;
    }
  }

  // #region 文档反链增加 [[]]
  &[data-en_enabled_module~="EnOtherBlockRefBracket"] {
    span[data-type="block-ref"] {
      font-weight: inherit;
      background-color: transparent !important;
      border-bottom: none !important;
    }

    /* 为引用块后面增加引用图标 */
    span[data-type="block-ref"]::before {
      color: var(--b3-theme-on-surface) !important;
      content: "[[";
    }

    span[data-type="block-ref"]::after {
      color: var(--b3-theme-on-surface) !important;
      content: "]]";
    }

    span[data-type="block-ref"]:hover {
      background-color: var(--b3-theme-primary-lightest) !important;
    }
  }
  // #endregion 文档反链增加 [[]]


  &[data-en_enabled_module~="EnOtherDailyNoteFirstBlockBg"] {
    .protyle-wysiwyg[data-en_is_dailynote] {
      & > [data-type="NodeSuperBlock"],
      & > [data-type="NodeList"] {
        // background-color: rgba(0, 47, 255, 0.1);
        // background-color: rgba(65, 65, 65, 0.1);
        // background-color: rgba(255, 255, 255, 0.1);
        // 👇 这个还可以
        // background-color: rgba(77, 77, 77, 0.1);
        // background-color: rgba(93, 93, 93, 0.1);
        // 就👇这个配色了，哪种模式下都舒服
        background-color: rgba(109, 109, 109, 0.1);
      }
    }
  }

  &[data-en_enabled_module~="EnOtherImageDefaultWidth"] {
    [data-type="img"] {
      span:nth-child(2):not([style^="width"]) {
        width: var(--en-img-default-width);
      }
    }
  }
}
</style>
