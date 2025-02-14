// 后端分页时用到的hooks
import { toRefs, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { isFunction } from '@/utils/types'
import { delNullProperty } from '@/utils/dataProcessing'

export default function usePaginationState(needPaging = false) {
  let $route = useRoute()
  const initVal = () => {
    return {
      listData: [],
      // 分页器配置
      pagingConfig: {
        page: 1, // 当前页码
        pageSize: 20, // 每页数量
        total: 0, // 总数
      },
    }
  }
  const paginationState = reactive(initVal())
  /**
   * @desc 利用闭包防止频繁请求导致数据错乱
   * @param params 携带的参数
   * @param getData 获取数据方法
   * @param reset 重置所有数据
   */
  /* let curReqCount = 0


      const executeGetData = async (
         params = {},
         getData = false,
         reset = false
       ) => {
         if (!isFunction(getData)) {
           throw new Error(`请传入获取数据方法:组件：${$route.name}`)
           // eslint-disable-next-line
           return Promise.reject(`请传入获取数据方法:组件：${$route.name}`)
         }
         reset && Object.assign(paginationState, initVal())
         const count = ++curReqCount
         return (async (...args) => {
           try {
             // paginationState.listData = []
             // delNullProperty去除空值
             let { data } = await getData({
               pageNum: paginationState.pagingConfig.page,
               pageSize: paginationState.pagingConfig.pageSize,
               ...delNullProperty(params),
             })
             // 防止重复请求
             if (count === curReqCount) {
               paginationState.listData = data.list
               // paginationState.total = paginationState.listData.length
               paginationState.pagingConfig.total = data.total
               return data.list
             }
           } catch (e) {
             paginationState.listData = []
             return Promise.reject(e)
           }
         })()
       }*/

  const executeGetData = async (
    params = {},
    getData = false,
    reset = false
  ) => {
    if (!isFunction(getData)) {
      throw new Error(`请传入获取数据方法:组件：${$route.name}`)
      // eslint-disable-next-line
      return Promise.reject(`请传入获取数据方法:组件：${$route.name}`)
    }
    reset && Object.assign(paginationState, initVal())
    try {
      // delNullProperty去除空值
      let { data } = await getData({
        pageNum: paginationState.pagingConfig.page,
        pageSize: paginationState.pagingConfig.pageSize,
        ...delNullProperty(params),
        // 频繁请求
        UNIQUE_REQ: true,
      })
      // 防止重复请求
      paginationState.listData = data.list
      // paginationState.total = paginationState.listData.length
      paginationState.pagingConfig.total = data.total
      return data.list
    } catch (e) {
      paginationState.listData = []
      return Promise.reject(e)
    }
  }
  return {
    ...toRefs(paginationState),
    executeGetData,
  }
}
