<template>
  <div
    class="BacklinkFilterOptionTag"
    v-bind="$attrs"
    >
    <slot></slot>
  </div>
</template>

<style scoped lang="scss">
.BacklinkFilterOptionTag {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px 8px;
  border: 1px solid black;
  border-radius: 6px;
  cursor: pointer;
  height: 20px;
}
</style>
