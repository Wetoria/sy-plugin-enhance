<template>
  <div class="enIconContainer">
    <svg
      :style="{
        fontSize: size,
        width: size,
        height: size,
        color: disabled ? 'var(--b3-empty-color)' : undefined,
      }"
      class="enSyIcon"
    >
      <use :xlink:href="`#${name}`"></use>
    </svg>
  </div>
</template>

<script setup lang="ts">
defineProps({
  name: String,
  size: {
    type: [Number, String],
    default: 12,
  },
  disabled: Boolean,
})
</script>

<style lang="scss" scoped>
.enIconContainer {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
