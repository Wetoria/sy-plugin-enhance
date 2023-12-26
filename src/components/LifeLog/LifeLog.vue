<template></template>

<script setup lang="ts">
import { useSettings } from '@/logic';
import {
  markLifeLogBlock,
} from './logic'
import { onMounted, watchEffect } from 'vue';
import { queryAllByDom } from '@/utils/DOM';
import { usePlugin } from '@/main';

const plugin = usePlugin()

const listenerSticky = () => {
  const map = new WeakMap()

  const handler = (scrollArea) => {
    const paragraphList = queryAllByDom(document.body, '[data-type="NodeParagraph"][custom-lifelog-time]')

    let flag = true
    paragraphList.reverse()
    paragraphList.forEach((p: HTMLElement) => {

      const pRect = p.getBoundingClientRect()
      const sRect = scrollArea.getBoundingClientRect()

      if (pRect.top <= sRect.top && flag) {
        p.classList.toggle('en-stickied', true)
        p.style.borderBottom = getComputedStyle(p).borderLeft
        p.style.borderRight = getComputedStyle(p).borderLeft
        flag = false
      } else {
        p.classList.toggle('en-stickied', false)
        p.style.borderBottom = ''
        p.style.borderRight = ''
      }
    })
  }
  const observer = new MutationObserver(() => {
    const protyleContentList = queryAllByDom(document.body, plugin.isMobile ? '.enhanceHackUi .contentSection' : '.protyle-content')
    protyleContentList.forEach((item: HTMLElement) => {
      if (map.has(item)) {
        return
      }

      item.addEventListener('scroll', () => {
        handler(item)
      })
      map.set(item, true)
    })
  });
  observer.observe(document.body, {
    childList: true, // 观察目标子节点的变化，是否有添加或者删除
    subtree: true, // 观察后代节点，默认为 false
  })
}

onMounted(() => {
  markLifeLogBlock()
  listenerSticky();
})

const settings = useSettings()
watchEffect(() => {
  document.documentElement.dataset.enhancerEnableLifelogTag = `${settings.value.lifelogEnableBlockTag}`
  document.documentElement.dataset.enhancerIsMobile = `${plugin.isMobile}`
})
</script>

<style>
html[data-enhancer-enable-lifelog-tag="true"] {
  .enLifeLogStickyContainer {
    position: absolute;
    top: 30px;
    width: 100%;
    height: max-content;
    box-sizing: border-box;
    z-index: 2;
  }

  & [data-type="NodeParagraph"] {

    &[custom-lifelog-type] {
      z-index: 2;
      &.en-stickied {
        position: sticky;
      }
    }

    &[custom-lifelog-type="固"] {
      border-left: 1px solid #D3D3D3;
    }
    &[custom-lifelog-type="固定"] {
      border-left: 1px solid #D3D3D3;
    }

    &[custom-lifelog-type="增"] {
      border-left: 1px solid #90EE90;
    }
    &[custom-lifelog-type="学习"] {
      border-left: 1px solid #90EE90;
    }

    &[custom-lifelog-type="事业"] {
      border-left: 1px solid #90EE90;
    }

    &[custom-lifelog-type="工作"] {
      border-left: 1px solid #FFD700;
    }

    &[custom-lifelog-type="废"] {
      border-left: 1px solid #FF0000;
    }
    &[custom-lifelog-type="娱乐"] {
      border-left: 1px solid #FF0000;
    }
    &[custom-lifelog-type="荒废"] {
      border-left: 1px solid #FF0000;
    }
    &[custom-lifelog-type="玩"] {
      border-left: 1px solid #FF0000;
    }

    &[custom-lifelog-type="家庭"] {
      border-left: 1px solid rgb(71, 255, 248);
    }
    &[custom-lifelog-type="家"] {
      border-left: 1px solid rgb(71, 255, 248);
    }
    &[custom-lifelog-type="朋友"] {
      border-left: 1px solid rgb(156, 123, 85);
    }
    &[custom-lifelog-type="友"] {
      border-left: 1px solid rgb(156, 123, 85);
    }

  }

  &[data-enhancer-is-mobile="true"] {
    [custom-lifelog-type] {
      background-color: var(--hack-theme-color);

      &.en-stickied {
        top: -4px;
      }
    }
  }
  &[data-enhancer-is-mobile="false"] {
    [custom-lifelog-type] {
      background-color: var(--b3-theme-background);

      &.en-stickied {
        top: -0px;
      }
    }
  }
}
</style>
