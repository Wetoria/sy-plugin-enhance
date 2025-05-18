/**
 * 同步模块的数据消息结构
 *
 * @field namespace - 当前同步数据的命名空间
 * @field data - 当前同步的数据 type: any
 */
interface SyncDataMsg<T> {
  namespace: string
  data: T
}
