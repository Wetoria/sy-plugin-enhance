<template>
  <div class="backlinkArea" v-if="enableBottomBacklink">
    <div class="backlinkAreaTitleLine">
      <div
        class="backlinkAreaFolder"
        @click="switchBacklinkAreaFoldStatus"
        :style="{
          transform: `rotateZ(${backlinkAreaFolded ? '0' : '90'}deg)`,
        }"
      >
        <SyIcon name="iconPlay" size="10" />
      </div>
      <span class="backlinkTitle" @click="switchBacklinkAreaFoldStatus">
        反链
      </span>
      <div class="opts">
        <SyIcon
          v-if="enableBacklinkFilter"
          @click="switchBacklinkFilterPanelShownStatus"
          name="iconFilter"
          size="14"
        />
      </div>
    </div>
    <div
      v-if="enableBacklinkFilter"
      class="backlinkFilterContainer"
      :style="{
        display: backlinkFilterPanelShownStatus ? 'flex' : 'none',
      }"
    >
      <div>
        <h3>搜索/过滤</h3>
      </div>
      <div>单击左键来包含，或则 shift-单击左键来排除，再次点击取消选中。</div>
      <div class="backlinkRefListContainer" v-if="includeRefs.length">
        <span> include: </span>
        <BacklinkFilterOptionTag
          v-for="item of includeRefs"
          :key="'in-' + item.id"
          @click="(event) => handleClickFilterTag(event, item)"
          :title="item.name"
        >
          <span class="optionName">
            {{ item.name }}
          </span>
        </BacklinkFilterOptionTag>
      </div>
      <div class="backlinkRefListContainer" v-if="excludeRefs.length">
        <span> exclude: </span>
        <BacklinkFilterOptionTag
          v-for="item of excludeRefs"
          :key="'ex-' + item.id"
          @click="(event) => handleClickFilterTag(event, item)"
          :title="item.name"
        >
          <span class="optionName">
            {{ item.name }}
          </span>
        </BacklinkFilterOptionTag>
      </div>
      <div class="backlinkRefListContainer">
        <BacklinkFilterOptionTag
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
        </BacklinkFilterOptionTag>
      </div>
    </div>
    <div
      :style="{
        height: backlinkAreaFolded ? '0px' : 'max-content',
        overflow: 'hidden',
      }"
    >
      <div v-if="!docBacklinks.length">未找到相关内容</div>
      <template v-else>
        <div class="vBacklinkContainer backlinkList" ref="backlinkListDomRef">
          <ul class="b3-list b3-list--background">
            <div
              v-for="docBacklink of docBacklinks"
              :key="docBacklink.id"
              class="backlinkDocBlock"
            >
              <div
                class="backlinkDocBlockTitleLineSticky"
                :data-node-id="docBacklink.id"
              >
                <div
                  class="backlinkDocBlockTitleLine"
                  @click="switchBacklinkDocBlockFoldStatus(docBacklink)"
                >
                  <div
                    class="backlinkDocBlockFolder"
                    :style="{
                      transform: `rotateZ(${
                        docBacklinkFoldStatusMap[docBacklink.id] ? '0' : '90'
                      }deg)`,
                    }"
                  >
                    <SyIcon name="iconPlay" size="10" />
                  </div>
                  <li class="b3-list-item b3-list-item--hide-action">
                    <span
                      class="b3-list-item__text backlinkDocTitle"
                      @click="jumpToDoc($event, docBacklink.id)"
                    >
                      {{ docBacklink.name }}
                    </span>
                  </li>
                </div>
              </div>
              <div
                ref="renderRef"
                @mouseleave="onMouseLeave"
                :style="{
                  height: docBacklinkFoldStatusMap[docBacklink.id]
                    ? '0px'
                    : 'max-content',
                  overflow: 'hidden',
                }"
              ></div>
            </div>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSettings } from '@/modules/Settings/EnSettings.vue';
import { computed } from 'vue';

const settings = useSettings()
const enableBottomBacklink = computed(() => settings.value.enableBottomBacklink)
</script>

<style lang="scss"></style>
