<template>
  <div class="fn__flex-1 fn__flex-column">
    <div class="block__icons">
      <div class="block__logo">
        <svg><use xlink:href="#iconEnLeaf"></use></svg>
        叶归
      </div>
      <span class="fn__flex-1"></span>
      <span
        data-type="min"
        class="block__icon b3-tooltips b3-tooltips__sw"
        aria-label="最小化"
      >
        <svg><use xlink:href="#iconMin"></use></svg>
      </span>
    </div>
    <div class="fn__flex-1 en-dock">
      叶归插件侧边栏
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss">
.en-dock {
  padding: 8px;
}

.block__icons {
  display: flex;
  align-items: center;
  padding: 0 8px;
  height: 32px;
  box-sizing: border-box;
  border-bottom: 1px solid var(--b3-border-color);

  .block__logo {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;

    svg {
      height: 14px;
      width: 14px;
      fill: currentColor;
    }
  }

  .block__icon {
    padding: 4px;
    cursor: pointer;

    svg {
      height: 14px;
      width: 14px;
      fill: currentColor;
    }

    &:hover {
      background-color: var(--b3-theme-background-light);
      border-radius: var(--b3-border-radius);
    }
  }
}
</style>
