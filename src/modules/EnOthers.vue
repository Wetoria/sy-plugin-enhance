<template>
  <EnSettingsTeleport
    :name="moduleName"
    :display="moduleDisplayName"
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

    <EnSettingsItem>
      <div>
        锁定段落块
      </div>
      <template #desc>
        <div>
          是否开启锁定段落块为不可编辑。
        </div>
      </template>
      <template #opt>
        <a-switch v-model="moduleOptions.enableLockParagraph" />
      </template>
    </EnSettingsItem>
  </EnSettingsTeleport>
</template>



<script setup lang="ts">
import EnSettingsItem from '@/modules/Settings/EnSettingsItem.vue';
import EnSettingsTeleport from './Settings/EnSettingsTeleport.vue';
import { useModule } from '@/logic/Settings';
import { computed, watchEffect } from 'vue';
import { switchState } from './Settings/EnSettings.vue';

interface ModuleOptions {
  useVipStyle: boolean
  enableLockParagraph: boolean
}

const moduleName = 'EnOther'
const moduleDisplayName = '其他设置'
const defaultOptions = {
  useVipStyle: false,
  enableLockParagraph: false,
}
const module = useModule(moduleName, defaultOptions)
const moduleOptions = computed(() => module.value.options as ModuleOptions)

watchEffect(() => {
  switchState('enhancer', moduleOptions.value.useVipStyle)
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
html[data-enhancer="true"] {
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

  [data-type="img"] {
    display: inline-block !important;
    width: 50%;
  }
}
</style>
