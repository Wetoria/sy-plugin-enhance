<template>
  <a-config-provider
    size="mini"
  >
    <div
      id="SyEnhancerApp"
      class="SyEnhancerApp"
      ref="SyEnhancerAppRef"
    >
      <div class="displayArea">
        <TestArco />
        <!-- <TestLogic /> -->
      </div>
      <div class="hiddenArea">

      </div>

      <!-- 全平台 -->
      <template>
        <!-- 这里的顺序，决定了设置中的模块显示顺序 -->
        <EnSettings />
        <EnSiyuanEntry />
        <DailyNote />
        <EnEditor />
        <EnBackgroundImg v-if="isVip" />
        <EnOthers />
        <EnQuickNote />
        <ArcoDartkTheme />

        <LifeLog />
        <EnVideoAndAudio v-if="isNotFree" />
        <EnFormatBrush v-if="isNotFree"  />
        <EnFont />
        <TemplateEntry />
      </template>

      <!-- 仅移动端 -->
      <template v-if="plugin.isMobile">
        <EnPWA />
        <EnMobileNav />

      </template>

      <!-- 仅桌面端 -->
      <template v-else>
        <EnComment v-if="isNotFree && !isInEnWindow" />
      </template>

      <!-- <FixedDocArea v-if="!plugin.isMobile" /> -->
    </div>
  </a-config-provider>
</template>

<script setup lang="ts">
import { onMounted, ref, watchEffect } from 'vue';
import { usePlugin } from './main';
import EnSiyuanEntry from './modules/EnSiyuanEntry.vue';


import LifeLog from './modules/LifeLog/LifeLog.vue';
import TestArco from './modules/Test/TestArco.vue';
import ArcoDartkTheme from './modules/ArcoDartkTheme.vue';
import EnPWA from './modules/EnPWA.vue';
import DailyNote, { getCurrentDocTitleDomByDom } from './modules/DailyNote/DailyNote.vue';
import EnSettings, { isPro, isVip, isNotFree } from './modules/Settings/EnSettings.vue';
import EnOthers from './modules/EnOthers.vue';
import EnBackgroundImg from './modules/Background/EnBackgroundImg.vue';
import EnQuickNote from './modules/QuickNote/EnQuickNote.vue';
import EnEditor from './modules/Editor/EnEditor.vue';
import EnMobileNav from './modules/EnMobileNav.vue';
import EnVideoAndAudio from './modules/VideoAndAudio/EnVideoAndAudio.vue';
import EnFormatBrush from './modules/EnFormatBrush/EnFormatBrush.vue';
import EnFont from './modules/Editor/EnFont.vue';
import { Protyle, showMessage } from 'siyuan';
import { request } from './api';
import TemplateEntry from './modules/Templates/TemplateEntry.vue';
import { moduleEnableStatusSwitcher } from './utils';
import EnComment from './modules/Editor/Comment/EnComment.vue';
import { isInWindow } from './modules/EnWindow.vue';
import TestLogic from './modules/Test/TestLogic.vue';

const plugin = usePlugin()

const isInEnWindow = ref(isInWindow('QuickNote') || isInWindow('EnVideoAndAudio'))

watchEffect(() => {
  moduleEnableStatusSwitcher('EnhancerIsMobile', plugin.isMobile)
})

onMounted(() => {
  const searchParams = {
    id: '',
    k: '',
    sort: '3',
    mk: '',
    mSort: '3',
  }
  plugin.protyleSlash.push({
    filter: [
      "插入当前反链 MOC",
      'insert current moc',
    ],
    html: `<div class="b3-list-item__first"><span class="b3-list-item__text">${'插入当前反链 MOC'}</span></div>`,
    id: "enInsertMocCurrent",
    callback(protyle: Protyle) {
      const titleDom = getCurrentDocTitleDomByDom(protyle.protyle.contentElement)
      if (!titleDom) {
        return
      }

      searchParams.id = titleDom.dataset.nodeId
      request('/api/ref/getBacklink2', searchParams).then((res) => {
        const {
          backlinks,
        } = res
        if (!backlinks.length) {
          showMessage('当前文档暂无反链')
          return
        }

        const insertMD = []
        backlinks.forEach((backlink) => {
          insertMD.push(`- [${backlink.name}](siyuan://blocks/${backlink.id})`)
        })
        const result = insertMD.join('\n')
        protyle.insert(result)
      })
    }
  })
})
</script>

<style lang="scss">
:root {
  --sky-blue: #00bfff;
  --sky-blue-blur: #00bfff7F;

  --en-gap: 8px;
  // --b3-theme-background: #000;
}

.row {
  display: flex;
  gap: var(--en-gap);
}

.flexColumn {
  display: flex;
  flex-direction: column;
  gap: var(--en-gap);
}

.flexCenter {
  display: flex;
  justify-content: center;
  align-items: center;
}

.flexJustifyCenter {
  display: flex;
  justify-content: center;
}

.flexAlignCenter {
  display: flex;
  align-items: center;
}
.enGap {
  display: flex;
  gap: var(--en-gap);
}

#enApp {
  width: 100vw;
  height: 100dvh;
  max-height: 100vh;
  position: absolute;
  top: 0px;
  left: 0px;
  pointer-events: none;
  box-sizing: border-box;
}
.SyEnhancerApp {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  box-sizing: border-box;
  pointer-events: none;

  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  display: flex;
  flex-wrap: nowrap;

  .displayArea,
  .hidderArea {
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .displayArea {
    display: flex;
    position: relative;
    padding: 24px;
    box-sizing: border-box;
  }

  .hidderArea {
    display: none;
  }
}

.body--window {

  #layouts {
    div[data-type="wnd"] {
      background: var(--b3-theme-background);
    }
  }
}
</style>
