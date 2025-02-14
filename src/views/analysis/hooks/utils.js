import {
  getActualWidthOfChars,
  thousandsFilter,
  getPercentColor,
} from '@/utils'
import { chartColor } from '@/enumeration/chart'
import dayjs from 'dayjs'
import { groupBy, isObject } from 'lodash-es'
import { t } from '@/locales/i18n'

export const delimiter = '\n'

export const customExtraCssText = `z-index: 99;
max-height:300px;overflow-y:auto;padding:10px 16px;
box-shadow:0px 10px 20px 1px rgba(12,17,29,0.14)`

// round 值与对应保留小数位数
export const roundObj = { 3: 4, 4: 6 }

export const chartTypeList = [
  { value: 1, title: t('chart.trend'), icon: 'chart-trend' },
  { value: 4, title: t('chart.lineStack'), icon: 'chart-heapup' },
  { value: 7, title: t('chart.barStack'), icon: 'chart-stackbar' },
  { value: 2, title: t('chart.cumulative'), icon: 'chart-accumulation' },
  { value: 3, title: t('chart.scatter'), icon: 'chart-distribution' },
  { value: 5, title: t('chart.pie'), icon: 'chart-pie' },
]

export const lineType = ['solid', 'dotted', 'dashed']

export function toolTipSvg(index, color, type = 'line') {
  return {
    line: [
      `<path id="实线" d="M23,1H0V-1H23Z" transform="translate(0 1)" fill="${color}"/>`,
      `<path id="短虚线" d="M22,1H18V-1h4ZM16,1H12V-1h4ZM10,1H6V-1h4ZM4,1H0V-1H4Z" transform="translate(0 1)" fill="${color}"/>`,
      `<path id="长虚线" d="M23,1H13V-1H23ZM11,1H0V-1H11Z" transform="translate(0 1)" fill="${color}"/>`,
    ],
  }[type][index]
}

// 事件分析通用的 echarts 的options
export const initOptions = () => ({
  animation: true,
  color: chartColor,
  tooltip: {
    trigger: 'item',
    extraCssText: customExtraCssText,
    confine: true,
    enterable: true,
    formatter: customFormatter,
  },
  toolbox: {
    show: true,
    right: '2%',
    top: '4%',
    feature: {},
  },
  legend: {
    bottom: '0%',
    type: 'scroll',
    show: true,
    data: [],
  },
  xAxis: {
    axisTick: {
      show: false,
    },
    axisLine: {
      lineStyle: {
        color: '#ccc',
      },
    },
    axisLabel: {
      color: '#000',
    },
    axisPointer: {
      show: true,
      type: 'line',
      label: {
        show: false,
      },
    },
    type: 'category',
    data: [],
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      show: true,
      formatter: '{value}',
    },
  },
  series: [],
  grid: {
    top: '10%',
    left: '3%',
    right: '3%',
    bottom: '12%',
    containLabel: true,
  },
})

// 事件分析的 echarts 通用饼状图的options
export const initPieOptions = (titleText) => ({
  title: {
    text: titleText,
    show: true,
    left: 'center',
    textStyle: {
      fontWeight: 'normal',
      fontSize: '20px',
      color: '#1C2028',
    },
  },
  tooltip: {
    trigger: 'item',
    extraCssText: 'z-index: 99',
    confine: true,
    formatter(params) {
      return `<div class="flex-center">
      <span style="display:inline-block;border-radius:50%;width:8px;height:8px;background-color:${
        params.color
      }"></span>
        <span class="fz12  c545e6e ml5" >${params.name.replace('\n', ',')}：</span>
        <span class="fz12  c545e6e">${thousandsFilter(params.value)}</span>
    </div>`
    },
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      label: {
        formatter: '{b}\n{d}%',
        position: 'outer',
        color: '#545e6e',
        alignTo: 'labelLine',
      },
      emphasis: {
        focus: 'self',
      },
      data: [],
    },
  ],
})

