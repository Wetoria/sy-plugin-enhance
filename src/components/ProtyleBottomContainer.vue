<template>
  <div class="ProtyleBottomContainer">
    <div class="enhanceToBottomIndicator" :data-node-id="protyle.block.id"></div>
    <div class="backlinkArea">
      <div
        class="backlinkAreaTitleLine"
        @click="switchBacklinkAreaFoldStatus"
        :style="{
          borderBottom: backlinkAreaFolded ? 'unset' : undefined,
        }"
      >
        <div
          class="backlinkAreaFolder"
          :style="{
            transform: `rotateZ(${backlinkAreaFolded ? '0' : '90'}deg)`,
          }"
        >
          <SyIcon
            name="iconPlay"
            size="10"
          />
        </div>
        <h2 class="backlinkTitle">
          反链
        </h2>
      </div>
      <div
        :style="{
          height: backlinkAreaFolded ? '0px' : 'max-content',
          overflow: 'hidden',
        }"
      >
        <div v-if="!docBacklinks.length">
          未找到相关内容
        </div>
        <template v-else>
          <div class="vBacklinkContainer backlinkList">
            <ul class="b3-list b3-list--background">
              <div
                v-for="docBacklink of docBacklinks"
                :key="docBacklink.id"
                class="backlinkDocBlock"
              >
                <div class="backlinkDocBlockTitleLineSticky">
                  <div
                    class="backlinkDocBlockTitleLine"
                    @click="switchBacklinkDocBlockFoldStatus(docBacklink)"
                  >
                    <div
                      class="backlinkDocBlockFolder"
                      :style="{
                        transform: `rotateZ(${docBacklinkFoldStatusMap[docBacklink.id] ? '0' : '90'}deg)`,
                      }"
                    >
                      <SyIcon
                        name="iconPlay"
                        size="10"
                      />
                    </div>
                    <li
                      class="b3-list-item b3-list-item--hide-action"
                    >
                      <span class="b3-list-item__text">{{ docBacklink.name }}</span>
                    </li>
                  </div>
                </div>
                <div
                  ref="renderRef"
                  @mouseleave="onMouseLeave"
                  :style="{
                    height: docBacklinkFoldStatusMap[docBacklink.id] ? '0px' : 'max-content',
                    overflow: 'hidden',
                  }"
                ></div>
              </div>
            </ul>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { request } from '@/api';
import { usePlugin } from '@/main';
import { hideGutterOnTarget } from '@/utils/DOM';
import { IProtyle, Protyle } from 'siyuan';
import { computed, ref, watchEffect } from 'vue';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'

const props = defineProps({
  detail: Object,
  element: HTMLDivElement
})
const protyle = computed(() => props.detail.value.protyle as IProtyle)
const docBacklinks = ref([])
const docBacklinkFoldStatusMap = ref({})
const switchBacklinkDocBlockFoldStatus = (docBacklink) => {
  docBacklinkFoldStatusMap.value[docBacklink.id] = !docBacklinkFoldStatusMap.value[docBacklink.id]
}

const blockBackLinks = ref({})
const renderRef = ref([])
watchEffect(() => {
  let flag
  props.element.addEventListener('scroll', () => {
    if (flag) {
      clearTimeout(flag)
    }
    setTimeout(() => {
      renderRef.value.forEach((item) => {
        hideGutterOnTarget(item)
      })
    }, 50)
  })
})

const onMouseLeave = (event) => {
  hideGutterOnTarget(event.target)
}

const getData = () => {
  const plugin = usePlugin()
  const currentDocId = protyle.value?.block?.id;
  if (!currentDocId) {
    return
  }
  blockBackLinks.value = {}
  request('/api/ref/getBacklink2', {
    id: currentDocId,
    sort: '3',
    mSort: '3',
    k: '',
    mk: '',
  }).then((res) => {
    const { backlinks } = res;

    if (!backlinks.length) {
      return
    }
    docBacklinks.value = backlinks

    Promise.all(backlinks.map((item) => {
      return request('/api/ref/getBacklinkDoc', {
        defID: currentDocId,
        refTreeID: item.id,
        keyword: '',
      })
    })).then((results) => {

      // dom1.style.backgroundColor = 'var(--b3-list-hover, #363636)'
      // dom1.style.borderRadius = 'var(--b3-border-radius)'

      backlinks.forEach((item, index) => {
        blockBackLinks.value[item.id] = results[index]

        new Protyle(plugin.app, renderRef.value[index], {
          blockId: currentDocId,
          backlinkData: results[index].backlinks,
          render: {
              background: false,
              title: false,
              gutter: true,
              scroll: false,
              breadcrumb: false,
          }
        })
      })
    })
  })
}
watchEffect(() => {
  const currentDocId = protyle.value?.block?.id;
  if (!currentDocId) {
    return
  }
  getData()
})

