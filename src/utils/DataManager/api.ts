import PluginInfo from '@/../plugin.json'
import { fetchPost } from 'siyuan'

const pluginName = (PluginInfo as any).name


// 读取数据，从思源 petals/sy-plugin-enhance 下
export function loadData(storageName: string) {
  return new Promise((resolve) => {
    fetchPost("/api/file/getFile", { path: `/data/storage/petal/${pluginName}/${storageName}` }, (response) => {
      resolve(response)
    })
  })
}

// 写入数据，到思源 petals/sy-plugin-enhance 下
export function saveData(storageName: string, data: any) {
  return new Promise((resolve) => {
    const pathString = `/data/storage/petal/${pluginName}/${storageName}`
    let file: File
    if (typeof data === "object") {
      file = new File([new Blob([JSON.stringify(data)], {
        type: "application/json",
      })], pathString.split("/").pop())
    } else {
      file = new File([new Blob([data])], pathString.split("/").pop())
    }
    const formData = new FormData()
    formData.append("path", pathString)
    formData.append("file", file)
    formData.append("isDir", "false")
    fetchPost("/api/file/putFile", formData, (response) => {
      resolve(response)
    })
  })
}

// 删除数据，从思源 petals/sy-plugin-enhance 下
export function removeData(storageName: string) {
  return new Promise((resolve) => {

    fetchPost("/api/file/removeFile", { path: `/data/storage/petal/${pluginName}/${storageName}` }, (response) => {
      resolve(response)
    })
  })
}
