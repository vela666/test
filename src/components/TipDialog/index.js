import { h, ref, createApp } from 'vue'
import TipDialog from './index.vue'
import { i18n } from '@/locales/i18n'

const createContainer = () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  return container
}

// 可使用vue的方法而不用手动引入组件 resolveComponent('ElButton')
// 可使用vue的方法而不用手动引入指令 resolveDirective('vLoading')
// 使用示例
/*const demo = async (row) => {
  try {
    if (某些情况只需要提示(要设置needLoading: false))) {
      const content = `隐藏【${row.eventName}】事件会导致分析模型中使用了此事件的报表展示异常，确定隐藏吗？`
      await useTipModal({
        content,
        iconType: 3,
        needLoading: false,
        btnSwap: true,
        title: '隐藏事件',
      })
    }
    // 发请求的....
  } catch (e) {
    console.log(e)
  }
}*/

/*useTipModal(
  {
    content:'1',
    // 支持html标签
    content: `
     <div class="mb5">重置成功</div>
    <div class="copyTest" ref="copyRef">
      <div>账号：124124</div>
      <div>密码：2151</div>
      <div>登录地址：125125</div>
    </div>
      `,
    iconType: 3,
    btnSwap: true,
    needLoading: true,
    title: '浏览',
    // 传事件
    onSubmit(cb) {
      console.log('onSubmit')
      setTimeout(() => {
        cb()
      }, 3000)
    },
    onClose() {
      console.log('close')
    },
  },
  // 插槽
  {
    default() {
      return 'ahgasshsaha'
    },
    header() {
      return '1aads'
    },
    btn: ({ updShow }) =>
      h(
        ElButton,
        {
          onClick(event) {
            updShow(true)
            console.log(event)
            setTimeout(() => {
              updShow(false)
            }, 3000)
          },
          type: 'primary',
        },
        () => '确定'
      ),
    btn: ({ updShow }) =>
      h('div', [
        h(
          ElButton,
          {
            onClick(event) {
              updShow(false)
            },
          },
          () => '取消'
        ),
        h(
          ElButton,
          {
            onClick(event) {
              updShow(true)
              console.log(event)
              setTimeout(() => {
                updShow(false)
              }, 3000)
            },
            type: 'primary',
          },
          () => '确定'
        ),
      ]),
  }
)*/

export const useTipModal = async (props, slots, getInstance) => {
  return new Promise((resolve, reject) => {
    const show = ref(true)
    const loading = ref(false)
    const instance = createApp({
      render() {
        return h(
          TipDialog,
          {
            ...props,
            modelValue: show.value,
            'onUpdate:modelValue': (value) => {
              show.value = value
            },
            loading: loading.value,
            'onUpdate:loading': (value) => {
              loading.value = value
            },
            onResolve: resolve,
            onReject: reject,
            instance,
            /* onClosed: () => {
                                      instance.unmount()
                                      document.body.removeChild(instance._container)
                                    },*/
          },
          // 插槽
          slots
        )
      },
    }).use(i18n)
    const container = createContainer()
    instance.mount(container)
    getInstance && getInstance(instance)
  })
}
