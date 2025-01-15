<template>
  <EnSettingsTeleportModule
    :name="moduleOptions.moduleName"
    :display="moduleOptions.moduleDisplayName"
    :module="module"
  >
    <EnSettingsItem>
      <div>
        启用样式效果
      </div>
      <template #desc>
        <div>
          是否启用 双链颜色、双链增加中括号、图片宽度 50% 等样式。
        </div>
        <div>开关该选项查看效果：<a data-type="a">示例</a>、<span data-type="block-ref">示例</span></div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.useVipStyle" />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleportModule>
</template>



<script setup lang="ts">
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue'
import { moduleEnableStatusSwitcher } from '@/utils'
import {
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { watchEffect } from 'vue'
import EnSettingsTeleportModule from '../modules/Settings/EnSettingsTeleportModule.vue'


// #region 基本的模块配置

interface ISettingModuleOptions extends EnModule {
  useVipStyle: boolean
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
  },
})

// #endregion 基本的模块配置

watchEffect(() => {
  moduleEnableStatusSwitcher(
    EN_MODULE_LIST.EN_OTHER,
    moduleOptions.value.useVipStyle,
  )
})
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
  [data-type="block-ref"],
  [data-type="a"] {
    color: var(--sky-blue) !important;
  }

  // 反链列表项的提示效果
  // .protyle-wysiwyg [data-node-id].li[fold="1"] > .protyle-action:after {
  //   background-color: var(--b3-list-hover, #363636);
  // }


  // #region 反链面板文档名称sticky
  // .backlinkMList .b3-list-item,
  // .backlinkList .b3-list-item {
  //     --b3-theme-primary-lightest: rgba(53, 115, 240, 1);
  //     position: sticky;
  //     top: 0;
  //     z-index: 2;
  //     background-color: var(--b3-list-hover, #363636);
  // }
  // #endregion 反链面板文档名称sticky


  // #region 文档反链增加 [[]]
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
  // #endregion 文档反链增加 [[]]


  .protyle-wysiwyg {

    & > [data-type="NodeList"] {
      // background-color: rgba(0, 47, 255, 0.1);
      // background-color: rgba(65, 65, 65, 0.1);
      // background-color: rgba(255, 255, 255, 0.1);
      // 👇 这个还可以
      // background-color: rgba(77, 77, 77, 0.1);
      // background-color: rgba(93, 93, 93, 0.1);
      // 就👇这个配色了，哪种模式下都舒服
      background-color: rgba(109, 109, 109, 0.1);


      & > [data-type="NodeListItem"] {

        & > ::before {
          border-left-color: var(--sky-blue);
        }
      }
    }
  }

  [data-type="img"] span:nth-child(2) {
    text-align: left;
    & img {
      width: 50%;
    }
  }
}
</style>
