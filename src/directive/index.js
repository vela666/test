import { debounce, throttle } from 'lodash-es'
import delegate from 'delegate'
import { ElMessage } from 'element-plus'
import { createPopper } from '@popperjs/core'
import { isObject } from '@/utils/types'
import { getActualWidthOfChars } from '@/utils'
import { t } from '@/locales/i18n'

let delegation = null
/**
 * @description 事件委托 精准委托
 * @author 王应龙
 * @link https://github.com/zenorocha/delegate
 * @returns 返回目标元素
 * @example
 * <button v-eventDelegation="{fn: handler, target: '触发目标类名'}"></button>
 * <button v-eventDelegation:change="{fn: handler, target: '触发目标类名'}"></button>
 */
const eventDelegation = {
  // el {element} 当前元素
  mounted(el, binding) {
    let event = binding.arg || 'click'
    const {
      target = false,
      fn = (e) => {
        console.log(e, '触发元素')
      },
    } = binding.value
    if (target) {
      delegation = delegate(
        el,
        target,
        event,
        function (e) {
          fn(e.delegateTarget)
        },
        false
      )
    }
  },
  // 指令与元素解绑时
  beforeUnmount() {
    // 找到浮层元素并移除
    delegation.destroy()
  },
}

/**
 * @des 左键点击复制内容
 * val = 要复制的内容
 * v-copy:stop="val" 不允许冒泡
 * <span v-copy="val">
 *   {{ val }}
 * </span>
 */
let elMessage = null
const copy = {
  mounted(el, { value, arg }) {
    el.$value = value || el.textContent
    if (!el.$value) return
    el.handler = debounce(() => {
      elMessage && elMessage.close()
      const input = document.createElement('input')
      input.value = el.$value
      document.body.appendChild(input)
      input.select()
      document.execCommand('Copy')
      input.remove()
      elMessage = ElMessage.success({
        message: t('common.successfulCopy'),
        duration: 500,
      })
    }, 100)
    // 绑定点击事件，就是所谓的一键 copy 啦
    el.addEventListener('click', (e) => {
      // 是否允许事件冒泡  true不允许( v-copy:stop="val" ) false允许( v-copy="val" )
      arg && e.stopPropagation()
      el.handler()
    })
  },
  // 当传进来的值更新的时候触发
  updated(el, { value }) {
    el.$value = value || el.textContent
  },
  // 指令与元素解绑的时候，移除事件绑定
  beforeUnmount(el) {
    el.removeEventListener('click', el.handler)
  },
}

// 单行 超出文字显示...并显示文字提示框 只需要设置元素宽即可
const showTips = {
  // el {element} 当前元素
  mounted(el, binding) {
    const {
      delay = 300,
      place = 'top',
      hide = true,
      arrow = true,
    } = isObject(binding.value) ? binding.value : {}
    // 鼠标移入
    let setId = null
    let tooltipId = null
    el.classList.add('n-only-tooltip')
    let fn = throttle(function (e) {
      // mousemove 事件
      if (
        e.relatedTarget?.matches('.n-only-tooltip') &&
        e.target.matches('.n-only-tooltip')
      ) {
        clearTimeout(tooltipId)
      }
      tooltipId = setTimeout(() => {
        // mousemove 事件
        if (
          !e.relatedTarget?.matches('.n-only-tooltip') &&
          !e.target.matches('.n-only-tooltip')
        ) {
          let tooltip = document.getElementById('tooltip')
          window.removeEventListener('mouseover', fn)
          if (tooltip) {
            tooltip.onmouseleave = null
            tooltip.remove()
          }
          clearTimeout(tooltipId)
          tooltipId = null
        }
      }, 300)
    }, 300)
    // 给当前元素设置超出隐藏
    el.style.overflow = 'hidden'
    el.style.textOverflow = 'ellipsis'
    el.style.whiteSpace = 'nowrap'
    // 鼠标移入
    el.onmouseenter = function (e) {
      // 计算el宽度
      const computeStyle = getComputedStyle(el)
      const range = document.createRange()
      range.setStart(el, 0)
      range.setEnd(el, el.childNodes.length)
      const rangeDOM = range.getBoundingClientRect()
      const padding =
        parseInt(computeStyle.paddingLeft.replace('px', '')) +
        parseInt(computeStyle.paddingRight.replace('px', ''))
      const rangeWidth = Math.round(rangeDOM.width)
      if (
        rangeWidth + padding > el.offsetWidth ||
        el.scrollWidth > el.offsetWidth
      ) {
        clearTimeout(setId)
        setId = setTimeout(() => {
          let tooltip = document.getElementById('tooltip')
          tooltip && tooltip.remove()
          // 创建浮层元素并设置样式
          const div = document.createElement('div')
          div.classList.add('eas-tooltip', 'n-only-tooltip')
          // 设置id方便寻找
          div.setAttribute('id', 'tooltip')
          // 浮层中的文字
          let innerHTML = `<div class="eas-tooltip-overflow n-only-tooltip">${el.innerText}</div>`
          if (arrow) {
            innerHTML += `<div id="eas-arrow" data-popper-arrow></div>`
          }
          div.innerHTML = innerHTML
          div.onmouseleave = function () {
            clearTimeout(tooltipId)
            tooltipId = null
            this.onmouseleave = null
            this.remove()
          }
          // 将浮层插入到body中
          document.body.appendChild(div)
          // 让提示元素的位置始终保持在正确位置
          createPopper(this, div, {
            strategy: 'fixed',
            placement: place,
            modifiers: [
              {
                name: 'offset',
                options: {
                  offset: [0, 8],
                },
              },
              {
                name: 'preventOverflow',
                options: {
                  padding: 8,
                },
              },
            ],
          })
          clearTimeout(setId)
          setId = null
        }, delay)
      }
    }
    // 鼠标移出
    el.onmouseleave = function () {
      // el.style.cursor = 'default'
      if (hide) {
        let id = setTimeout(() => {
          // 找到浮层元素并移除
          const tooltip = document.getElementById('tooltip')
          tooltip && document.body.removeChild(tooltip)
          clearTimeout(id)
          id = null
        }, 300)
        return
      }
      window.addEventListener('mousemove', fn)
    }
  },
  // 指令与元素解绑时
  beforeUnmount(el) {
    el.onmouseenter = null
    el.onmouseleave = null
    // 找到浮层元素并移除
    let tooltip = document.getElementById('tooltip')
    tooltip && tooltip.remove()
  },
}

export default {
  eventDelegation,
  copy,
  showTips,
}
