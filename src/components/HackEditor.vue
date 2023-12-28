<template>

</template>

<script setup lang="ts">
import { insertBlockTime } from '@/logic';
import { useSettings } from '@/logic/Settings';
import { onMounted, watchEffect } from 'vue';

const settings = useSettings()
watchEffect(() => {
  const isEnableBlockTime = settings.value.enableBlockTime
  document.documentElement.dataset.enhancerEnableBlockTime = `${isEnableBlockTime}`
  if (isEnableBlockTime) {
    document.documentElement.style.setProperty('--timeFontSize', `${settings.value.blockTimeFontSize}px`)
  }
})

onMounted(() => {
  insertBlockTime();
})
</script>

<style lang="scss">
html[data-enhancer-enable-block-time="true"] {
  --topPos: 3px;
  --timeFontSize: 9px;
  --letterSpacing: 3px;
  --rightPos: 0px;
  --v-divider-color: var(--sky-blue);

  div[data-type="NodeParagraph"],
  div[data-type="NodeHeading"],
  div[data-type="NodeTable"]
  {

    padding-top: calc(var(--timeFontSize)) !important;

    &[updated]::before,
    &[updated]::after {
      position: absolute;
      height: var(--timeFontSize);
      right: var(--rightPos);
      top: var(--topPos);
      font-size: var(--timeFontSize);
      line-height: var(--timeFontSize);

      font-family: monospace;

      display: flex;
      justify-content: flex-end;

      color: #d1d1d1;
      font-weight: normal;
    }
    &[updated]::before {
      content: attr(data-en-updated);
    }
    &[updated]::after {
      content: attr(data-en-updated-format);
      white-space: pre;
      color: var(--v-divider-color);
    }
  }

  div[data-type="NodeListItem"] {
    padding-top: calc(var(--timeFontSize)) !important;
    --topPos: calc(var(--timeFontSize) * -1);

    & .protyle-action {
      top: calc(var(--timeFontSize) / 2) !important;
    }

    & div[data-type="NodeParagraph"],
    & div[data-type="NodeHeading"],
    & div[data-type="NodeTable"] {
      --rightPos: -4px;
      padding-top: unset !important;
    }
  }
}

</style>
