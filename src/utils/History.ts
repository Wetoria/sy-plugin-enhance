import { computed, onMounted, ref, watchEffect } from 'vue';
import { openDocById } from './Note';
import { showMessage } from 'siyuan';

let lastEditShownStatus
let lastDocId
export function useDocHistory() {
  const docHistory = ref([])
  const currentDocIndex = ref(-1);
  const isNewset = computed(() => !docHistory.value.length || currentDocIndex.value === docHistory.value.length - 1)
  const isOldest = computed(() => !docHistory.value.length || currentDocIndex.value === 0)
  watchEffect(() => {
    console.log('doc his is ', docHistory.value)
    console.log('doc his is ', currentDocIndex.value)
  })
  let byInner = false
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
    byInner = true
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
    byInner = true
    openDocById(docHistory.value[currentDocIndex.value])
  }

  onMounted(() => {
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

          const d = dom.querySelector('.protyle-background')
          if (d && d.dataset.nodeId) {
            const currentDocId = d.dataset.nodeId;
            if (lastDocId !== currentDocId) {
              if (byInner) {
                byInner = false
              } else {
                docHistory.value.splice(currentDocIndex.value + 1)
                docHistory.value = [...docHistory.value, currentDocId]
                currentDocIndex.value = docHistory.value.length - 1
              }
            }
            lastDocId = currentDocId;
          }
        } else {
          console.log('oops')
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
