<template>
  <div
    class="EnhanceSettingsContainer"
  >
    <div
      class="SettingsScrollContent"
    >

      <SettingItemAreaHeading>
        底部反链
      </SettingItemAreaHeading>
      <SettingItem>
        <div>
          启用底部反链
        </div>
        <template #desc>
          <div>
            是否启用底部反链。
          </div>
        </template>
        <template #opt>
          <SyCheckbox v-model="settings.enableBottomBacklink" />
        </template>
      </SettingItem>

      <SettingItem>
        <div>
          默认展开反链筛选区域
        </div>
        <template #desc>
          <div>
            是否默认展开底部反链的筛选区域。
          </div>
        </template>
        <template #opt>
          <SyCheckbox v-model="settings.defaultShowBacklinkFilter" />
        </template>
      </SettingItem>

      <SettingItem>
        <div>
          启用底部反链筛选功能
        </div>
        <template #desc>
          <div>
            是否启用底部反链筛选功能。
          </div>
        </template>
        <template #opt>
          <SyCheckbox v-model="settings.enableBacklinkFilter" />
        </template>
      </SettingItem>

      <SettingItem mode="vertical">
        <div>
          反链筛选 SQL 查询上限
        </div>
        <template #desc>
          <div>
            与反链筛选功能有关。如果设置的太小，可能会导致数据不正确。<br />
            请输入正确的数字，否则会重置为默认的 999999999.
          </div>
        </template>
        <template #opt>
          <SyInput
            v-model="settings.sqlLimit"
          />
        </template>
      </SettingItem>

      <div class="sperator"></div>


      <div class="sperator"></div>

      <SettingItemAreaHeading>
        LifeLog
      </SettingItemAreaHeading>
      <SettingItem mode="vertical">
        <div>
          同步地址
        </div>
        <template #desc>
          <div
            style="
              width: 100%;
              white-space: break-all;
              white-space: wr;
            "
          >
            LifeLog 数据同步用的地址。<br />
            <span style="word-wrap: break-word;">
              当前地址：{{ settings.lifelogPostUrl }}
            </span>
          </div>
        </template>
        <template #opt>
          <SyInput
            v-model="settings.lifelogPostUrl"
          />
        </template>
      </SettingItem>

      <SettingItem>
        <div>
          显示段落前标记
        </div>
        <template #desc>
          <div>
            是否显示 LifeLog 段落前标记。
          </div>
        </template>
        <template #opt>
          <SyCheckbox v-model="settings.lifelogEnableBlockTag" />
        </template>
      </SettingItem>

      <SettingItem mode="vertical">
        <div>
          LifeLog触发时间
        </div>
        <template #desc>
          <div>
            停止编辑以后，触发标记逻辑的等待时间。单位：秒。
          </div>
        </template>
        <template #opt>
          <SyInput
            v-model="settings.lifelogTriggerTime"
            type="number"
            min="1"
          />
        </template>
      </SettingItem>

      <div class="sperator"></div>
      <SettingItemAreaHeading>
        固定文档
      </SettingItemAreaHeading>
      <div>
        由于交互上的问题，<b>这个版本移除了移动端的文档固定区域。</b><br>
        关于移动端的交互，已经有了新的想法，敬请期待。
      </div>
      <SettingItem>
        <div>
          启用文档固定功能
        </div>
        <template #desc>
          <div>
            是否启用文档固定功能。
          </div>
        </template>
        <template #opt>
          <SyCheckbox v-model="settings.enableFixedDocArea" />
        </template>
      </SettingItem>


      <div class="sperator"></div>

    <!-- <SettingItem mode="complex">
      <div>
        导航栏文档切换模式
      </div>
      <template #desc>
        <div>
          切换导航栏上/下一篇翻页模式为翻日记，或翻浏览过的文档。
        </div>
      </template>
      <template #opt>
        <SySelect
        v-model="settings.mobileSwitchDocMode"
        :options="[
              {
                value: 'doc',
                text: '切换历史文档'
              },
              {
                value: 'dailyNote',
                text: '切换日记'
              },
            ]"
          ></SySelect>
        </template>
      </SettingItem> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import SyCheckbox from '../SiyuanTheme/SyCheckbox.vue';
import SySelect from '../SiyuanTheme/SySelect.vue';
import SettingItem from '../../modules/Settings/EnSettingsItem.vue';
import SyInput from '../SiyuanTheme/SyInput.vue';
import { usePlugin } from '@/main';
import SettingItemAreaHeading from '../../modules/Settings/EnSettingsItemAreaHeading.vue';
import { useSettings } from '@/modules/Settings/EnSettings.vue';

const settings = useSettings()

const plugin = usePlugin()

</script>

<style lang="scss">
.SyEnhancerDialogTitle {
  font-weight: bold;
  color: var(--b3-theme-primary);
}
</style>

<style scoped lang="scss">
.EnhanceSettingsContainer {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 9px 24px;
  box-sizing: border-box;
  max-height: 80vh;
  overflow-x: hidden;
  overflow-y: auto;

  .SettingsScrollContent {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .sperator {
    width: 100%;
    height: 1px;
    border-bottom: 1px solid var(--b3-theme-surface-lighter);
  }

}
.aboutArea {
  display: flex;
  width: 100%;
  justify-content: flex-end;
  align-items: center;
  padding: 9px 24px;
  box-sizing: border-box;
  border-top: 1px solid var(--b3-theme-surface-lighter);
  gap: 12px;
}
</style>
