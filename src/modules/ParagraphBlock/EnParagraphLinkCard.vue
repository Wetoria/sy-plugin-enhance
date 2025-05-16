<template>
  <EnParagraphLinkCardBlockMenu />
  <template
    v-for="(item, index) of paragraphOnlyLinkList"
    :key="`${item.dataset.nodeId}-${index}`"
  >
    <EnProtyleCustomArea
      v-if="blockCardStatusMap[item.dataset.nodeId]"
      :getTargetBlockDom="() => item"
      name="enParagraphLinkCardArea"
      :preventEdit="true"
      :hideOriginalContent="true"
    >
      <template #customArea>
        <div
          class="link-card-container"
          contenteditable="false"
          data-editable="false"
          @mousedown.stop
          @click.stop
        >
          <template v-if="getLinkType(item) === 'normal-link'">
            <div
              class="link-card normal-link-card"
              contenteditable="false"
              data-editable="false"
              @click.stop="openExternalUrl(getLinkUrl(item))"
            >
              <div
                class="link-content"
                contenteditable="false"
                data-editable="false"
              >
                <div
                  class="link-domain"
                  contenteditable="false"
                  data-editable="false"
                >
                  <div
                    class="link-favicon"
                    contenteditable="false"
                    data-editable="false"
                  >
                    <img
                      :src="getFaviconUrl(getLinkUrl(item))"
                      alt="favicon"
                      onerror="this.style.display='none'"
                    />
                  </div>
                  <span
                    contenteditable="false"
                    data-editable="false"
                  >{{ getDomainName(getLinkUrl(item)) }}</span>
                </div>
                <div
                  class="link-title"
                  contenteditable="false"
                  data-editable="false"
                >
                  {{ linksMetaData[getLinkUrl(item)]?.title || getLinkTitle(item) || getLinkUrl(item) }}
                </div>
                <div
                  v-if="linksMetaData[getLinkUrl(item)]?.description"
                  class="link-description"
                  contenteditable="false"
                  data-editable="false"
                >
                  {{ linksMetaData[getLinkUrl(item)]?.description }}
                </div>
              </div>
              <div
                v-if="linksMetaData[getLinkUrl(item)]?.image"
                class="link-thumbnail"
                contenteditable="false"
                data-editable="false"
              >
                <img
                  :src="linksMetaData[getLinkUrl(item)]?.image"
                  alt="thumbnail"
                />
              </div>
            </div>
          </template>
          <template v-else-if="getLinkType(item) === 'block-ref'">
            <div
              class="block-ref-card"
              :class="{ 'is-loading': blockInfoMap[getBlockRefId(item)]?.loading }"
              contenteditable="false"
              data-editable="false"
              @click.stop="navigateToBlock(getBlockRefId(item))"
            >
              <div
                v-if="blockInfoMap[getBlockRefId(item)]?.loading"
                class="loading-indicator"
                contenteditable="false"
                data-editable="false"
              >
                <a-spin />
              </div>
              <template v-else-if="blockInfoMap[getBlockRefId(item)]?.data">
                <div
                  class="block-ref-content-wrapper"
                  contenteditable="false"
                  data-editable="false"
                >
                  <div
                    class="block-ref-left"
                    contenteditable="false"
                    data-editable="false"
                  >
                    <div
                      v-if="blockInfoMap[getBlockRefId(item)]?.icon"
                      class="block-ref-icon"
                      contenteditable="false"
                      data-editable="false"
                    >
                      <template v-if="isSingleEmoji(blockInfoMap[getBlockRefId(item)]?.icon)">
                        {{ blockInfoMap[getBlockRefId(item)]?.icon }}
                      </template>
                      <img
                        v-else
                        :src="getAssetUrl(blockInfoMap[getBlockRefId(item)]?.icon)"
                        alt="图标"
                        onerror="this.style.display='none'"
                      />
                    </div>
                    <div
                      class="block-ref-info"
                      contenteditable="false"
                      data-editable="false"
                    >
                      <div
                        class="block-ref-title"
                        contenteditable="false"
                        data-editable="false"
                      >
                        {{ getBlockTitle(blockInfoMap[getBlockRefId(item)]?.data) }}
                      </div>
                      <div
                        v-if="shouldShowContent(blockInfoMap[getBlockRefId(item)]?.data)"
                        class="block-ref-content"
                        contenteditable="false"
                        data-editable="false"
                      >
                        {{ blockInfoMap[getBlockRefId(item)]?.data.content }}
                      </div>
                      <div
                        v-if="blockInfoMap[getBlockRefId(item)]?.data.alias"
                        class="block-ref-alias"
                        contenteditable="false"
                        data-editable="false"
                      >
                        {{ blockInfoMap[getBlockRefId(item)]?.data.alias }}
                      </div>
                      <div
                        v-if="blockInfoMap[getBlockRefId(item)]?.data.memo"
                        class="block-ref-memo"
                        contenteditable="false"
                        data-editable="false"
                      >
                        {{ blockInfoMap[getBlockRefId(item)]?.data.memo }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="blockInfoMap[getBlockRefId(item)]?.banner"
                    class="block-ref-banner"
                    contenteditable="false"
                    data-editable="false"
                  >
                    <img
                      v-if="!isStyleBanner(blockInfoMap[getBlockRefId(item)]?.banner)"
                      :src="getAssetUrl(blockInfoMap[getBlockRefId(item)]?.banner)"
                      alt="横幅"
                    />
                    <div
                      v-else
                      class="style-banner"
                      :style="extractStyleContent(blockInfoMap[getBlockRefId(item)]?.banner)"
                      contenteditable="false"
                      data-editable="false"
                    ></div>
                  </div>
                </div>
              </template>
              <div
                v-else
                class="block-ref-error"
                contenteditable="false"
                data-editable="false"
              >
                无法获取块信息
              </div>
            </div>
          </template>
        </div>
      </template>
    </EnProtyleCustomArea>
  </template>
</template>

<script setup lang="ts">
import {
  getBlockAttrs,
  getBlockByID,
  request,
  setBlockAttrs,
} from '@/api'
import EnProtyleCustomArea from '@/components/EnProtyleCustomArea.vue'
import { usePlugin } from '@/main'
import { injectParagraphLinks } from '@/modules/ParagraphBlock/EnParagraphBlock'
import EnParagraphLinkCardBlockMenu from '@/modules/ParagraphBlock/EnParagraphLinkCardBlockMenu.vue'
import { Message } from '@arco-design/web-vue'
import {
  onBeforeUnmount,
  onMounted,
  ref,
  watch
} from 'vue'

// 获取插件实例
const plugin = usePlugin()

// 使用新函数替代旧函数
const paragraphOnlyLinkList = injectParagraphLinks()

// 移除调试模式
const debug = ref(false)

// 卡片自定义属性名
const CARD_ATTR_NAME = 'custom-en-link-card'

// 块状态映射 - 记录哪些块应该显示为卡片
const blockCardStatusMap = ref<{ [key: string]: boolean }>({})

// 同步判断函数 - 从映射中获取状态
const shouldRenderAsCard = (dom: HTMLElement): boolean => {
  if (!dom || !dom.dataset.nodeId) return false
  return !!blockCardStatusMap.value[dom.dataset.nodeId]
}

// 异步加载块状态
const loadBlockCardStatus = async (dom: HTMLElement) => {
  if (!dom || !dom.dataset.nodeId) return false

  const nodeId = dom.dataset.nodeId

  try {
    // 获取块属性
    const blockAttrs = await getBlockAttrs(nodeId)
    // 更新状态映射
    blockCardStatusMap.value[nodeId] = blockAttrs && blockAttrs[CARD_ATTR_NAME] === 'true'

    // 如果块是卡片，则预加载必要的数据
    if (blockCardStatusMap.value[nodeId]) {
      // 预加载链接元数据或块引用信息
      if (getLinkType(dom) === 'block-ref') {
        const blockId = getBlockRefId(dom)
        if (blockId && !blockInfoMap.value[blockId]) {
          loadBlockInfo(blockId)
        }
      } else if (getLinkType(dom) === 'normal-link') {
        const url = getLinkUrl(dom)
        if (url && !linksMetaData.value[url]) {
          fetchLinkMetadata(url, true)
        }
      }
    }

    return blockCardStatusMap.value[nodeId]
  } catch (e) {
    console.error('检查块属性失败:', e)
    blockCardStatusMap.value[nodeId] = false
    return false
  }
}

// 刷新所有段落链接的卡片状态
const refreshAllLinkCards = async (forceFullRefresh = false) => {
  try {
    // 保存旧的状态用于对比
    const oldStatusMap = {...blockCardStatusMap.value}
    
    // 获取当前编辑区域
    const activeProtyle = document.querySelector('.protyle-wysiwyg.protyle-wysiwyg--attr') as HTMLElement
    
    // 如果不是强制全刷新，则使用增量刷新策略
    if (!forceFullRefresh && Object.keys(oldStatusMap).length > 0) {
      // 仅处理当前可见的和当前编辑区域中的链接
      const visibleLinks = paragraphOnlyLinkList.value.filter(item => {
        // 如果已经在文档中，检查是否在可视区域内或当前编辑区域中
        if (item.isConnected) {
          // 当前编辑区域中的链接
          if (activeProtyle && activeProtyle.contains(item)) {
            return true
          }
          
          // 可视区域内的链接
          const rect = item.getBoundingClientRect()
          if (rect.top >= -200 && rect.bottom <= window.innerHeight + 200) {
            return true
          }
        }
        return false
      })

      // 对于可见链接，检查状态
      for (const item of visibleLinks) {
        if (isValidCardBlock(item)) {
          const nodeId = item.dataset.nodeId
          if (nodeId) {
            // 获取块属性
            const blockAttrs = await getBlockAttrs(nodeId)
            // 更新状态映射
            blockCardStatusMap.value[nodeId] = blockAttrs && blockAttrs[CARD_ATTR_NAME] === 'true'

            // 如果状态发生变化且是卡片，预加载必要数据
            if (blockCardStatusMap.value[nodeId] && oldStatusMap[nodeId] !== blockCardStatusMap.value[nodeId]) {
              if (getLinkType(item) === 'block-ref') {
                const blockId = getBlockRefId(item)
                if (blockId) {
                  // 强制刷新块信息
                  delete blockInfoMap.value[blockId]
                  await loadBlockInfo(blockId)
                }
              } else if (getLinkType(item) === 'normal-link') {
                const url = getLinkUrl(item)
                if (url) {
                  // 强制刷新链接元数据
                  delete linksMetaData.value[url]
                  await fetchLinkMetadata(url, true)
                }
              }
            }
          }
        }
      }
      
      // 对于不在可见区域的链接，保留原有状态，除非强制刷新
      for (const nodeId in oldStatusMap) {
        if (!(nodeId in blockCardStatusMap.value)) {
          blockCardStatusMap.value[nodeId] = oldStatusMap[nodeId]
        }
      }
    } else {
      // 全量刷新（初始化或强制刷新时）
      blockCardStatusMap.value = {}
      
      // 处理所有链接
      for (const item of paragraphOnlyLinkList.value) {
        if (isValidCardBlock(item)) {
          const nodeId = item.dataset.nodeId
          if (nodeId) {
            // 获取块属性
            const blockAttrs = await getBlockAttrs(nodeId)
            // 更新状态映射
            blockCardStatusMap.value[nodeId] = blockAttrs && blockAttrs[CARD_ATTR_NAME] === 'true'

            // 如果是卡片，预加载必要数据
            if (blockCardStatusMap.value[nodeId]) {
              if (getLinkType(item) === 'block-ref') {
                const blockId = getBlockRefId(item)
                if (blockId) {
                  delete blockInfoMap.value[blockId]
                  await loadBlockInfo(blockId)
                }
              } else if (getLinkType(item) === 'normal-link') {
                const url = getLinkUrl(item)
                if (url) {
                  delete linksMetaData.value[url]
                  await fetchLinkMetadata(url, true)
                }
              }
            }
          }
        }
      }
    }

    // 触发视图更新
    blockCardStatusMap.value = { ...blockCardStatusMap.value }
    blockInfoMap.value = { ...blockInfoMap.value }
    linksMetaData.value = { ...linksMetaData.value }

  } catch (error) {
    console.error('刷新卡片状态失败:', error)
  }
}

// 设置块为卡片（添加或移除属性）
const toggleCardAttr = async (dom: HTMLElement) => {
  if (!dom || !dom.dataset.nodeId) return false

  const nodeId = dom.dataset.nodeId

  try {
    // 获取当前块属性
    const blockAttrs = await getBlockAttrs(nodeId)
    // 切换属性值
    const isCard = blockAttrs[CARD_ATTR_NAME] === 'true'
    const newStatus = !isCard

    // 设置属性
    await setBlockAttrs(nodeId, {
      [CARD_ATTR_NAME]: newStatus ? 'true' : 'false',
    })

    // 立即更新状态映射
    blockCardStatusMap.value[nodeId] = newStatus

    // 如果变成了卡片，需要立即加载必要的数据
    if (newStatus) {
      if (getLinkType(dom) === 'block-ref') {
        const blockId = getBlockRefId(dom)
        if (blockId) {
          loadBlockInfo(blockId)
        }
      } else if (getLinkType(dom) === 'normal-link') {
        const url = getLinkUrl(dom)
        if (url) {
          fetchLinkMetadata(url, true)
        }
      }
    }

    // 显示提示
    Message.success(newStatus ? '已设置为卡片样式' : '已移除卡片样式')

    return newStatus
  } catch (e) {
    console.error('设置块属性失败:', e)
    return false
  }
}

// 判断块是否可以转换为卡片
const isValidCardBlock = (dom: HTMLElement): boolean => {
  if (!dom) return false

  // 检查链接类型
  const linkType = getLinkType(dom)
  return linkType === 'normal-link' || linkType === 'block-ref'
}

// 存储链接元数据
const linksMetaData = ref<{
  [url: string]: {
    title?: string
    description?: string
    image?: string
    siteName?: string
    favicon?: string
    type?: string
  }
}>({})

// 存储块信息的映射
const blockInfoMap = ref<{
  [key: string]: {
    loading: boolean
    data?: any
    icon?: string
    banner?: string
    error?: any
  }
}>({})

// 获取链接类型
const getLinkType = (dom: HTMLElement) => {
  const linkDom = dom.querySelector('span[data-type*="a"]')
  const blockRefDom = dom.querySelector('span[data-type*="block-ref"]')

  if (blockRefDom) return 'block-ref'
  if (linkDom) return 'normal-link'
  return 'unknown'
}

// 获取链接URL
const getLinkUrl = (dom: HTMLElement) => {
  const linkDom = dom.querySelector('span[data-type*="a"]') as HTMLElement
  return linkDom?.getAttribute('data-href') || ''
}

// 获取链接标题
const getLinkTitle = (dom: HTMLElement) => {
  const linkDom = dom.querySelector('span[data-type*="a"]') as HTMLElement
  return linkDom?.textContent || ''
}

// 获取链接域名
const getDomainName = (url: string) => {
  if (!url) return ''

  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch (e) {
    return ''
  }
}

// 获取链接的favicon
const getFaviconUrl = (url: string) => {
  if (!url) return ''

  try {
    const urlObj = new URL(url)
    return `${urlObj.protocol}//${urlObj.hostname}/favicon.ico`
  } catch (e) {
    return ''
  }
}

// 获取网页元数据
const fetchLinkMetadata = async (url: string, forceLoad = false) => {
  if (!forceLoad && (!url || linksMetaData.value[url])) return

  try {
    // 初始化元数据对象
    linksMetaData.value[url] = {
      title: getDomainName(url),
      description: '',
      image: '',
    }

    // 临时存储可能获取的元数据
    let tempTitle = null
    let tempDescription = null
    let tempImage = null

    // 1. 直接使用思源API获取HTML
    try {
      // 使用forwardProxy替代getHtml，避免JSON解析错误
      const response = await request('/api/network/forwardProxy', {
        url,
        method: 'GET',
        timeout: 12000, // 增加超时时间提高成功率
        contentType: 'text/html',
        headers: [
          { Authorization: "" }, // 清除可能的授权头，防止某些网站限制访问
          { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36" }, // 使用标准UA
        ],
      })

      if (response && response.data) {
        // 创建一个DOM解析器来解析HTML
        const parser = new DOMParser()
        const doc = parser.parseFromString(response.data, 'text/html')

        // 获取所有可能的元数据
        tempTitle =
          doc.querySelector('meta[property="org:title"]')?.getAttribute('content')
          || doc.querySelector('meta[property="og:title"]')?.getAttribute('content')
          || doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content')
          || doc.querySelector('title')?.textContent
          || null

        tempDescription =
          doc.querySelector('meta[property="org:description"]')?.getAttribute('content')
          || doc.querySelector('meta[property="og:description"]')?.getAttribute('content')
          || doc.querySelector('meta[name="description"]')?.getAttribute('content')
          || doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content')
          || null

        tempImage =
          doc.querySelector('meta[property="org:img"]')?.getAttribute('content')
          || doc.querySelector('meta[property="org:image"]')?.getAttribute('content')
          || doc.querySelector('meta[property="og:image"]')?.getAttribute('content')
          || doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content')
          || doc.querySelector('meta[property="og:image:url"]')?.getAttribute('content')
          || doc.querySelector('link[rel="image_src"]')?.getAttribute('href')
          || null

        // 尝试提取第一张图片作为缩略图（如果没有元数据图片）
        if (!tempImage) {
          // 尝试获取所有图片并筛选适合作为缩略图的图片
          const allImgs = Array.from(doc.querySelectorAll('img[src]'))
          let bestImg = null
          let bestScore = 0

          // 优先考虑大图片且非图标的图片
          for (const img of allImgs) {
            const imgSrc = img.getAttribute('src')
            if (!imgSrc) continue

            // 跳过明显的小图标和像素图标
            if (imgSrc.includes('icon')
              || imgSrc.includes('logo')) {
              continue
            }

            // 简单的评分系统，偏好大尺寸、合适比例的图片
            let score = 0

            // 根据原始尺寸属性给分
            const imgWidth = img.getAttribute('width')
            const imgHeight = img.getAttribute('height')
            if (imgWidth && imgHeight) {
              const width = Number.parseInt(imgWidth)
              const height = Number.parseInt(imgHeight)
              if (!isNaN(width) && !isNaN(height)) {
                if (width < 100 || height < 80) continue
                score += Math.min(width, 800) / 100
                score += Math.min(height, 600) / 100

                // 偏好合适的宽高比
                const ratio = width / height
                if (ratio >= 1.2 && ratio <= 1.8) {
                  score += 20 // 黄金比例附近的宽高比加分
                }
              }
            }

            // 来自主内容区域的图片加分
            const imgClass = img.getAttribute('class') || ''
            const imgId = img.getAttribute('id') || ''
            const imgAlt = img.getAttribute('alt') || ''

            // 图片类名或id符合特征加分
            if (imgClass.includes('main')
              || imgClass.includes('cover')
              || imgClass.includes('featured')
              || imgId.includes('main')
              || imgId.includes('cover')) {
              score += 20 // 主图片加分
            }

            // 有意义的alt文本加分
            if (imgAlt && imgAlt.length > 5 && !imgAlt.includes('logo')) {
              score += 15
            }

            // 图片路径包含某些关键词加分
            if (imgSrc.includes('banner')
              || imgSrc.includes('cover')
              || imgSrc.includes('header')
              || imgSrc.includes('feature')) {
              score += 30
            }

            // 更新最佳图片
            if (score > bestScore) {
              bestScore = score
              bestImg = imgSrc
            }
          }

          // 如果找到了适合的图片
          if (bestImg) {
            // 如果是相对路径转为绝对路径
            if (!bestImg.startsWith('http') && !bestImg.startsWith('data:')) {
              const urlObj = new URL(url)
              tempImage = `${urlObj.origin}${bestImg.startsWith('/') ? '' : '/'}${bestImg}`
            } else {
              tempImage = bestImg
            }
          } else {
            // 如果评分系统没找到好图片，退回到第一张图片
            const firstImg = allImgs[0]
            if (firstImg) {
              const imgSrc = firstImg.getAttribute('src')
              if (imgSrc && !imgSrc.includes('icon') && !imgSrc.includes('logo')) {
                // 如果是相对路径转为绝对路径
                if (!imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
                  const urlObj = new URL(url)
                  tempImage = `${urlObj.origin}${imgSrc.startsWith('/') ? '' : '/'}${imgSrc}`
                } else {
                  tempImage = imgSrc
                }
              }
            }
          }

          // 如果仍然没有图片，尝试查找背景图
          if (!tempImage) {
            const elementsWithBg = Array.from(doc.querySelectorAll('[style*="background-image"]'))
            for (const el of elementsWithBg) {
              const style = el.getAttribute('style')
              if (style) {
                const bgMatch = style.match(/background-image\s*:\s*url\(['"]?\s*(.*?)['"]?\s*\)/i)
                if (bgMatch && bgMatch[1]) {
                  const bgUrl = bgMatch[1].trim()
                  // 过滤掉明显的渐变和图标
                  if (!bgUrl.includes('gradient') && !bgUrl.includes('icon')) {
                    if (!bgUrl.startsWith('http') && !bgUrl.startsWith('data:')) {
                      const urlObj = new URL(url)
                      tempImage = `${urlObj.origin}${bgUrl.startsWith('/') ? '' : '/'}${bgUrl}`
                    } else {
                      tempImage = bgUrl
                    }
                    break
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('直接获取HTML失败:', e)
    }

    // 2. 特殊网站处理
    if (!tempTitle && url.includes('bilibili.com')) {
      const success = await handleBilibiliMetadata(url)
      if (success) return
    }

    // 3. 使用元数据服务
    if (!tempTitle) {
      try {
        const metadataService = 'https://api.microlink.io'
        const response = await request('/api/network/forwardProxy', {
          url: `${metadataService}?url=${encodeURIComponent(url)}`,
          method: 'GET',
          timeout: 8000,
          contentType: 'application/json',
        })

        if (response && response.data) {
          try {
            // 尝试解析JSON响应
            const jsonData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
            if (jsonData.status === 'success' && jsonData.data) {
              tempTitle = jsonData.data.title || null
              tempDescription = jsonData.data.description || null
              tempImage = (jsonData.data.image && jsonData.data.image.url) || null
            }
          } catch (parseError) {
            console.warn('解析元数据服务响应失败:', parseError)
          }
        }
      } catch (error) {
        console.warn('元数据服务获取失败:', error)
      }
    }

    // 4. 备用服务
    if (!tempTitle) {
      try {
        const previewService = 'https://link-preview-api.vercel.app/api/preview'
        const response = await request('/api/network/forwardProxy', {
          url: previewService,
          method: 'POST',
          timeout: 8000,
          contentType: 'application/json',
          payload: { url },
        })

        if (response && response.data) {
          try {
            // 尝试解析JSON响应
            const jsonData = typeof response.data === 'string' ? JSON.parse(response.data) : response.data
            tempTitle = jsonData.title || null
            tempDescription = jsonData.description || null
            tempImage = jsonData.image || null
          } catch (parseError) {
            console.warn('解析备用服务响应失败:', parseError)
          }
        }
      } catch (error) {
        console.warn('备用服务获取失败:', error)
      }
    }

    // 如果图片URL是相对路径，转换为绝对路径
    if (tempImage && !tempImage.startsWith('http') && !tempImage.startsWith('data:')) {
      try {
        const urlObj = new URL(url)
        tempImage = `${urlObj.origin}${tempImage.startsWith('/') ? '' : '/'}${tempImage}`
      } catch (e) {
        console.warn('图片URL处理失败:', e)
      }
    }

    // 更新最终元数据，使用获取到的数据或保留默认值
    linksMetaData.value[url] = {
      title: tempTitle || getDomainName(url),
      description: tempDescription || '',
      image: tempImage || '',
    }

  } catch (error) {
    console.error('获取网页元数据错误:', error)
  }
}

// 处理B站特殊情况
const handleBilibiliMetadata = async (url: string) => {
  const bvMatch = url.match(/\/video\/(BV\w+)/)
  if (bvMatch && bvMatch[1]) {
    const bvid = bvMatch[1]
    try {
      // 使用B站API获取视频信息，使用forwardProxy替代get
      const biliResponse = await request('/api/network/forwardProxy', {
        url: `https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`,
        method: 'GET',
        timeout: 5000,
        contentType: 'application/json',
      })

      if (biliResponse && biliResponse.data) {
        try {
          // 尝试解析JSON响应
          const jsonData = typeof biliResponse.data === 'string'
            ? JSON.parse(biliResponse.data)
            : biliResponse.data

          if (jsonData && jsonData.code === 0 && jsonData.data) {
            const videoData = jsonData.data
            linksMetaData.value[url] = {
              title: videoData.title || '哔哩哔哩视频',
              description: videoData.desc || '暂无简介',
              image: videoData.pic || '',
            }
            return true
          }
        } catch (parseError) {
          console.warn('解析B站响应失败:', parseError)
        }
      }
    } catch (e) {
      console.warn('获取B站视频信息失败:', e)
    }
  }
  return false
}

// 打开外部链接
const openExternalUrl = (url: string) => {
  if (!url) return

  try {
    window.open(url, '_blank')
  } catch (e) {
    console.error('无法打开链接:', e)
    Message.error('无法打开链接')
  }
}

// 获取块引用ID
const getBlockRefId = (dom: HTMLElement) => {
  const blockRefDom = dom.querySelector('span[data-type*="block-ref"]') as HTMLElement
  return blockRefDom?.getAttribute('data-id') || ''
}

// 获取块引用信息
const loadBlockInfo = async (blockId: string) => {
  if (!blockId) return

  // 初始化加载状态
  blockInfoMap.value[blockId] = {
    loading: true,
  }

  try {
    // 获取块基本信息
    let blockData = await getBlockByID(blockId)
    
    // 如果获取失败，尝试重试几次（对新创建的块很有用）
    if (!blockData) {
      // 延迟重试
      await new Promise(resolve => setTimeout(resolve, 100))
      blockData = await getBlockByID(blockId)
      
      // 如果仍然失败，再试一次
      if (!blockData) {
        await new Promise(resolve => setTimeout(resolve, 200))
        blockData = await getBlockByID(blockId)
      }
    }
    
    // 如果最终无法获取块数据
    if (!blockData) {
      blockInfoMap.value[blockId] = {
        loading: false,
        error: new Error('无法获取块数据，可能是块刚创建尚未完成'),
      }
      return
    }

    // 获取更完整的文档信息（包括图标）
    let docInfo = null
    try {
      const response = await request('/api/block/getDocInfo', { id: blockId })
      if (response && response.code === 0) {
        docInfo = response.data
      }
    } catch (e) {
      console.warn('获取文档信息失败:', e)
    }

    // 如果这个块不是文档块，但可能属于某个文档，获取其所属文档的信息
    let docId = blockId
    if (blockData && blockData.type !== 'd' && blockData.root_id) {
      docId = blockData.root_id

      // 获取所属文档的信息
      try {
        const docResponse = await request('/api/block/getDocInfo', { id: docId })
        if (docResponse && docResponse.code === 0) {
          // 尝试从文档中获取横幅
          if (!docInfo || !docInfo.banner) {
            docInfo = docResponse.data
          }
        }
      } catch (e) {
        console.warn('获取所属文档信息失败:', e)
      }
    }

    // 获取块属性
    const blockAttrs = await getBlockAttrs(blockId)

    // 读取图标和横幅
    let icon = null
    let banner = null
    let name = null

    // 优先从文档信息中获取图标和名称
    if (docInfo) {
      if (docInfo.icon) {
        icon = processIconCode(docInfo.icon)
      }
      if (docInfo.name) {
        name = docInfo.name
      }
      if (docInfo.banner) {
        banner = docInfo.banner
      }

      // 从docInfo的ial中获取title-img作为背景图
      if (docInfo.ial && !banner) {
        try {
          // 解析IAL获取title-img
          const titleImgMatch = docInfo.ial.match(/title-img="([^"]*)"/)
          if (titleImgMatch && titleImgMatch[1]) {
            const titleImg = titleImgMatch[1]
            banner = processTitleImg(titleImg)
          }
        } catch (e) {
          console.warn('解析文档IAL title-img失败:', e)
        }
      }
    }

    // 块名称比文档名称优先级更高
    if (blockAttrs.name) {
      name = blockAttrs.name
    }

    // 如果文档信息中没有图标，再从属性中获取
    if (!icon) {
      if (blockAttrs.icon) {
        icon = processIconCode(blockAttrs.icon)
      } else if (blockAttrs['custom-icon']) {
        icon = processIconCode(blockAttrs['custom-icon'])
      }
    }

    // 尝试从不同属性获取横幅
    if (blockAttrs.banner) {
      banner = blockAttrs.banner
    } else if (blockAttrs['custom-banner']) {
      banner = blockAttrs['custom-banner']
    }

    // 如果是文档类型，从属性字符串(ial)中解析可能的额外属性
    if (blockData && blockData.ial) {
      try {
        // 解析IAL字符串中的icon、banner和name
        const iconMatch = blockData.ial.match(/icon="([^"]*)"/)
        const bannerMatch = blockData.ial.match(/banner="([^"]*)"/)
        const nameMatch = blockData.ial.match(/name="([^"]*)"/)

        if (iconMatch && iconMatch[1] && !icon) {
          icon = processIconCode(iconMatch[1])
        }

        if (bannerMatch && bannerMatch[1] && !banner) {
          banner = bannerMatch[1]
        }

        // name属性优先级高于已存在的name
        if (nameMatch && nameMatch[1]) {
          name = nameMatch[1]
        }
      } catch (e) {
        console.error('解析块IAL失败:', e)
      }
    }

    // 如果是文档块或根块但没有横幅，尝试获取文档资源
    if ((blockData.type === 'd' || blockData.id === blockData.root_id) && !banner) {
      try {
        // 先检查是否有title-img属性
        const titleImgAttrs = await getBlockAttrs(docId)
        if (titleImgAttrs['title-img']) {
          banner = processTitleImg(titleImgAttrs['title-img'])
        } else {
          // 先尝试获取文档背景图
          const backgroundResponse = await request('/api/attr/getBlockAttrs', { id: docId })
          if (backgroundResponse && backgroundResponse.data) {
            // 检查是否有背景图属性
            const backgroundAttrs = backgroundResponse.data
            if (backgroundAttrs.style) {
              // 尝试从style中提取背景图
              const bgMatch = backgroundAttrs.style.match(/background-image:\s*url\(['"]?(.*?)['"]?\)/i)
              if (bgMatch && bgMatch[1]) {
                banner = bgMatch[1]
              }
            }

            // 如果有特定的背景图属性
            if (!banner && backgroundAttrs['background-image']) {
              banner = backgroundAttrs['background-image']
            }
          }

          // 如果没有找到背景图，尝试获取文档DOM
          if (!banner) {
            const domResponse = await request('/api/block/getBlockDOM', { id: docId })
            if (domResponse && domResponse.data) {
              // 创建DOM解析器
              const parser = new DOMParser()
              const doc = parser.parseFromString(domResponse.data, 'text/html')

              // 查找背景图元素
              const bgImg = doc.querySelector('.protyle-background__img img')
              if (bgImg) {
                const imgSrc = bgImg.getAttribute('src')
                if (imgSrc) {
                  // 如果是base64编码的图片
                  if (imgSrc.startsWith('data:image')) {
                    banner = imgSrc
                  } else {
                    banner = imgSrc
                  }
                }
              }
            }
          }

          // 如果仍然没有找到，尝试查询文档的封面图资源
          if (!banner) {
            const sqlQuery = `SELECT * FROM assets WHERE block_id = '${docId}' AND box = '${blockData.box}' ORDER BY updated DESC LIMIT 1`
            const assets = await request('/api/query/sql', { stmt: sqlQuery })

            if (assets && assets.length > 0) {
              // 获取到封面资源
              banner = assets[0].path
            }
          }
        }
      } catch (e) {
        console.warn('获取文档背景图或资源失败:', e)
      }
    }

    // 如果blockData中有name属性则使用，保持与IAL一致的优先级
    if (blockData.name) {
      name = blockData.name
    }

    // 设置name属性
    if (name && blockData) {
      blockData.name = name
    }

    // 设置块信息
    blockInfoMap.value[blockId] = {
      loading: false,
      data: blockData,
      icon,
      banner,
    }

  } catch (error) {
    console.error('获取块信息失败:', error)
    blockInfoMap.value[blockId] = {
      loading: false,
      error,
    }
  }
}

// 处理图标代码
const processIconCode = (iconCode: string) => {
  if (!iconCode) return null

  // 如果是emoji:/格式
  if (iconCode.startsWith('emoji:/')) {
    const emojiPath = iconCode.replace('emoji:/', '')
    // 如果是图片路径（如.svg, .png等）
    if (/\.(svg|png|jpg|jpeg|gif)$/i.test(emojiPath)) {
      return `/emojis/${emojiPath}`
    }
    // 否则可能是十六进制编码
    else if (/^[0-9a-f]+$/i.test(emojiPath)) {
      try {
        return String.fromCodePoint(Number.parseInt(emojiPath, 16))
      } catch (e) {
        console.warn('解析十六进制Emoji编码失败:', e)
      }
    }
    return emojiPath
  }

  // 如果直接是SVG、PNG等图片路径
  if (/\.(svg|png|jpg|jpeg|gif)$/i.test(iconCode)) {
    if (!iconCode.startsWith('/')) {
      return `/emojis/${iconCode}`
    }
    return iconCode
  }

  // 如果是十六进制编码（不带emoji:/前缀）
  if (/^[0-9a-f]+$/i.test(iconCode) && iconCode.length >= 4 && iconCode.length <= 8) {
    try {
      return String.fromCodePoint(Number.parseInt(iconCode, 16))
    } catch (e) {
      console.warn('解析十六进制编码失败:', e)
    }
  }

  // 如果已经是Unicode字符
  if (isUnicodeEmoji(iconCode)) {
    return iconCode
  }

  return iconCode
}

// 判断是否为单个Emoji字符(直接显示而非路径)
const isSingleEmoji = (str: string) => {
  if (!str) return false

  // emoji:/格式一定是路径或代码，不是直接字符
  if (str.includes(':/')) return false

  // 以/开头可能是路径
  if (str.startsWith('/')) return false

  // 包含.可能是文件路径
  if (str.includes('.')) return false

  // assets/、icon-、file-type-等开头的是路径
  if (str.startsWith('assets/') || str.startsWith('icon-') || str.startsWith('file-type-')) return false

  // URL也是路径
  if (str.startsWith('http://') || str.startsWith('https://')) return false

  return isUnicodeEmoji(str)
}

// 判断是否为Unicode Emoji
const isUnicodeEmoji = (text: string) => {
  if (!text) return false

  // 使用更准确的Emoji检测正则表达式
  const regex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u
  return regex.test(text)
}

// 刷新块信息
const refreshBlockInfo = async (blockId: string) => {
  if (!blockId) return

  try {
    // 强制清除缓存
    delete blockInfoMap.value[blockId]
    
    // 重新加载块信息
    await loadBlockInfo(blockId)
    
    // 触发视图更新
    blockInfoMap.value = { ...blockInfoMap.value }
    
  } catch (error) {
    console.error('刷新块信息失败:', error)
  }
}

// 导航到块
const navigateToBlock = (blockId: string) => {
  if (!blockId) return

  try {
    window.open(`siyuan://blocks/${blockId}`, '_blank')
  } catch (error) {
    console.error('无法导航到块:', error)
    Message.error('无法导航到块')
  }
}

// 监听段落列表变化，当列表长度改变时重新检查卡片状态
watch(() => paragraphOnlyLinkList.value.length, (newLength, oldLength) => {
  if (newLength > 0) {
    if (Object.keys(blockCardStatusMap.value).length === 0) {
      // 如果没有状态数据，需要全量初始化
      refreshAllLinkCards(true)
    } else if (newLength > oldLength) {
      // 只有新增链接时，只检查新链接
      const newLinksStartIndex = Math.max(0, oldLength - 1) // 从旧长度-1开始（防止边界情况）
      
      // 异步处理新链接
      setTimeout(async () => {
        for (let i = newLinksStartIndex; i < newLength; i++) {
          const item = paragraphOnlyLinkList.value[i]
          if (item && isValidCardBlock(item)) {
            const nodeId = item.dataset.nodeId
            if (nodeId && blockCardStatusMap.value[nodeId] === undefined) {
              await loadBlockCardStatus(item)
            }
          }
        }
      }, 100)
    }
  }
})

// 监听块列表变化，加载新块的信息
watch(paragraphOnlyLinkList, () => {
  paragraphOnlyLinkList.value.forEach((item) => {
    // 检查块是否应该显示为卡片
    const nodeId = item.dataset.nodeId
    if (nodeId) {
      // 仅当块是有效的链接块且还没有加载过状态时才加载
      if (isValidCardBlock(item) && blockCardStatusMap.value[nodeId] === undefined) {
        loadBlockCardStatus(item)
      }

      // 如果块是卡片，才加载链接元数据和块引用信息
      if (blockCardStatusMap.value[nodeId]) {
        if (getLinkType(item) === 'block-ref') {
          const blockId = getBlockRefId(item)
          if (blockId && !blockInfoMap.value[blockId]) {
            loadBlockInfo(blockId)
          }
        } else if (getLinkType(item) === 'normal-link') {
          const url = getLinkUrl(item)
          if (url && !linksMetaData.value[url]) {
            fetchLinkMetadata(url)
          }
        }
      }
    }
  })
}, { immediate: true })

// 处理思源资源URL
const getAssetUrl = (path: string) => {
  if (!path) return ''

  // 如果是样式类型，直接返回
  if (path.startsWith('style:')) {
    return path
  }

  // 如果已经是完整API路径，直接返回
  if (path.startsWith('/api/asset/')) {
    return path
  }

  // 如果已经是图片路径，直接返回
  if (path.startsWith('/emojis/') || path.startsWith('/appearance/')) {
    return path
  }

  // 如果是网络URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // 如果是思源资源路径
  if (path.startsWith('assets/')) {
    return `${encodeURIComponent(path)}`
  }

  // 如果是icon:格式
  if (path.startsWith('icon:/')) {
    const iconName = path.replace('icon:/', '')
    return `/appearance/icons/material/${iconName}.svg`
  }

  // 如果是系统图标
  if (path.startsWith('icon-')) {
    return `/appearance/icons/material/${path}.svg`
  }

  // 如果是文件类型图标
  if (path.startsWith('file-type-')) {
    const fileType = path.replace('file-type-', '')
    return `/appearance/themes/midnight/iconfile/${fileType}.svg`
  }

  // 如果是图片文件路径（但没有前缀）
  if (/\.(svg|png|jpg|jpeg|gif)$/i.test(path)) {
    // 检查是否已经处理过的资源路径
    if (path.includes('/api/asset/')) {
      return path
    }
    return `/emojis/${path}`
  }

  // 如果以/开头，可能是相对路径
  if (path.startsWith('/')) {
    return path
  }

  // 如果以上都不是，可能是直接的emoji字符
  return path
}

// 获取文档详细信息
const getDocInfo = async (docId: string) => {
  try {
    // 使用SQL获取文档信息
    const sqlQuery = `SELECT * FROM blocks WHERE id = '${docId}' AND type = 'd' LIMIT 1`
    const result = await request('/api/query/sql', { stmt: sqlQuery })

    if (result && result.length > 0) {
      return result[0]
    }
    return null
  } catch (error) {
    console.error('获取文档信息失败:', error)
    return null
  }
}

// 获取块标题（优先级：块命名 > 文档名 > 内容 > 默认文本）
const getBlockTitle = (blockData: any) => {
  if (!blockData) return '未知块'

  // 优先使用自定义命名
  if (blockData.name) {
    return blockData.name
  }

  // 如果是文档块且没有自定义命名，则使用文档名称
  if (blockData.type === 'd' && blockData.content) {
    // 文档块的内容通常就是文档名称
    return blockData.content
  }

  // 其次使用内容的第一行（如果内容不是太长）
  if (blockData.content) {
    const firstLine = blockData.content.split('\n')[0]
    if (firstLine.length < 50) {
      return firstLine
    }
    return `${blockData.content.substring(0, 47)}...`
  }

  // 使用ID的一部分作为标识
  if (blockData.id) {
    return `块 ${blockData.id.substring(0, 7)}...`
  }

  return '未命名块'
}

// 判断是否需要显示内容（内容存在且与标题不同）
const shouldShowContent = (blockData: any) => {
  if (!blockData || !blockData.content) return false

  // 如果是文档块且有自定义命名，不显示内容
  if (blockData.type === 'd' && blockData.name) {
    return false
  }

  const title = getBlockTitle(blockData)

  // 如果标题是从内容中提取的，则不再显示内容
  if (title === blockData.content
    || title === blockData.content.split('\n')[0]
    || (blockData.content.length > 50 && title === `${blockData.content.substring(0, 47)}...`)) {
    return false
  }

  return true
}

// 判断是否为文档块
const isDocumentBlock = (blockData: any) => {
  return blockData && (blockData.type === 'd' || (blockData.id && blockData.id === blockData.root_id))
}

// 添加processTitleImg函数
const processTitleImg = (titleImg: string) => {
  if (!titleImg) return null

  // 解码HTML实体（如 \u0026quot; -> ")
  const decodedTitleImg = titleImg.replace(/\\u0026quot;/g, '"').replace(/&quot;/g, '"')

  // 1. 检查是否包含背景图像url
  const urlMatch = decodedTitleImg.match(/background-image\s*:\s*url\s*\(\s*(?:["']\s*)?(.*?)["']?\s*\)/i)
  if (urlMatch && urlMatch[1]) {
    const imageUrl = urlMatch[1].trim()
    // 直接返回处理后的图片URL，避免重复处理
    return imageUrl
  }

  // 2. 如果是完整的CSS背景样式（如渐变），使用style标签方式处理
  if (decodedTitleImg.includes('gradient')
    || decodedTitleImg.startsWith('background:')
    || decodedTitleImg.includes('background-color')) {
    // 返回完整的CSS样式以在卡片中应用
    return `style:${decodedTitleImg}`
  }

  // 3. 如果是直接的图片路径
  if (decodedTitleImg.startsWith('assets/')
    || decodedTitleImg.startsWith('http')
    || decodedTitleImg.startsWith('data:')) {
    // 直接返回路径，让getAssetUrl处理
    return decodedTitleImg
  }

  // 默认返回null
  return null
}

// 判断横幅是否为样式类型
const isStyleBanner = (banner: string) => {
  return banner && banner.startsWith('style:')
}

// 提取样式内容
const extractStyleContent = (styleString: string) => {
  if (!styleString || !styleString.startsWith('style:')) return {}

  const content = styleString.substring(6) // 移除 'style:' 前缀

  // 构建样式对象
  const style: any = {}

  // 处理不同类型的背景样式
  if (content.includes('background-image')) {
    style.backgroundImage = content.match(/background-image\s*:\s*(.*?)(;|$)/i)?.[1] || ''
  }

  if (content.includes('background:')) {
    style.background = content.match(/background\s*:\s*(.*?)(;|$)/i)?.[1] || ''
  }

  if (content.includes('background-color')) {
    style.backgroundColor = content.match(/background-color\s*:\s*(.*?)(;|$)/i)?.[1] || ''
  }

  if (content.includes('background-size')) {
    style.backgroundSize = content.match(/background-size\s*:\s*(.*?)(;|$)/i)?.[1] || ''
  }

  if (content.includes('background-repeat')) {
    style.backgroundRepeat = content.match(/background-repeat\s*:\s*(.*?)(;|$)/i)?.[1] || ''
  }

  // 如果无法解析单独的属性，则将整个字符串作为样式
  if (Object.keys(style).length === 0) {
    // 将分号分隔的样式转换为对象
    const styleProperties = content.split(';').filter(Boolean)
    for (const prop of styleProperties) {
      const [key, value] = prop.split(':').map((item) => item.trim())
      if (key && value) {
        // 转换为驼峰式
        const camelKey = key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        style[camelKey] = value
      }
    }
  }

  return style
}

// 刷新块属性状态 - 添加这个新函数用于手动刷新
const refreshBlockCardStatus = async (nodeId: string) => {
  if (!nodeId) return

  try {
    // 获取块属性
    const blockAttrs = await getBlockAttrs(nodeId)
    // 更新状态映射
    blockCardStatusMap.value[nodeId] = blockAttrs && blockAttrs[CARD_ATTR_NAME] === 'true'
    return blockCardStatusMap.value[nodeId]
  } catch (e) {
    console.error('刷新块属性状态失败:', e)
    return false
  }
}

// 阻止在卡片区域内的编辑操作
const preventEditInCard = (event: Event) => {
  const target = event.target as HTMLElement

  // 检查事件目标是否在卡片区域内
  if (target && (
    target.closest('.enParagraphLinkCardArea')
    || target.closest('.link-card-container')
    || target.closest('[data-editable="false"]')
  )) {
    // 阻止事件传播和默认行为
    event.stopPropagation()
    event.preventDefault()

    // 如果是键盘事件，且是Tab或者Esc键，允许事件继续传播
    if (event instanceof KeyboardEvent) {
      if (event.key === 'Tab' || event.key === 'Escape') {
        // 不阻止Tab和Esc键，允许用户正常导航
        return
      }
    }

    return false
  }
}

// 特殊处理退格键的全局事件监听
const handleBackspaceKey = (event: KeyboardEvent) => {
  // 只处理退格键事件
  if (event.key !== 'Backspace') return
  
  // 获取当前活动的编辑区域
  const protyle = document.querySelector('.protyle-wysiwyg.protyle-wysiwyg--attr') as HTMLElement
  if (!protyle) return
  
  // 获取光标所在的块
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return
  
  const range = selection.getRangeAt(0)
  const currentBlock = range.startContainer.parentElement?.closest('[data-node-id]') as HTMLElement
  if (!currentBlock || !currentBlock.dataset.nodeId) return
  
  // 检查上一个块是否为卡片块
  const prevBlock = currentBlock.previousElementSibling as HTMLElement
  if (!prevBlock || !prevBlock.dataset.nodeId) return
  
  // 检查前一个块是否为卡片
  if (blockCardStatusMap.value[prevBlock.dataset.nodeId]) {
    // 检查当前块是否为空
    const isEmpty = currentBlock.textContent?.trim() === '' || 
                    currentBlock.querySelector('.protyle-attr')?.textContent?.trim() === currentBlock.textContent?.trim()
    
    // 如果当前块为空且光标在块起始位置，阻止默认退格行为
    if (isEmpty && range.startOffset === 0) {
      // 阻止事件默认行为，防止卡片渲染消失
      event.preventDefault()
      event.stopPropagation()
    }
  }
}

// 添加事件处理函数防止编辑器操作
const preventEditingEvents = (e: MouseEvent) => {
  e.stopPropagation()
}

// 在组件挂载和卸载时添加或移除全局事件
onMounted(() => {
  // 创建一个MutationObserver来观察块属性变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes'
        && mutation.attributeName === 'data-temp-refresh'
        && mutation.target instanceof HTMLElement) {

        const target = mutation.target as HTMLElement
        const nodeId = target.dataset.nodeId

        if (nodeId) {
          // 当检测到temp-refresh属性变化时，立即刷新块状态
          refreshBlockCardStatus(nodeId).then((isCard) => {
          })
        }
      }
    })
  })

  // 观察整个文档
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-temp-refresh'],
    subtree: true,
  })

  // 添加事件监听，防止卡片区域被编辑
  document.addEventListener('compositionstart', preventEditInCard, true)
  document.addEventListener('compositionupdate', preventEditInCard, true)
  document.addEventListener('compositionend', preventEditInCard, true)
  document.addEventListener('keydown', preventEditInCard, true)
  document.addEventListener('input', preventEditInCard, true)
  
  // 添加退格键全局监听
  document.addEventListener('keydown', handleBackspaceKey, true)

  // 监听思源的刷新事件
  const eventBusElement = document.getElementById('eventBus')
  if (eventBusElement) {
    const handleSiyuanEvent = async (event: any) => {
      const detail = event.detail
      if (!detail) return
      
      // 处理各种需要刷新的事件
      if (
        detail.cmd === 'reloadProtyle' ||
        detail.cmd === 'refreshAttributeView' ||
        detail.cmd === 'setAttr' ||
        detail.cmd === 'rename' ||
        detail.cmd === 'updateAttr' ||
        detail.cmd === 'refreshBacklink' ||
        detail.cmd === 'transactions' ||
        detail.cmd === 'unmount' ||
        detail.cmd === 'mount' ||
        detail.cmd === 'insert'  // 添加insert事件监听
      ) {
        // 判断事件类型，有选择性地刷新
        const shouldFullRefresh = [
          'reloadProtyle',
          'unmount',
          'mount'
        ].includes(detail.cmd)
        
        // 处理特定块的属性修改
        if (detail.cmd === 'setAttr' || detail.cmd === 'updateAttr') {
          // 获取受影响的块ID
          const blockId = detail.data?.id
          if (blockId) {
            // 立即刷新这个块的信息
            await refreshBlockInfo(blockId)
            
            // 只刷新引用了这个块的卡片
            let hasUpdatedReferences = false
            for (const item of paragraphOnlyLinkList.value) {
              if (getLinkType(item) === 'block-ref' && getBlockRefId(item) === blockId) {
                const nodeId = item.dataset.nodeId
                if (nodeId) {
                  await refreshBlockCardStatus(nodeId)
                  hasUpdatedReferences = true
                }
              }
            }
            
            // 如果已经更新了引用，不需要再触发全局刷新
            if (hasUpdatedReferences) {
              return
            }
          }
        }
        
        // 特殊处理插入操作，可能是新创建的块引用
        if (detail.cmd === 'insert') {
          // 设置较短的延迟，给思源一点时间写入数据库
          setTimeout(() => {
            // 查找新插入的块引用
            const newBlockRefs = document.querySelectorAll('span[data-type="block-ref"]:not([data-processed="true"])')
            if (newBlockRefs.length > 0) {
              newBlockRefs.forEach(async (ref) => {
                // 标记为已处理
                ref.setAttribute('data-processed', 'true')
                const blockId = ref.getAttribute('data-id')
                if (blockId) {
                  // 强制刷新块信息
                  delete blockInfoMap.value[blockId]
                  await loadBlockInfo(blockId)
                  
                  // 更新状态
                  blockInfoMap.value = { ...blockInfoMap.value }
                  
                  // 找到所属的段落块
                  const paragraphBlock = ref.closest('[data-node-id]') as HTMLElement
                  if (paragraphBlock && paragraphBlock.dataset.nodeId) {
                    // 刷新该块的卡片状态
                    await refreshBlockCardStatus(paragraphBlock.dataset.nodeId)
                    blockCardStatusMap.value = { ...blockCardStatusMap.value }
                  }
                }
              })
            }
          }, 100)
        }
        
        // 处理事务类型的更新，判断是否需要刷新卡片
        if (detail.cmd === 'transactions') {
          // 检查事务是否涉及到编辑操作
          const isOnlyTextEdit = detail.data?.length > 0 && 
                                detail.data.every((tx: any) => 
                                  tx.doOperations?.every((op: any) => 
                                    op.action === 'update' && 
                                    op.data?.indexOf('<span data-type="a"') === -1 && 
                                    op.data?.indexOf('<span data-type="block-ref"') === -1
                                  )
                                )
          
          // 如果只是普通文本编辑，不刷新卡片
          if (isOnlyTextEdit) {
            return
          }
          
          // 检查是否包含块引用
          const hasBlockRef = detail.data?.some((tx: any) => 
            tx.doOperations?.some((op: any) => 
              op.data?.indexOf('<span data-type="block-ref"') > -1
            )
          )
          
          // 如果包含块引用，需要立即处理新创建的块引用
          if (hasBlockRef) {
            setTimeout(() => {
              // 查找新的块引用
              const allBlockRefs = document.querySelectorAll('span[data-type="block-ref"]')
              allBlockRefs.forEach(async (ref) => {
                const blockId = ref.getAttribute('data-id')
                if (blockId && !blockInfoMap.value[blockId]) {
                  // 加载块信息
                  await loadBlockInfo(blockId)
                }
              })
              
              // 更新状态
              blockInfoMap.value = { ...blockInfoMap.value }
            }, 50)
          }
        }

        // 使用防抖处理刷新
        if (window.cardRefreshTimer) {
          clearTimeout(window.cardRefreshTimer)
        }
        
        window.cardRefreshTimer = setTimeout(async () => {
          // 根据事件类型决定是否进行全量刷新
          await refreshAllLinkCards(shouldFullRefresh)
        }, 300)
      }
    }

    // 添加事件监听
    eventBusElement.addEventListener('click', handleSiyuanEvent)
    // 保存事件处理函数以便后续移除
    ;(window as any).__cardEventHandler = handleSiyuanEvent
  }

  // 监听window的focus事件，可能表示从其他窗口返回
  window.addEventListener('focus', () => {
    // 检查如果blockCardStatusMap为空但paragraphOnlyLinkList不为空，则刷新卡片
    if (Object.keys(blockCardStatusMap.value).length === 0
      && paragraphOnlyLinkList.value.length > 0) {
      refreshAllLinkCards(true) // 这种情况需要强制全量刷新
    }
  })

  // 额外监听F5键刷新事件（备用方案）
  document.addEventListener('keydown', (event) => {
    if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
      // 使用setTimeout确保在页面实际刷新后执行
      setTimeout(() => {
        refreshAllLinkCards(true) // 刷新按键需要强制全量刷新
      }, 500)
    }
  })

  // 初始化时强制刷新一次所有卡片状态
  refreshAllLinkCards(true) // 初始化时需要强制全量刷新
})

onBeforeUnmount(() => {
  // 清除定时器
  if (window.cardRefreshTimer) {
    clearTimeout(window.cardRefreshTimer)
  }

  // 移除事件监听
  document.removeEventListener('compositionstart', preventEditInCard, true)
  document.removeEventListener('compositionupdate', preventEditInCard, true)
  document.removeEventListener('compositionend', preventEditInCard, true)
  document.removeEventListener('keydown', preventEditInCard, true)
  document.removeEventListener('input', preventEditInCard, true)
  
  // 移除退格键监听
  document.removeEventListener('keydown', handleBackspaceKey, true)

  // 移除思源事件监听
  const eventBusElement = document.getElementById('eventBus')
  if (eventBusElement && (window as any).__cardEventHandler) {
    eventBusElement.removeEventListener('click', (window as any).__cardEventHandler)
    delete (window as any).__cardEventHandler
  }

  // 移除window事件监听
  window.removeEventListener('focus', () => {})
})

// 导出函数供其他组件使用
defineExpose({
  toggleCardAttr,
  isValidCardBlock,
  refreshBlockCardStatus,
  refreshAllLinkCards,
})

// 在script setup的开头添加类型声明
declare global {
  interface Window {
    cardRefreshTimer: ReturnType<typeof setTimeout> | undefined
  }
}

</script>

<style lang="scss" scoped>
.link-card-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 4px;
  background-color: var(--b3-theme-background);
  min-width: 100%;
  user-select: none;
  pointer-events: auto;
}

.normal-link-card {
  display: flex;
  padding: 16px;
  border-radius: 12px;
  background-color: var(--b3-theme-surface);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.06);

  &:hover {
    background-color: var(--b3-theme-surface-lighter);
  }
}

.link-content {
  flex: 1;
  min-width: 0;
  padding-right: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.link-domain {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--b3-theme-on-surface-light);
  margin-bottom: 2px;
}

.link-favicon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}

.link-title {
  font-weight: bold;
  font-size: 17px;
  color: var(--b3-theme-on-background);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 2px;
}

.link-description {
  font-size: 14px;
  color: var(--b3-theme-on-surface);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0.9;
}

.link-thumbnail {
  width: 140px;
  height: 100px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }

}

.block-ref-card {
  width: 100%;
  border-radius: 12px;
  background-color: var(--b3-theme-surface);
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
  color: var(--b3-theme-on-background);
  border: 1px solid rgba(0, 0, 0, 0.06);

  &.is-loading {
    min-height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &:hover {
    background-color: var(--b3-theme-surface-lighter);
  }

}

.block-ref-content-wrapper {
  display: flex;
  width: 100%;
  gap: 0;
  align-items: stretch;
  justify-content: space-between;
  min-height: 80px;
}

.block-ref-left {
  flex: 1;
  display: flex;
  padding: 16px 20px;
  gap: 16px;
  align-items: center;
  min-width: 0;
}

.block-ref-icon {
  flex-shrink: 0;
  width: 64px;
  height: 64px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--b3-theme-background, #2a2a2a);
  font-size: 28px; // 为直接显示的emoji设置字体大小

  img {
    width: 100%;
    height: 100%;
    /*object-fit: contain;*/
  }
}

.block-ref-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: center;
}

.block-ref-title {
  font-weight: bold;
  font-size: 18px;
  color: var(--b3-theme-on-background, #ffffff);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-ref-content {
  font-size: 14px;
  color: var(--b3-theme-on-surface-light, rgba(255, 255, 255, 0.7));
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.block-ref-alias {
  font-size: 13px;
  color: var(--b3-theme-on-surface-light, rgba(255, 255, 255, 0.6));
  font-style: italic;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.block-ref-memo {
  font-size: 12px;
  color: var(--b3-theme-on-surface-light, rgba(255, 255, 255, 0.5));
  line-height: 1.4;
  max-height: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.block-ref-banner {
  flex-shrink: 0;
  width: 30%;
  min-width: 120px;
  max-width: 200px;
  overflow: hidden;
  align-self: stretch;
  position: relative;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    position: absolute;
    top: 0;
    left: 0;
  }

  .style-banner {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    position: absolute;
    top: 0;
    left: 0;
  }
}

.block-ref-error {
  color: var(--b3-theme-error, #ff5252);
  font-size: 13px;
  text-align: center;
  padding: 16px;
}

.card-action-button {
  align-self: flex-end;
  opacity: 0.8;

  &:hover {
    opacity: 1;
  }
}
</style>

<style lang="scss">
// 修改样式，让卡片不再遮盖原有内容
.enParagraphLinkCardArea {
  position: relative;
  width: 100%;
  overflow: hidden;
  user-select: none;

  // 隐藏原始内容
  & + [contenteditable="true"] {
    display: none;
  }
}

// 添加用于阻止编辑的全局样式
.enParagraphLinkCardArea,
.enParagraphLinkCardArea * {
  cursor: pointer !important;
}

.enParagraphLinkCardArea::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;
}

// 特殊处理链接和块引用的点击行为
.link-card,
.block-ref-card {
  pointer-events: auto !important;
}

// 隐藏原始链接内容
div[custom-en-link-card="true"] {
  > [contenteditable="true"] {
    display: none;
  }
}
</style>
