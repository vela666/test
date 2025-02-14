import { ElMessage, ElMessageBox } from 'element-plus'
import useUserStore from '@/store/modules/user'
import { useTipModal } from '@/components/TipDialog/index.js'
// import useRouteStore from '@/store/modules/route'
import { isMobile } from '@/utils/mobile.js'

// 数据运营
let existConfirm = false
//  type = 1 不同标签页切换账号 2 = token异常
export const messageBoxConfirmFn = async (type = 1, userStore) => {
  try {
    // 数据运营判断
    // const notOperate = !/\/operate\//.test(location.href.replace(/\?.*/, ''))
    if (!existConfirm) {
      existConfirm && ElMessageBox.close()
      existConfirm = true
      const msg =
        type === 1
          ? '登录状态已更新，请点击确定按钮刷新页面'
          : '登录状态失效，请重新登录'
      const title = type === 1 ? '登录状态更新' : '登录失效'
      await ElMessageBox.confirm(msg, title, {
        type: 'warning',
        closeOnClickModal: false,
        closeOnPressEscape: false,
        center: true,
        customClass: `nd-message-box-424${isMobile() ? ' mobile' : ''}`,
      })

      if (type === 2) {
        userStore.resetUser()
      }
      location.reload()
    }
  } catch (e) {
    existConfirm = false
  }
}

export const showStatusTip = ({ code, message, data }) => {
  const userStore = useUserStore()
  /* const {
      routes: { rawData },
    } = useRouteStore()*/
  const statusMap = {
    401() {
      messageBoxConfirmFn(2, userStore)
    },
    // 对应接口 要判断对应code 因为600返回的promise为成功
    // if (code === 200) {
    //    ElMessage.success('提示')
    //    state.show = false
    // }
    // 目前都是在事件、事件/用户属性使用
    // asyncMultiplexTo、asyncAddCustomEvent、asyncAddEventAttr、asyncAddUserAttr
    async 600() {
      /* const data = [
          {
            title: '第1行',
            tips: ['23124'],
          },
      ]*/
      let messageHtml = `<div class="flex flex-direction-column gap10">`
      data.forEach((item, index) => {
        messageHtml += `<div>${index + 1}、${
          item.title
        }：${item.tips.join('，')}`
        messageHtml += '</div>'
      })
      if (window.useTipModalInstance) {
        window.useTipModalInstance.unmount()
        document.body.removeChild(window.useTipModalInstance._container)
        window.useTipModalInstance = null
      }
      useTipModal(
        {
          content: messageHtml,
          iconType: 3,
          modal: false,
          needLoading: false,
          showBtn: false,
          alignCenter: false,
          title: message,
          width: '516px',
          draggable: true,
          maxH: '400px',
          onClosed() {
            window.useTipModalInstance = null
          },
          onOpened() {
            // 支持点击其他内容区域
            let overlay = document.querySelector('.nd-tip-dialog.is-draggable')
            // 设置pointerEvents='auto',使对话框可以正常操作
            overlay.style.pointerEvents = 'auto'
            //通过对话框Dom获取遮罩层Dom,修改其pointerEvents = 'none',使其他区域可正常操作
            //第一层遮罩层
            let overlayFa = overlay.parentNode
            overlayFa.style.pointerEvents = 'none'
            //第二层遮罩层
            let overlayGfa = overlay.parentNode.parentNode
            overlayGfa.style.pointerEvents = 'none'
          },
        },
        {},
        (instance) => {
          window.useTipModalInstance = instance
        }
      )
    },
    // 针对提示是error 但是需要warn的信息
    6001() {
      ElMessage.warning(message)
    },
    601() {
      // const data = ['事件名称【launch】已存在', '事件名称【purchase】已存在']
      let messageHtml = `<div class="title">${message}</div><div class="content">`
      data.forEach((item, index) => {
        messageHtml += `<div class="content-item">${item}</div>`
      })
      messageHtml += '</div>'
      ElMessage({
        type: 'warning',
        duration: 0,
        showClose: true,
        dangerouslyUseHTMLString: true,
        message: messageHtml,
        customClass: 'nd-warning-message-600-or-601',
      })
    },
  }

  if (statusMap[code]) {
    statusMap[code]()
    return
  }
  ElMessage.error(message || '当前状态未处理')
}
