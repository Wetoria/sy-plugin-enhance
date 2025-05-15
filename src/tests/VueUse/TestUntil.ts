import {
  invoke,
  until,
} from '@vueuse/core'
import { ref } from 'vue'

const count = ref(0)

export function testUntil() {
  console.log('ready to test, count', count.value)
  let flag = null
  invoke(async () => {
    console.log('invoke begin')
    await until(count).toMatch((v) => v === 0)
    console.log('invoke end')
    if (flag) {
      clearInterval(flag)
    }

    console.log('Counter is now larger than 7!')
  })
  count.value = 3
  console.log('count before', count.value)
  flag = setInterval(() => {
    console.log('count ', count.value)
    count.value -= 1
  }, 1000)

  console.log('count after', count.value)
}
