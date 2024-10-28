<template>
  <a-collapse-item
    class="backlinkMentionBlock"
    header="底部反链"
    :key="backmention.id"
  >
    <template #header>
      <li class="b3-list-item b3-list-item--hide-action">
        <span
          class="b3-list-item__text backlinkDocTitle"
          @click="jumpToDoc($event, backmention.id)"
        >
          {{ backmention.name }}
        </span>
      </li>
    </template>
    <div
      ref="renderRef"
      @mouseleave="onMouseLeave"
    ></div>
  </a-collapse-item>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main';
import { hideGutterOnTarget } from '@/utils/DOM';
import { openDocById } from '@/utils/Note';
import { Protyle } from 'siyuan';
import { computed, onBeforeUnmount, ref, watch, watchEffect } from 'vue';
import { IBacklink } from './EnProtyleBottomBackLink.vue';
import { request } from '@/api';
import { debounce } from '@/utils';


const props = defineProps<{
  backmention: IBacklink
  activedBacklinkKeys: (string | number)[]
  currentDocId: string
  element: HTMLDivElement
}>()

const plugin = usePlugin()
const isExpand = computed(() => {
  return !!props.activedBacklinkKeys.find(i => i === props.backmention.id)
})

const jumpToDoc = (event: MouseEvent, docId) => {
  event.preventDefault();
  event.stopPropagation();

  openDocById(docId)
}


watchEffect(() => {
  props.element.addEventListener('scroll', debounce(() => {
    hideGutterOnTarget(renderRef.value)
  }, 50))
})
const onMouseLeave = (event) => {
  hideGutterOnTarget(event.target)
}

const renderRef = ref()
const protyleRef = ref<Protyle>()

// @ts-ignore
const backmentions = ref([])

watch([isExpand, renderRef, backmentions], () => {
  if (isExpand.value && renderRef.value) {
    protyleRef.value = new Protyle(plugin.app, renderRef.value, {
      blockId: props.currentDocId,
      // @ts-ignore
      backlinkData: backmentions.value,
      render: {
          background: false,
          title: false,
          gutter: true,
          scroll: false,
          breadcrumb: false,
      }
    })
  } else {
    if (protyleRef.value) {
      protyleRef.value.destroy()
    }
  }
}, {immediate: true, deep: true})

watch([isExpand, props.currentDocId, props.backmention.id], async () => {
  backmentions.value = []
  if (isExpand.value) {
    const { backmentions: backmentionsRes } = await request('/api/ref/getBackmentionDoc', {
      defID: props.currentDocId,
      refTreeID: props.backmention.id,
      keyword: '',
    })
    backmentions.value = backmentionsRes
  }
}, {immediate: true})
onBeforeUnmount(() => {
  if (protyleRef.value) {
    protyleRef.value.destroy()
  }
})
</script>

<style lang="scss" scoped>
.backlinkMentionBlock {
  :deep(.arco-collapse-item-content) {
    padding: unset;

    .protyle {
      min-height: unset;

      .protyle-wysiwyg {
        padding: 8px 16px;

        .protyle-breadcrumb__bar {
          min-height: unset;
          margin-bottom: unset !important;
          flex-wrap: wrap;

          .protyle-breadcrumb__item:last-child {

            .protyle-breadcrumb__text {
              display: none;
            }
          }

          // .protyle-breadcrumb__item.protyle-breadcrumb__item--active {
          //   // display: none;

          //   .protyle-breadcrumb__text {
          //     display: none;
          //   }

          //   & ~ .protyle-breadcrumb__item .protyle-breadcrumb__text{
          //     display: none;
          //   }
          // }
        }

        .protyle-breadcrumb__bar:not(:first-child) {
          border-top: 1px solid var(--v-border-color);
        }

        .protyle-breadcrumb__text {
          max-width: 100px;
        }
      }
    }
  }
}
</style>