//tootip 通用格式化函数
export function customFormatter(params) {
  const name = params[0].name
  let showText = `<div style="margin: 0px;">
                      <div style="font-size:12px;color:#86919d;line-height:1;">${name}</div>
                      <div style="margin: 0px 0 0;line-height:1;">`
  params.forEach((item) => {
    showText += `<div style="margin: 10px 0 0;line-height:1;">
                      <div style="margin: 0px 0 0;line-height:1;">
                        ${item.marker}
                        <span style="font-size:12px;color:#545e6e;margin-left:2px">${
                          item.seriesName
                        }</span>
                        <span style="float:right;margin-left:20px;font-size:12px;color:#545e6e;">
                          ${
                            item.data.round === 2
                              ? item.value + '%'
                              : item.value
                          }
                        </span>
                      </div>
                      <div style="clear:both"></div>
                    </div>`
  })
  showText += `</div><div style="clear:both"></div></div>`
  return showText
}

// 单个tootip格式化函数
export function toolTipFormatter(params, round) {
  const showVal =
    round === 2 ? `${params.value}%` : thousandsFilter(params.value)
  const showText = `
                    <div style="font-size:12px;color:#86919d;line-height:1;">${params.name}</div>
                    <div style="margin: 10px 0 0;line-height:1;">
                      <div style="margin: 0px 0 0;line-height:1;">
                        ${params.marker}
                        <span style="font-size:12px;color:#545e6e;margin-left:2px">${params.seriesName}</span>
                        <span style="float:right;margin-left:20px;font-size:12px;color:#545e6e;">${showVal}</span>
                      </div>
                      <div style="clear:both"></div>
                    </div>`
  return showText
}

export function trendAndCumulativeFormatter(params, versusBool) {
  let html = ''
  // 数组是多个查看，对象是单个查看
  if (Array.isArray(params)) {
    const keys = groupBy(params, versusBool ? 'seriesName' : 'name')
    Object.keys(keys).forEach((k) => {
      const v = keys[k]
      html += `<div class="fz12  c545e6e">${k}</div>`
      v.forEach((item, index) => {
        html += `
       <div class="flex-center">
       <svg xmlns="http://www.w3.org/2000/svg" width="23" height="2" viewBox="0 0 23 2">
         ${toolTipSvg(item.data.dateIndex, item.color)}
       </svg>
      <span class="fz12  c545e6e ml5">
       ${
         versusBool
           ? item.name.split(delimiter)[item.data.dateIndex]
           : item.seriesName
       }：
       </span>
         <span class="fz12  c545e6e">${
           item.data.round === 2
             ? `${item.value}%`
             : thousandsFilter(item.value)
         }</span>
     </div>`
      })
    })
  } else {
    html = `<div class="fz12  c86919d">${
      params.name.split(delimiter)[params.data.dateIndex]
    }</div>`
    html += `
   <div class="flex-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="2" viewBox="0 0 23 2">
         ${toolTipSvg(params.data.dateIndex, params.color)}
        </svg>
        <span class="fz12  c545e6e ml5">${params.seriesName}：</span>
         <span class="fz12  c545e6e">${
           params.data.round === 2
             ? `${params.value}%`
             : thousandsFilter(params.value)
         }</span>
   </div>`
  }
  return html
}

export function distributedFormatter(params) {
  let html = ''
  // 数组是多个查看，对象是单个查看
  if (Array.isArray(params)) {
    const keys = groupBy(params, 'name')
    Object.keys(keys).forEach((k) => {
      const v = keys[k]
      html += `<div class="fz12  c545e6e">${k}</div>`
      v.forEach((item, index) => {
        html += `
             <div class="flex-center">
           <span class="mr5" style="display:inline-block;width:8px;height:8px;background-color:${
             item.color
           }"></span>
            <span class="fz12  c545e6e">
             ${item.seriesName}：
             </span>
             <span class="fz12  c545e6e">${
               item.data.round === 2
                 ? `${item.value}%`
                 : thousandsFilter(item.value)
             }</span>
           </div>`
      })
    })
  } else {
    html = `
            <div class="fz12 c86919d">${params.name}</div>
              <div class="flex-center">
                   <span class="mr5" style="display:inline-block;width:8px;height:8px;background-color:${
                     params.color
                   }"></span>
                   <span class="fz12  c545e6e">${params.seriesName}：</span>
                   <span class="fz12  c545e6e">${
                     params.data.round === 2
                       ? `${params.value}%`
                       : thousandsFilter(params.value)
                   }</span>
              </div>
            `
  }
  return html
}

