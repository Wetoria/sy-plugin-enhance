import { debounce } from 'lodash-es'
import { computed, ref } from 'vue'

/**
 * 创建一个使用 Vue 响应式数据的防抖 Promise 队列处理器
 * @param {number} debounceTime - 防抖时间（毫秒）
 * @returns {object} 包含添加和处理 Promise 的函数
 */
export function createVuePromiseQueue(debounceTime = 300) {
  const waitingPromises = ref(new Map()); // 待执行的 Promise
  const isProcessing = ref(false);        // 是否正在处理
  const isFinalizing = ref(false);        // 是否正在执行最终回调
  const completedRequests = ref([]);      // 已完成的请求
  const failedRequests = ref([]);         // 失败的请求

  // 计算属性
  const queueSize = computed(() => waitingPromises.value.size);
  const allIsDone = computed(() => !isProcessing.value && !isFinalizing.value && queueSize.value === 0);

  // 回调函数存储
  let onSuccessCallback = null;
  let onErrorCallback = null;
  let onFinallyCallback = null;

  // 创建防抖函数
  const debouncedProcess = debounce(
    processPromises,
    debounceTime
  );

  /**
   * 添加 Promise 创建函数到队列
   * @param {string} key - Promise 的唯一标识
   * @param {Function} promiseCreator - 返回 Promise 的函数
   */
  function addPromise(key, promiseCreator) {
    waitingPromises.value.set(key, promiseCreator);
    debouncedProcess();
  }

  /**
   * 设置成功回调
   * @param {Function} callback - 成功时执行的回调
   */
  function onSuccess(callback) {
    onSuccessCallback = callback;
    return this; // 支持链式调用
  }

  /**
   * 设置失败回调
   * @param {Function} callback - 失败时执行的回调
   */
  function onError(callback) {
    onErrorCallback = callback;
    return this; // 支持链式调用
  }

  /**
   * 设置最终回调（无论成功失败都会执行）
   * @param {Function} callback - 最终执行的回调
   */
  function onFinally(callback) {
    onFinallyCallback = callback;
    return this; // 支持链式调用
  }

  /**
   * 执行所有待处理的 Promise
   */
  async function processPromises() {
    if (isFinalizing.value) return;

    if (queueSize.value === 0) {
      triggerFinalCallbacks();
      return;
    }

    if (isProcessing.value) return;

    isProcessing.value = true;
    isFinalizing.value = false;

    try {
      const promises = Array.from(waitingPromises.value.entries())
        .map(([key, creator]) => ({ key, promise: creator() }));

      waitingPromises.value.clear();

      if (promises.length === 0) {
        isProcessing.value = false;
        triggerFinalCallbacks();
        return;
      }

      const results = await Promise.allSettled(
        promises.map(p => p.promise)
      );

      results.forEach((result, index) => {
        const key = promises[index].key;

        if (result.status === 'fulfilled') {
          completedRequests.value.push({ key, result: result.value });
        } else {
          failedRequests.value.push({ key, error: result.reason });
        }
      });

    } catch (error) {
      failedRequests.value.push({ error });
    } finally {
      isProcessing.value = false;

      if (queueSize.value > 0) {
        debouncedProcess();
      } else {
        triggerFinalCallbacks();
      }
    }
  }

  /**
   * 触发最终回调函数
   */
  function triggerFinalCallbacks() {
    if (isFinalizing.value) return;

    isFinalizing.value = true;

    try {
      if (failedRequests.value.length === 0 && typeof onSuccessCallback === 'function') {
        onSuccessCallback([...completedRequests.value]);
      }
      else if (failedRequests.value.length > 0 && typeof onErrorCallback === 'function') {
        onErrorCallback([...failedRequests.value]);
      }
    } finally {
      if (typeof onFinallyCallback === 'function') {
        onFinallyCallback({
          successCount: completedRequests.value.length,
          failureCount: failedRequests.value.length,
          allRequests: [...completedRequests.value, ...failedRequests.value]
        });
      }

      isFinalizing.value = false;
    }
  }

  return {
    addPromise,
    // processPromises: debouncedProcess,
    // queueSize,          // 队列大小（响应式）
    isProcessing,       // 是否正在处理（响应式）
    allIsDone,          // 是否全部完成（响应式）
    // completedRequests,  // 已完成的请求（响应式）
    // failedRequests,     // 失败的请求（响应式）
    onSuccess,          // 设置成功回调
    onError,            // 设置失败回调
    onFinally,          // 设置最终回调
  };
}

/* 使用示例
const queue = createVuePromiseQueue(300);

queue
  .onSuccess(results => {
    console.log('🎉 所有请求成功完成:', results);
  })
  .onError(errors => {
    console.error('部分请求失败:', errors);
  })
  .onFinally(stats => {
    console.log('请求处理统计:', stats);
  });

queue.addPromise('req1', fetchData(1));

setTimeout(() => {
  queue.addPromise('req2', fetchData(2));
}, 1000);
*/