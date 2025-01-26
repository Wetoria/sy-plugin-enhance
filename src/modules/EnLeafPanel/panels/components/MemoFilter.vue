<template>
  <div class="memo-actions">
    <div class="action-group">
      <button class="b3-button b3-button--text">
        <svg class="action-icon"><use xlink:href="#iconCalendar"></use></svg>
        时间
      </button>
      <button class="b3-button b3-button--text">
        <svg class="action-icon"><use xlink:href="#iconTags"></use></svg>
        标签
      </button>
      <button class="b3-button b3-button--text">
        <svg class="action-icon"><use xlink:href="#iconSort"></use></svg>
        排序
      </button>
    </div>
    <div class="action-group">
      <button class="b3-button b3-button--text">
        <svg class="action-icon"><use xlink:href="#iconSearch"></use></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// 暂时没有逻辑，后续添加筛选功能
</script>

<style lang="scss">
.memo-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  border-bottom: 1px solid var(--b3-border-color);

  .action-group {
    display: flex;
    gap: 8px;

    .action-icon {
      height: 14px;
      width: 14px;
      fill: currentColor;
    }
  }
}
</style>
