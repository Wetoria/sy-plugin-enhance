import { computed, onMounted, ref, watchEffect } from 'vue';
import { openDocById } from './Note';
import { showMessage } from 'siyuan';
import { usePlugin } from '@/main';

let lastEditShownStatus
export function useDocHistory() {
  const docHistory = ref([])
  const currentDocIndex = ref(-1);
  const isNewset = computed(() => !docHistory.value.length || currentDocIndex.value === docHistory.value.length - 1)
  const isOldest = computed(() => !docHistory.value.length || currentDocIndex.value === 0)

  const plugin = usePlugin()

  const goBack = () => {
    if (isOldest.value) {
      showMessage('已经最老一条')
      return
    }
    currentDocIndex.value -= 1
    if (currentDocIndex.value < 0) {
      currentDocIndex.value = 0
      return
    }
    openDocById(docHistory.value[currentDocIndex.value])
  }
  const goForward = () => {
    if (isNewset.value) {
      showMessage('已经最新一条')
      return
    }
    currentDocIndex.value += 1
    if (currentDocIndex.value > docHistory.value.length - 1) {
      currentDocIndex.value = docHistory.value.length - 1
      return
    }
    openDocById(docHistory.value[currentDocIndex.value])
  }

  onMounted(() => {
    plugin.eventBus.on('loaded-protyle-static', ({ detail }) => {
      const currentDocId = detail?.protyle?.block?.id;

      const lastDocId = docHistory.value[currentDocIndex.value]
      if (lastDocId !== currentDocId) {
        docHistory.value.splice(currentDocIndex.value + 1)
        docHistory.value = [...docHistory.value, currentDocId]
        currentDocIndex.value = docHistory.value.length - 1
      }
    })

    let flag
    const ob = new MutationObserver(() => {
      if (flag) {
        clearTimeout(flag)
      }
      flag = setTimeout(() => {
        const dom = document.querySelector('#editor')
        if (dom) {
          const editorIsHidden = dom.classList.contains('fn__none')
          if (lastEditShownStatus !== editorIsHidden) {

            if (editorIsHidden) {
              docHistory.value = []
              currentDocIndex.value = docHistory.value.length - 1;
            }
          }
          lastEditShownStatus = editorIsHidden;
        }
      }, 100)
    })
    ob.observe(document.body, {
      childList: true, // 观察目标子节点的变化，是否有添加或者删除
      subtree: true, // 观察后代节点，默认为 false
    })
  })

  return {
    goBack,
    goForward,
    isNewset,
    isOldest,
  }
}
