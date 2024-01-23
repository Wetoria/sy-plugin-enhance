<template>
  <div
    class="EnhanceSettingsContainer"
  >
    <div
      class="SettingsScrollContent"
    >
      <SettingItemAreaHeading>
        其他
      </SettingItemAreaHeading>
      <SettingItem>
        <div>
          启用样式效果
        </div>
        <template #desc>
          <div>
            是否启用双链颜色、双链增加中括号等样式。
          </div>
        </template>
        <template #opt>
          <SyCheckbox v-model="settings.useVipStyle" />
        </template>
      </SettingItem>

      <!-- <SettingItem>
        <div>
          编辑完自动同步
        </div>
        <template #desc>
          <div>
            是否在编辑完以后自动同步。<br />
            开启后，将会在停止编辑的2秒后，或敲击回车时自动同步。<br />
            配合思源的「同步感知」功能，能做到一定程度的多端实时同步。<br />
            注意：该功能会有一定的性能影响，请按需开启。
          </div>
        </template>
        <template #opt>
          <SyCheckbox v-model="settings.enableAutoSync" />
        </template>
      </SettingItem> -->

      <div class="sperator"></div>

      <SettingItemAreaHeading>
        段落编辑时间
      </SettingItemAreaHeading>
      <SettingItem>
        <div>
          显示编辑时间
        </div>
        <template #desc>
          <div>
            是否显示块的编辑时间。
          </div>
        </template>
        <template #opt>
          <SyCheckbox v-model="settings.enableBlockTime" />
        </template>
      </SettingItem>

      <SettingItem mode="complex">
        <div>
          编辑时间字体大小
        </div>
        <template #desc>
          <div>
            块编辑时间的字体大小。
          </div>
        </template>
        <template #opt>
          <SyInput
            v-model="settings.blockTimeFontSize"
            type="number"
          />
        </template>
      </SettingItem>

      <div class="sperator"></div>

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

      <SettingItem mode="complex">
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

      <SettingItemAreaHeading>
        悬浮球
      </SettingItemAreaHeading>
      <SettingItem mode="complex">
        <div>
          悬浮球开启平台
        </div>
        <template #desc>
          <div>
            选择悬浮球启用的平台。全部、仅移动端、关闭悬浮球。
          </div>
        </template>
        <template #opt>
          <SySelect
            v-model="settings.floatingBallPlatform"
            :options="[
              {
                value: 'all',
                text: '全部'
              },
              {
                value: 'only-mobile',
                text: '仅移动端'
              },
              {
                value: 'none',
                text: '关闭悬浮球'
              },
            ]"
          ></SySelect>
        </template>
      </SettingItem>

      <div class="sperator"></div>

      <SettingItemAreaHeading>
        LifeLog
      </SettingItemAreaHeading>
      <SettingItem mode="complex">
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

      <SettingItem mode="complex">
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

    <SettingItemAreaHeading>
      移动端
    </SettingItemAreaHeading>
    <SettingItem>
      <div>
        导航栏显示名称
      </div>
      <template #desc>
        <div>
          是否显示导航栏按钮的名称。
        </div>
      </template>
      <template #opt>
        <SyCheckbox v-model="settings.showMobileNavLabel" />
      </template>
    </SettingItem>

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
  <div
    class="aboutArea"
  >
    <span>
      使用说明：
      <a href="https://simplest-frontend.feishu.cn/docx/B3NndXHi7oLLXJxnxQmcczRsnse">{{plugin.version ? `v${plugin.version}` : ''}}</a>
    </span>
    <span>
      作者：
      <a href="https://wetoria.me">Wetoria</a>
    </span>
  </div>
</template>

<script setup lang="ts">
import SyCheckbox from '../SiyuanTheme/SyCheckbox.vue';
import SySelect from '../SiyuanTheme/SySelect.vue';
import SettingItem from './SettingItem.vue';
import SyInput from '../SiyuanTheme/SyInput.vue';
import { usePlugin } from '@/main';
import SettingItemAreaHeading from './SettingItemAreaHeading.vue';
import { useSettings } from '@/logic/Settings';

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
