<template>
  <div class="MobileNavContainer">
    <div class="NavList">
      <div
        v-for="item of navList"
        class="NavItem"
      >
        <div class="NavItemIcon">
          <Icon :name="item.icon" size="18" />
        </div>
        <div class="NavItemLabel" v-if="showLabel">
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Icon from '@/components/SiyuanTheme/Icon.vue'
import { computed } from 'vue';

const showLabel = ref(false)
const containerHeight = computed(() => {
  if (showLabel) {
    return 50
  }
  return 30
})
const containerHeightCss = computed(() => `${containerHeight}px`)

const navList = ref([
  {
    icon: 'iconBack',
    label: 'Test',
  },
  {
    icon: 'iconForward',
    label: 'Test',
  },
  {
    icon: 'iconAdd',
    label: '日记',
  },
  {
    icon: 'iconHistory',
    label: '历史',
  },
  {
    icon: 'iconSettings',
    label: '设置',
  },
])
</script>

<style lang="scss" scoped>
.MobileNavContainer {
  padding-bottom: 30px;

  .NavList {
    height: v-bind(containerHeightCss);
    padding-top: 10px;
    display: flex;
    justify-content: space-around;
    border-top: 1px solid var(--b3-theme-background-light);

    .NavItem {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-sizing: border-box;
      height: v-bind(containerHeightCss);
      padding: 0px 12px;
      gap: 4px;

      .NavItemIcon {
        display: flex;
        justify-content: center;
        align-items: center;
        flex: 2;
      }

      .NavItemLabel {
        font-size: 18px;
        flex: 1;
      }
    }
  }
}
</style>
