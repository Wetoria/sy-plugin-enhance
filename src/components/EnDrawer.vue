<template>
  <a-drawer
    ref="drawerRef"
    v-model:visible="visible"
    :class="[`${En_Drawer}`, `${En_Drawer}-${uuid}`]"
    :unmountOnClose="false"
    :drawer-style="{
      maxHeight: '80vh',
      height: 'unset',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px',
    }"
    :footer="footer"
    height="unset"
    placement="bottom"
    v-bind="$attrs"
    @open="onDrawerOpen"
    @touchmove="onTouchMove"
  >
    <template
      v-for="(_, name) in $slots"
      #[name]="slotData"
    >
      <slot
        :name="name"
        v-bind="slotData"
      />
    </template>
  </a-drawer>
</template>

<script setup lang="ts">
import { generateShortUUID } from '@/utils'
import { DrawerConfig } from '@arco-design/web-vue'
import AnyTouch from 'any-touch'
import {
  isRef,
  Ref,
  ref,
} from 'vue'

const props = defineProps<{
  needHide?: (dis: number, drawer: HTMLDivElement) => boolean
  scrollTarget?: HTMLDivElement | Ref<HTMLDivElement> | (() => HTMLDivElement)
  disabled?: boolean | (() => boolean)
  footer?: boolean
} & Omit<Partial<DrawerConfig>, 'visible' | 'onOpen'>>()

const emit = defineEmits<{
  open: [id: string]
}>()

const visible = defineModel('visible')
const En_Drawer = 'EnDrawer'


const uuid = generateShortUUID()
const drawerRef = ref<HTMLDivElement | null>(null)

const onDrawerOpen = () => {
  const el: HTMLDivElement = document.querySelector(`.${En_Drawer}-${uuid}`)
  const drawerContainer: HTMLDivElement = el.querySelector('.arco-drawer')
  if (!el || !drawerContainer) {
    return
  }
  const at = new AnyTouch(el, {
    preventDefault: false,
  })
  let scrollTarget: HTMLDivElement = null
  if (typeof props.scrollTarget === 'function') {
    scrollTarget = props.scrollTarget()
  } else if (isRef(props.scrollTarget)) {
    scrollTarget = props.scrollTarget.value
  } else if (props.scrollTarget) {
    scrollTarget = props.scrollTarget
  } else {
    scrollTarget = el.querySelector('.arco-drawer-body')
  }

  const drawerBodyScrollTopOnStart = ref(0)
  at.on('panstart', () => {
    drawerBodyScrollTopOnStart.value = scrollTarget.scrollTop
  })
  at.on('pan', (e) => {
    if (!drawerContainer) {
      return
    }

    const dis = e.displacementY - drawerBodyScrollTopOnStart.value
    const movableDis = dis > 0 ? dis : 0
    drawerContainer.style.transform = `translateY(${movableDis}px)`
  })
  at.on('panend', (e) => {
    if (!drawerContainer) {
      return
    }

    const dis = e.displacementY - drawerBodyScrollTopOnStart.value
    const rect = drawerContainer.getBoundingClientRect()
    // 默认当滑动距离减去其实的滚动高度，超过 drawer 高度的 1/3 时，隐藏 drawer
    const hide = props.needHide ? props.needHide(dis, drawerContainer) : dis > (rect.height / 3)
    if (hide) {
      drawerContainer.style.transform = `translateY(100%)`
      visible.value = false
      setTimeout(() => {
        drawerContainer.style.transform = ''
      }, 1000)
    } else {
      drawerContainer.style.transform = ''
    }
  })

  emit('open', uuid)
}

const onTouchMove = (e: TouchEvent) => {
  e.stopPropagation()
}
</script>

<style lang="scss" scoped>

</style>

<style lang="scss">
.EnDrawer {
  .arco-drawer {
    border-top: 1px solid var(--color-neutral-3);
  }
  .arco-drawer-body {
    overscroll-behavior: none;
    padding: 0px 0px;

    display: flex;
    flex-direction: column;
  }
}
</style>
