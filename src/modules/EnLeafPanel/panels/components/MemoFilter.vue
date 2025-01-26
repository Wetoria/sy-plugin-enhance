<template>
  <div class="memo-actions">
    <div class="action-group">
      <button
        class="filter-btn"
        :class="{ active: activeFilter === 'daily' }"
        @click="toggleFilter('daily')"
      >
        <svg class="action-icon"><use xlink:href="#iconCalendar"></use></svg>
        <span class="btn-text">日记</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

export type FilterType = 'daily'

const props = defineProps<{
  activeFilter?: FilterType
}>()

const emit = defineEmits<{
  (e: 'update:activeFilter', value: FilterType | undefined): void
}>()

const activeFilter = ref<FilterType | undefined>(props.activeFilter)

const toggleFilter = (type: FilterType) => {
  if (activeFilter.value === type) {
    activeFilter.value = undefined
  } else {
    activeFilter.value = type
  }
  emit('update:activeFilter', activeFilter.value)
}
</script>

<style lang="scss">
.memo-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;

  .action-group {
    display: flex;
    gap: 4px;
  }

  .filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border: none;
    background: transparent;
    border-radius: var(--b3-border-radius);
    color: var(--b3-theme-on-background);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    opacity: 0.68;

    &:hover {
      background-color: var(--b3-theme-primary-light);
      opacity: 0.5;
    }

    &.active {
      background-color: var(--b3-theme-primary);
      color: var(--b3-theme-on-primary);
      opacity: 1;

      &:hover {
        background-color: var(--b3-theme-primary);
        opacity: 0.9;
      }
    }

    .action-icon {
      height: 14px;
      width: 14px;
      fill: currentColor;
      flex-shrink: 0;
    }

    .btn-text {
      line-height: 1;
      font-weight: 500;
    }
  }
}
</style>
