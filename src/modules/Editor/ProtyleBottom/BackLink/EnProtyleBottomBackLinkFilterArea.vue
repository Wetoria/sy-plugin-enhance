<template>
  <div class="backlinkSearchArea">
    <a-card :bordered="false" hoverable>
      <div class="searchMain">
        <div class="flexColumn" style="flex: 1;">
          <div style="display: flex; gap: 2px; align-items: center;">
            <b>过滤</b>
            <a-popover
                trigger="click"
              position="tl"
            >
              <div
                class="prompt"
              >
                <icon-exclamation-circle-fill />
              </div>
              <template #content>
                单击左键来包含，或则 shift-单击左键来排除，再次点击取消选中。
              </template>
            </a-popover>
          </div>
          <div class="backlinkRefListContainer">
            <!-- <BacklinkFilterOptionTag
              v-for="item of remainRefs"
              :key="item.id"
              @click="(event) => handleClickFilterTag(event, item)"
              :title="item.name"
            >
              <span class="optionName">
                {{ item.name }}
              </span>
              <sup style="margin-left: 2px">
                {{ linkNumMap[item.id] }}
              </sup>
            </BacklinkFilterOptionTag> -->
          </div>
          <div class="blockList">
            <a-tag bordered>default</a-tag>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
.backlinkSearchArea {
  padding: var(--en-gap);

  .arco-card {
    border-radius: 4px;
  }

  :deep(.arco-card-body) {
    padding: 8px 12px;
  }

  .searchMain {
    display: flex;
    gap: var(--en-gap);
  }

  .prompt {
    display: flex;
    cursor: pointer;
  }
}
</style>