const backlinkAreaFolded = ref(false);
const switchBacklinkAreaFoldStatus = () => {
  backlinkAreaFolded.value = !backlinkAreaFolded.value;
}

</script>

<style>
:root {
  --v-backlink-area-bg-color: var(--b3-theme-surface);
  --v-backlink-area-border-radius: var(--b3-border-radius);
  --v-border-color: var(--b3-list-hover, #363636);
  --v-shadow-color: var(--b3-theme-background);
  --v-block-card-background: var(--b3-theme-background);
}

.enhanceProtyleBottomContainer {
  display: flex;
  flex-direction: column;
}
</style>

<style scoped lang="scss">
.ProtyleBottomContainer {
  // background-color: red;
  display: flex;
  flex-direction: column;

  .enhanceToBottomIndicator {
    height: 2px;
    // background-color: blue;
  }

  .backlinkArea {
    padding-bottom: 20px;

    .backlinkAreaTitleLine {
      display: flex;
      align-items: center;
      padding: 8px 0px;
      margin-bottom: 8px;
      border-bottom: 1px solid var(--v-border-color);
      cursor: pointer;
      position: relative;

      .backlinkAreaFolder {

        width: 20px;
        height: 20px;
        display: none;
        align-items: center;
        justify-content: center;
        position: absolute;
        color: var(--b3-theme-on-surface-light);
        margin-left: -20px;
        z-index: 1;
        transition: all 0.1s linear;
      }

      &:hover .backlinkAreaFolder,
      .backlinkAreaFolder:hover {
        display: flex;
      }

      .backlinkTitle {
      }
    }

    .backlinkList {
      background: var(--v-backlink-area-bg-color);
      padding: 6px 10px;
      border-radius: var(--v-backlink-area-border-radius);

      .backlinkDocBlock {
        // background: var(--v-block-card-background);
        // border-radius: var(--v-backlink-area-border-radius);
        // border: 1px solid var(--v-border-color);
        // margin-bottom: 6px;
        // box-shadow: 2px 2px 4px var(--v-shadow-color);

        .backlinkDocBlockTitleLineSticky {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
        }
        .backlinkDocBlockTitleLine {
          width: 100%;
          display: flex;
          align-items: center;
          cursor: pointer;
          position: relative;
          background: var(--v-backlink-area-bg-color);
          // border-top-right-radius: var(--v-backlink-area-border-radius);
          // border-top-left-radius: var(--v-backlink-area-border-radius);
          padding: 2px 0px;

          .backlinkDocBlockFolder {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--b3-theme-on-surface-light);
            z-index: 1;
            transition: all 0.1s linear;
            visibility: hidden;
          }
          &:hover .backlinkDocBlockFolder,
          .backlinkDocBlockFolder:hover {
            visibility: visible;
          }
        }

        .protyle {
          background: unset;
          min-height: unset;

          :deep(.protyle-wysiwyg) {
            padding: 0px 36px;

            .protyle-breadcrumb__bar {
              min-height: unset;
              margin-bottom: unset !important;
              flex-wrap: wrap;

              .protyle-breadcrumb__item:only-child {
                display: none;
              }
              .protyle-breadcrumb__item.protyle-breadcrumb__item--active {
                // display: none;

                .protyle-breadcrumb__text {
                  display: none;
                }

                & ~ .protyle-breadcrumb__item .protyle-breadcrumb__text{
                  display: none;
                }
              }
            }

            .protyle-breadcrumb__bar:not(:first-child) {
              border-top: 1px solid var(--v-border-color);
            }

          }
        }

        & .b3-list-item {
          background: unset;
          margin-top: unset;
          margin-left: unset;
          padding-left: unset;
        }
      }
    }
  }

}
</style>
