<template></template>

<script setup lang="ts">
import { useSettings } from '@/logic';
import {
  markLifeLogBlock,
} from './logic'
import { onMounted, watchEffect } from 'vue';

onMounted(() => {
  markLifeLogBlock()
})

const settings = useSettings()
watchEffect(() => {
  document.documentElement.dataset.enhancerEnableLifelogTag = `${settings.value.lifelogEnableBlockTag}`
})
</script>

<style>
html[data-enhancer-enable-lifelog-tag="true"] {
  & [data-type="NodeParagraph"] {

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
  }
}
</style>