export const dataZoomOption = {
  realtime: false,
  type: 'slider',
  show: true,
  xAxisIndex: [0],
  // realtime: false,
  filterMode: 'filter',
  // zoomLock: true,
  brushSelect: false,
  // throttle: 300,
  bottom: 0,
  start: 0,
  end: 100,
  // left: '10%',
  // right: '10%',
  // width: '90%',
  // rangeMode: ['value', 'value'],
  // handleSize: 0,
  showDetail: false,
  showDataShadow: false,
  height: '4%',
}

export function fillData(data, key = 'comparedDate') {
  // 找到最大长度
  const maxLength = Math.max(...data.map((arr) => arr.length))
  // 生成每列的数组
  const columns = []
  for (let i = 0; i < maxLength; i++) {
    const column = data.map((arr) => {
      if (i < arr.length) {
        return arr[i][key]
      } else {
        return '-'
      }
    })
    columns.push(column.join(delimiter))
  }
  return columns
}

export function needPercentSign(num, bool) {
  return isNaN(num) ? num : bool ? num / 100 : `${num}%`
}

// 添加周六、周日标注  xAxisData = vs时的日期
export const setWeekEndMark = (dateArr = [], list, xAxisData) => {
  const len = dateArr.length
  if (!len) return list
  const weekEndDate = []
  for (let i = 0; i < len; i++) {
    const item = dateArr[i]
    const isValid = dayjs(item).isValid()
    const weekday = dayjs(item).isoWeekday()
    if (isValid && [6, 7].includes(weekday)) {
      const title = weekday === 6 ? '周六' : '周日'
      weekEndDate.push({
        title,
        date: xAxisData ? xAxisData[i] : item,
      })
    }
  }

  if (weekEndDate.length && list.length) {
    list.forEach((item) => {
      // 周末的显示竖线
      item.markLine = {
        silent: true,
        symbol: ['none', 'none'],
        lineStyle: {
          type: 'solid',
          color: '#e5e5e5',
          width: 2,
        },
        label: {
          color: '#409eff',
          formatter: '',
        },
        data: weekEndDate.map((el) => ({ name: el.title, xAxis: el.date })),
      }
    })
  }
  return list
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

export const sortTypeValues = ['ascend', 'descend', 'azAscend', 'azDescend']

const numReg = /\[([0-9]+[.[0-9]+]?|-∞)(~|,)([0-9]+[.[0-9]+]?|\+∞)\)/

// 排序比较方法
export function comparatorMethods(type, groupDataMap) {
  let comparator = ''
  switch (type) {
    case 'ascend':
      comparator = (a, b) => {
        const valA = groupDataMap[a] === undefined ? 0 : groupDataMap[a]
        const valB = groupDataMap[b] === undefined ? 0 : groupDataMap[b]
        return valA - valB
      }
      break
    case 'descend':
      comparator = (a, b) => {
        const valA = groupDataMap[a] === undefined ? 0 : groupDataMap[a]
        const valB = groupDataMap[b] === undefined ? 0 : groupDataMap[b]
        return valB - valA
      }
      break
    case 'azAscend':
      comparator = (a, b) => {
        const aString = typeof a === 'string' ? a.split(',')[0] : ''
        const bString = typeof b === 'string' ? b.split(',')[0] : ''

        if (numReg.test(aString) || numReg.test(bString)) {
          let matchA = aString.replace(numReg, '$1')
          let matchB = bString.replace(numReg, '$1')
          matchA = isNaN(matchA) ? -Infinity : matchA
          matchB = isNaN(matchB) ? -Infinity : matchB
          return matchA - matchB
        } else if (
          !isNaN(aString) &&
          !isNaN(bString) &&
          a === aString &&
          b === bString
        ) {
          return aString - bString
        } else {
          return a.localeCompare(b)
        }
      }
      break
    case 'azDescend':
      comparator = (a, b) => {
        const aString = typeof a === 'string' ? a.split(',')[0] : ''
        const bString = typeof b === 'string' ? b.split(',')[0] : ''
        if (
          /\[[0-9]+|-∞(~|,)[0-9]+|\+∞\)/.test(aString) ||
          /\[[0-9]+|-∞(~|,)[0-9]+|\+∞\)/.test(bString)
        ) {
          let matchA = aString.replace(numReg, '$1')
          let matchB = bString.replace(numReg, '$1')
          matchA = isNaN(matchA) ? -Infinity : matchA
          matchB = isNaN(matchB) ? -Infinity : matchB
          return matchB - matchA
        } else if (
          !isNaN(aString) &&
          !isNaN(bString) &&
          a === aString &&
          b === bString
        ) {
          return bString - aString
        } else {
          return b.localeCompare(a)
        }
      }
      break

    default:
      break
  }
  return comparator
}

// 查找指标在 unionGroups中不存在的分组
export function getNoneGroups(items, unionGroups) {
  const res = []
  if (Array.isArray(unionGroups) && Array.isArray(items)) {
    unionGroups = [...new Set(unionGroups)]
    const groupMap = {}
    for (const g of unionGroups) {
      groupMap[g] = 0
    }
    for (const i of items) {
      if (i.groupCols !== undefined && groupMap[i.groupCols] !== undefined) {
        groupMap[i.groupCols] += 1
      }
    }
    for (const k in groupMap) {
      if (groupMap[k] === 0) {
        res.push(k)
      }
    }
  }
  return res
}

// 根据数据量排序分组
export function getGroupOrderByAmount(dataCache, versus = []) {
  const groupDataMap = {}
  dataCache.y.forEach((cache) => {
    if (cache.item && Array.isArray(cache.item) && cache.item.length > 0) {
      cache.item.forEach((dataItem) => {
        if (dataItem.groupCols) {
          let totalNum = 0
          if (versus.length) {
            if (
              Array.isArray(dataItem.values_compared_list[0]) &&
              dataItem.values_compared_list[0].length > 0
            ) {
              // 取第一阶段的数据
              totalNum = dataItem.values_compared_list[0].reduce(
                (acc, cur) => (acc += cur.comparedValue),
                0
              )
            }
          } else {
            if (Array.isArray(dataItem.values) && dataItem.values.length > 0) {
              totalNum = dataItem.values.reduce((acc, cur) => acc + cur, 0)
            }
          }
          if (groupDataMap[dataItem.groupCols]) {
            groupDataMap[dataItem.groupCols] += totalNum
          } else {
            groupDataMap[dataItem.groupCols] = totalNum
          }
        }
      })
    }
  })
  return groupDataMap
}

export function dataSegmentation(data = '', key = delimiter) {
  return (data + '').split(key)
}
// 表格差异率计算
export function diffCalculation(data) {
  let [num1, num2] = dataSegmentation(data).map((item) =>
    Number.parseFloat(item)
  )
  // 计算差异率
  let val = (((num1 - num2) / (num2 === 0 ? 100 : num2)) * 100).toFixed(2)
  if (isNaN(val)) return '-'
  return val
}

// 阶段导出
export function stageExportByDate(columns, data) {
  const indicatorIndex = columns.indexOf('指标') + 1
  columns.splice(indicatorIndex, 0, '时间段')
  return {
    columns,
    columnsData: data.flatMap((item) => {
      const pre = item.slice(0, indicatorIndex)
      const last = item.slice(indicatorIndex)
      const values = last.map((v) => dataSegmentation(v))
      const dataRows = [
        [...pre, '原始', ...values.map((item) => item[0])],
        [...pre, '对比', ...values.map((item) => item[1])],
        [
          ...pre,
          '差异率',
          ...last.map((item) => {
            return `${diffCalculation(item)}${
              isNaN(diffCalculation(item)) ? '' : '%'
            }`
          }),
        ],
      ]
      return dataRows
    }),
  }
}

export function stageExportByEventAndGrounp(columns, data, sourceColumns) {
  const indicatorIndex = sourceColumns.findIndex((item) => item.showDiff)
  // 根据下标映射生成新的字段数组
  const mappedHeaders = columns.flatMap((header, index) => {
    if (index >= indicatorIndex) {
      return [`${header}(原始/对比)`, `${header}(差异率)`]
    }
    return header
  })

  return {
    columns: mappedHeaders,
    columnsData: data.map((item) => {
      return item.flatMap((subItem, subIndex) => {
        if (subIndex < indicatorIndex) return subItem
        const diff = diffCalculation(subItem)
        return [subItem, `${diff}${isNaN(diff) ? '' : '%'}`]
      })
    }),
  }
}

export function formatJson(filterVal, jsonData) {
  return jsonData.map((v) =>
    filterVal.map((j, i) => {
      if (j !== 'name') {
        return v[`col_${i}`]
      }
      return v[j]
    })
  )
}

export function ltvToolTipFormatter(
  params,
  showPercent = false,
  isGroup = false
) {
  const paramsData = Array.isArray(params) ? params : [params]
  const name = paramsData?.[0].name ?? ''
  let showText = `<div class="fz12  c86919d">${name}</div>`
  const len = paramsData.length
  paramsData.forEach((item) => {
    showText += `${item.marker} <span class="fz12 c545e6e">${
      len > 1 || isGroup ? item.seriesName + ' ：' : ''
    }</span>
                  <span class="fz12 c545e6e">
                  ${
                    !isNaN(item.value)
                      ? showPercent
                        ? item.value + '%'
                        : item.value
                      : '-'
                  }</span><br>`
  })
  return showText
}

//留存分析按照百分比设置表格单元格的颜色
export function setRetentionCellStyle(data) {
  const { row, rowIndex, $rowIndex, column, columnIndex, $columnIndex } = data
  let style = { color: '#545E6E' }
  if (row[`col_${columnIndex}_per`] && row[`col_${columnIndex}_per`] !== '-') {
    const per = parseFloat(row[`col_${columnIndex}_per`])
    const pColor = getPercentColor(per)
    if (pColor) {
      style = { 'background-color': pColor, color: '#1C2028' }
    }
  }
  return style
}

//获取指标中的事件(事件分析、漏斗分析、分布分析)
export function getIndexEventName(events = []) {
  // 事件
  let allEvents = []
  if (Array.isArray(events)) {
    // 初始用户指标和同时展示需要特殊处理 initialEvent 和 userAction
    for (const item of events) {
      // 判断是否是自定义指标
      if (Array.isArray(item?.customIndex)) {
        for (const data of item.customIndex) {
          allEvents.push(data.eventName)
        }
      } else {
        allEvents.push(item.eventName)
      }
    }
  } else if (isObject(events)) {
    // 判断是否是自定义指标
    if (Array.isArray(events?.customIndex)) {
      for (const data of events.customIndex) {
        allEvents.push(data.eventName)
      }
    } else {
      allEvents.push(events.eventName)
    }
  }
  allEvents = [...new Set(allEvents)]
  return {
    // 用于探索里获取条件的请求参数
    conditionEventNames: allEvents.join(','),
    // 用于探索里获取分组的请求参数
    groupEventNames: allEvents.join(','),
    // 用于删除条件分组如事件/用户属性等
    groupLimit: [],
    conditionLimit: [],
  }
}
