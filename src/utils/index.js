import { maxBy } from 'lodash-es'
import dayjs from 'dayjs'
import { i18n } from '@/locales/i18n'

/**
 * @description 更新URL中的查询参数，支持对象格式的参数 且不刷新页面
 * @param {Object} parameterObject - 包含要更新或添加的参数的对象。
 * @param {boolean} [keepOldParams=false] - 是否保留旧的参数，默认为 false。
 * @param {Array} filterList - 需要过滤的参数字段名
 */
export function updateUrlParams(
  parameterObject,
  keepOldParams = false,
  filterList
) {
  const currentHash = window.location.hash
  const [hashUrl, params] = currentHash.split('?')
  const baseUrl = location.origin + hashUrl

  // 创建新的 URLSearchParams 对象，将仅包含新的参数
  const searchParams = new URLSearchParams(keepOldParams ? params : '')

  if (parameterObject) {
    Object.keys(parameterObject).forEach((key) => {
      const value = parameterObject[key]

      // 更新或添加参数
      if (value !== undefined) {
        searchParams.set(key, value)
      } else {
        // 如果值为 undefined，则删除参数
        searchParams.delete(key)
      }
    })
    // 满足条件，则删除参数
    filterList.forEach((key) => {
      if (searchParams.get(key)) {
        searchParams.delete(key)
      }
    })
  }

  const newUrl =
    baseUrl + (searchParams.toString() ? `?${searchParams.toString()}` : '')

  // 使用 history.replaceState 替换当前的历史状态，而不刷新页面
  history.replaceState(history.state, '', newUrl)
}

/**
 * @description 获取URL参数
 */
export function getUrlParams() {
  // 获取查询参数部分
  const queryString = window.location.href.split('?')[1]

  // 解析查询参数 urlParams.get('id')
  const urlParams = new URLSearchParams(queryString)

  // 获取所有参数
  const allParams = {}
  urlParams.forEach((value, key) => {
    allParams[key] = value
  })
  return allParams
}

/**
 * 使用canvas获取文本实际宽度
 * @param {string} text 文本
 * @param {object} options 字体相关选项配置
 * @returns
 */
export function getActualWidthOfChars(text = '', options = {}) {
  const { size = 12, family = 'Microsoft YaHei' } = options
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `${size}px ${family}`
  const metrics = ctx.measureText(text)
  return (
    Math.abs(metrics.actualBoundingBoxLeft) +
    Math.abs(metrics.actualBoundingBoxRight)
  )
}

/**
 * 判断是否是外部
 * @param {string} path 路径
 * @param {boolean} isNeed 需要判断 /external|external
 * @returns {Boolean}
 */
export function isExternal(path, isNeed = true) {
  const regx = new RegExp(
    `^(https?:|mailto:|tel:${isNeed ? '|\\/?external' : ''})`
  )
  return regx.test(path)
}

// 按字母排序
export function alphabetSort(a, b, key = '') {
  return a[key].localeCompare(b[key])
}

/**
 * @desc 锚点滚动处理
 * @param {Array} links id集合
 * @param {DOMRect} containerRect 容器元素的DOMRect
 * @returns {Object}
 */
export function anchorPointScrollHandler(links, containerRect) {
  const linkRange = []
  links.forEach((item) => {
    const target = document.getElementById(item)
    const targetRect = target?.getBoundingClientRect()
    const top = targetRect?.top
    const containerTop = containerRect?.top
    const bottom = targetRect?.bottom
    const containerBottom = containerRect?.bottom
    let h = 0
    if (top >= containerTop && top < containerBottom) {
      if (bottom > containerBottom) {
        h = containerBottom - top
      } else {
        h = bottom - top
      }
    } else if (containerTop > top) {
      if (bottom >= containerBottom) {
        h = containerBottom - containerTop
      } else if (bottom > containerTop && bottom < containerBottom) {
        h = bottom - containerTop
      }
    }
    linkRange.push({ height: h, link: item })
  })
  const res = maxBy(linkRange, 'height')
  return res
}

/**
 * @desc 属性（事件指标）详情的hover信息展示处理
 * @param {Number} contentRectWidth 容器宽度
 * @param {Object} tootipRectStyle 气泡弹窗
 * @param {Number} panelHeight 属性（事件）列表容器区域高度
 * @param {EventTarget} e 事件target
 * @returns {Object}
 */
export function descShowHandler(
  contentRectWidth,
  tootipRectStyle,
  panelHeight,
  e
) {
  let tootipRectWidth = tootipRectStyle.width
  tootipRectWidth = parseInt(tootipRectWidth) || 0
  if (!contentRectWidth || !tootipRectWidth) return
  let styleObj = {
    left: `${contentRectWidth + 2}px`,
  }
  // 左侧、右侧剩余空间
  const leftSpace = e.pageX - e.layerX
  const rightSpace = document.body.clientWidth - leftSpace - contentRectWidth
  // 左侧空间富余，右侧空间不足展示在左侧
  if (leftSpace > tootipRectWidth && rightSpace < tootipRectWidth) {
    styleObj = {
      right: `${contentRectWidth}px`,
    }
  }
  let tootipRectHeight = tootipRectStyle.height
  tootipRectHeight = parseInt(tootipRectHeight) || 0
  let panelRectHeight = panelHeight
  panelRectHeight = parseInt(panelRectHeight) || 0
  // 改变top位置；当top+自身高度超过总高度是不设置top，按默认bottom为0
  if (panelRectHeight - e.layerY > tootipRectHeight) {
    styleObj = {
      ...styleObj,
      top: `${e.layerY}px`,
      bottom: 'unset',
    }
  }
  return styleObj
}

/**
 * 返回指定位数的随机数
 * @param {number} length
 * @param {boolean} AZFlag
 * @returns {string} code
 */
