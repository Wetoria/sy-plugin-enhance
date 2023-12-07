<template>
  <div class="ProtyleBottomContainer">
    <div class="enhanceToBottomIndicator" :data-node-id="protyle.block.id"></div>
    <div class="backlinkArea">
      <h2 class="backlinkTitle">反链</h2>
      <div v-if="!docBacklinks.length">
        未找到相关内容
      </div>
      <template v-else>
        <div className="vBacklinkContainer backlinkList">
          <ul class="b3-list b3-list--background">
            <template
              v-for="docBacklink of docBacklinks"
              :key="docBacklink.id"
            >
              <li
                class="b3-list-item b3-list-item--hide-action"
              >
                <span class="b3-list-item__text">{{ docBacklink.name }}</span>
              </li>
              <div ref="renderRef"></div>
            </template>
          </ul>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { request } from '@/api';
import { usePlugin } from '@/main';
import { IProtyle, Protyle } from 'siyuan';
import { computed, ref, watchEffect } from 'vue';

const props = defineProps({
  detail: Object
})
const protyle = computed(() => props.detail.value.protyle as IProtyle)
const docBacklinks = ref([])
const blockBackLinks = ref({})
const renderRef = ref(null)
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

</script>

<style scoped lang="scss">
.ProtyleBottomContainer {
  height: 100px;
  // background-color: red;
  display: flex;
  flex-direction: column;
  .enhanceToBottomIndicator {
    height: 2px;
    // background-color: blue;
  }

  .backlinkTitle {
    padding: 8px 0px;
    margin-bottom: 8px;
    border-bottom: 1px solid var(--b3-list-hover, #363636);
  }
}
</style>

<style>
.enhanceProtyleBottomContainer {
  display: flex;
  flex-direction: column;
}
</style>
