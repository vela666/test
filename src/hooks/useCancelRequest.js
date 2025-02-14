import { toRef, reactive } from 'vue'
import { cancelQuery } from '@/api/modules/analysis/common'
import useHttpCancel from '@/store/modules/http-cancel'

export default function () {
  const httpCancel = useHttpCancel()
  const cancelSate = reactive({
    controller: null,
    requestId: null,
  })

  /**
   * @description 计算报表回调获取uuid
   */
  const cancelCallBack = (controller, requestId) => {
    cancelSate.controller = controller
    cancelSate.requestId = requestId
  }

  /**
   * @description 重置
   */
  const cancelReset = () => {
    cancelSate.controller = null
    cancelSate.requestId = null
  }

  /**
   * @description 取消计算
   */
  const cancelCalculate = (callback = () => {}) => {
    callback?.()
    httpCancel.remove(cancelSate.controller)
    if (cancelSate.requestId) {
      cancelQuery({ uuid: cancelSate.requestId })
      cancelReset()
    }
  }

  return {
    requestId: toRef(cancelSate, 'requestId'),
    cancelCallBack,
    cancelCalculate,
    cancelReset,
  }
}
