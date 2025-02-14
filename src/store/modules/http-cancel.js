import { defineStore } from 'pinia'
import { ref } from 'vue'

export default defineStore('httpCancel', () => {
  const httpRequestList = ref([])

  const add = (payload) => {
    if (payload === 0) {
      // 强行中断时才向下执行
      httpRequestList.value.forEach((item) => {
        item.abort() // 给个标志，中断请求
      })
      httpRequestList.value = []
    } else {
      httpRequestList.value.push(payload)
    }
  }

  const remove = (controller) => {
    if (controller) {
      controller.abort()
    } else {
      add(0)
    }
  }

  return { add, remove }
})