export function getRandom(length = 1, AZFlag = false) {
  let characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  if (AZFlag) {
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + characters
  }
  return Array.from(
    { length },
    () => characters[Math.floor(Math.random() * characters.length)]
  ).join('')
}

/**
 * @description 处理数字输入
 * @param {Object} options - 选项
 * @param {Number | String} options.v - 输入的值
 * @param {Number | String} [options.decimal=2] - 允许的小数点位数，默认为2
 * @param {Number | String} [options.initial=0] - 默认值
 // * @param {Boolean} [options.change=false] - 是否触发change事件，默认为false
 * @returns {string} 处理后的数字字符串
 */
export function numberInputProcessing({ v, decimal = 2, initial = '0' }) {
  v = v + ''
  /* if (change) {
    if (isNaN(parseFloat(v))) return ''
    // v = parseFloat(v)
    v = v.replace(/^\d*\.$/g, v.match(/(\d*)/g)[0])
    // 获取除了0 后面的所有值
    v = /^0\d/g.test(v) ? v.match(/(?<=^0)(\d.*)/g)[0] : v
  } else {*/
  // 0开头不能出现多个
  v = v.replace(/^0{2,}/g, '0')
  // 把非数字的都替换掉，除了数字和.
  v = v.replace(/[^\d.]/g, '')
  // 保证只有出现一个.而没有多个.
  v = v.replace(/\.{2,}/g, '.')
  // 必须保证第一个为数字而不是.
  v = v.replace(/^\./g, '')
  // 保证.只出现一次，而不能出现两次以上
  v = v.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.')
  // 可输入的小数点位数 动态配置 默认2位
  v = v.replace(new RegExp(`^(-)*(\\d+)\\.(\\d{${decimal}}).*$`), '$1$2.$3')
  v = v.replace(/^\d*\.$/g, v.match(/(\d*)/g)[0])
  // 获取除了0 后面的所有值
  v = /^0\d/g.test(v) ? v.match(/(?<=^0)(\d.*)/g)[0] : v
  // }
  return v === '' ? initial : v
}

/**
 *数据展示精度处理
 *@param {number} num -数值
 *@param {number} [precision=12] -精度
 */
export function strip(num, precision = 12) {
  if (!num || typeof num !== 'number') return num
  if (!precision || typeof precision !== 'number') {
    precision = 12
  }
  return +parseFloat(num.toPrecision(precision))
}

/**
 *数值千分位处理处理
 *@param {number} cellValue -数值
 */
export function thousandsFilter(cellValue) {
  if (typeof cellValue === 'number') {
    if (cellValue > 999 || cellValue < -999) {
      const newVal = cellValue.toLocaleString('en-us', {
        maximumSignificantDigits: 20,
      })
      return newVal // 传入数字，返回字符串
    } else {
      return cellValue
    }
  } else {
    return cellValue
  }
}

export function getLocalValue(key) {
  return localStorage.getItem(key)
}

export function setLocalValue(key, val) {
  return localStorage.setItem(key, val)
}

export function removeLocalValue(key) {
  return localStorage.removeItem(key)
}

export function getPercentColor(percent = 0) {
  let color = ''
  if (percent >= 85) {
    color = '#6D87EB'
  } else if (percent >= 70 && percent < 85) {
    color = '#879CEF'
  } else if (percent >= 55 && percent < 70) {
    color = '#A1B2F2'
  } else if (percent >= 40 && percent < 55) {
    color = '#BAC7F6'
  } else if (percent >= 25 && percent < 40) {
    color = '#D4DCF9'
  } else if (percent >= 10 && percent < 25) {
    color = '#EDF1FD'
  }
  return color
}

// 随机生成#开头的颜色
export function generateRandomColor() {
  const characters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += characters[Math.floor(Math.random() * 16)]
  }
  return color
}

const weekDayList = ['日', '一', '二', '三', '四', '五', '六']
const weekDayListEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
/**
 * @description: 将日期转换成日期(星期几)
 * @description ex: YYYY-MM-DD to YYYY-MM-DD(星期几)
 * @return {string} YYYY-MM-DD(星期几)
 * @param {Date} date
 */
export function dateToDateWithWeek(date) {
  const valid = dayjs(date, 'YYYY-MM-DD', true).isValid()
  if (!valid) return date

  const en = i18n.global.locale === 'en'
  const week = en
    ? weekDayListEn[dayjs(date).day()]
    : weekDayList[dayjs(date).day()]
  return `${date}(${week})`
}

/**
 * @description: 将日期(星期几)转换成日期
 * @description ex: YYYY-MM-DD(星期几) to YYYY-MM-DD
 * @return {*}
 * @param {string} dateStr
 */
export function dateWithWeekToDate(dateStr) {
  // eslint-disable-next-line no-useless-escape
  const pattern = /^\d{4}-\d{2}-\d{2}\([^\)]{1,}\)$/
  const isDateWithDay = pattern.test(dateStr)
  const isValid = dayjs(dateStr).isValid()
  const date =
    isDateWithDay && isValid ? dayjs(dateStr).format('YYYY-MM-DD') : dateStr
  return date
}

/**
 * @description: 日期与日期(星期几)相互转换
 * @return {*}
 * @param {Date} date
 * @param {Boolean} type  false: 默认是日期转换为日期(星期几)  true: 日期转换为日期(星期几)
 */
export function formatDateWithWeek(date, type = false) {
  return type ? dateWithWeekToDate(date) : dateToDateWithWeek(date)
}

/**
 * @description: 是否符合可创建分群和点击用户序列的数字
 * @return {*}
 */
export function isValidNumByCluster(num) {
  return !isNaN(num) && parseFloat(num) > 0
}
