<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { cloneDeep, debounce } from 'lodash-es'
import chartUtils from '@/utils/chart'
import { getPercentColor } from '@/utils'
import { t } from '@/locales/i18n'

const props = defineProps({
  headers: {
    //字段集合
    type: Array,
    default: () => [],
  },
  rows: {
    // 数据集合
    type: Array,
    default: () => [],
  },
  config: {
    type: Object,
    default: () => {},
  },
  settings: {
    type: Object,
    default: () => {},
  },
  graphType: {
    // 图表类型
    type: Number,
    default: 1,
  },
  showBtn: {
    //是否显示头部按钮
    type: Boolean,
    default: true,
  },
  showChartLabel: {
    //是否显示数值
    type: Boolean,
    default: false,
  },
  titleFlag: {
    //是否显示标题
    type: Boolean,
    default: true,
  },
  graphTypeFlag: {
    //是否显示类型切换组件
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'update:graphType',
  'update:showChartLabel',
  'changGraphType',
  'changShowChartLabel',
  'getSortArr',
])

const graphTypeNew = computed({
  get: () => {
    return props.graphType
  },
  set: (val) => {
    emit('changGraphType', val)
    emit('update:graphType', val)
    getEchartsOptionsDebounce()
  },
})

const showChartLabelNew = computed({
  get: () => {
    return props.showChartLabel
  },
  set: (val) => {
    emit('changShowChartLabel', val)
    emit('update:showChartLabel', val)
    getEchartsOptionsDebounce('showChartLabel')
  },
})

const state = reactive({
  chartTypeList: [
    { value: 1, title: t('chart.trend'), icon: 'chart-trend' },
    { value: 4, title: t('chart.lineStack'), icon: 'chart-heapup' },
    { value: 3, title: t('chart.scatter'), icon: 'chart-distribution' },
    { value: 7, title: t('chart.barStack'), icon: 'chart-stackbar' },
    { value: 20, title: t('chart.combination'), icon: 'chart-distribution' },
    { value: 5, title: t('chart.pie'), icon: 'chart-pie' },
    { value: 6, title: t('chart.dataTable'), icon: 'chart-table' },
  ],
  columns: [],
  tableData: [],
  sortArr: [],
})

watch(
  () => props.config,
  (newVal) => {
    if (newVal && JSON.stringify(newVal) !== '{}') {
      getEchartsOptionsDebounce()
    }
  },
  { deep: true }
)

watch(
  () => props.settings,
  (newVal) => {
    if (newVal && JSON.stringify(newVal) !== '{}') {
      getEchartsOptionsDebounce()
    }
  },
  { deep: true }
)

watch(
  () => props.headers,
  (newVal) => {
    if (newVal && JSON.stringify(newVal) !== '[]') {
      getEchartsOptionsDebounce()
    }
  },
  { deep: true }
)

watch(
  () => props.rows,
  (newVal) => {
    if (newVal && JSON.stringify(newVal) !== '[]') {
      getEchartsOptionsDebounce()
    }
  },
  { deep: true }
)

const colorList = [
  '#5674e5',
  '#2acc5c',
  '#fd9e33',
  '#f36b6e',
  '#59C6F1',
  '#9B59C2',
  '#5BEABE',
  '#F99D7E',
  '#F35787',
  '#5CD8E6',
  '#AFDC30',
  '#DB5BD2',
  '#DBA85B',
]
const opt = {
  color: colorList,
  tooltip: {
    trigger: 'item',
    hideDelay: 50,
    extraCssText: 'z-index: 99; max-height: 600px;overflow-y:auto',
    enterable: true, // 鼠标可进入提示框浮层中
    confine: true, // 将 tooltip 框限制在图表的区域内
  },
  legend: {
    bottom: '7%',
    type: 'scroll',
    show: true,
    data: [],
    selected: null,
  },
  grid: {
    height: '75%',
    top: '10%',
    left: '3%',
    right: '3%',
    bottom: '10%',
    containLabel: true,
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
      /* width: 30,
            overflow: 'truncate',*/
    },
    type: 'category',
    data: [],
    axisPointer: {
      // 单个展示增加配置
      show: true,
      type: 'line',
      label: {
        show: false,
      },
    },
  },
  yAxis: [
    {
      type: 'value',
      axisLabel: {
        show: true,
        formatter: '{value}',
      },
    },
  ],
  series: [
    {
      data: [],
      type: 'bar',
      barMaxWidth: 40,
    },
  ],
}

const options = ref(cloneDeep(opt))

const chartRef = ref(null)

const numReg = /(\[|\()(\d+(\.\d+)?|-∞)(~|,)(\d+(\.\d+)?|\+?∞)\)/
const strNumReg = /^(-|\+)?\d+(\.\d+)?$/

/**
 * @description 排序
 */
const fileSort = (data, i, type) => {
  return data.sort((a, b) => {
    a = a[i]
    b = b[i]
    let valA, valB

    if (numReg.test(a)) {
      if (['-∞', '+∞'].includes(a.replace(numReg, '$2'))) {
        if (a.replace(numReg, '$2') === '+∞') {
          valA = Infinity
        } else {
          valA = -Infinity
        }
      } else {
        valA = a.replace(numReg, '$2')
      }
    } else {
      valA = a
    }
    if (numReg.test(b)) {
      if (['-∞', '+∞'].includes(b.replace(numReg, '$2'))) {
        if (b.replace(numReg, '$2') === '+∞') {
          valB = Infinity
        } else {
          valB = -Infinity
        }
      } else {
        valB = b.replace(numReg, '$2')
      }
    } else {
      valB = b
    }
    if (valA === '未知') {
      valA = ''
    }
    if (valB === '未知') {
      valB = ''
    }
    if (type === 'ascend') {
      // 升序
      if (
        typeof valA === 'string' &&
        typeof valB === 'string' &&
        (!numReg.test(a) || !numReg.test(b))
      ) {
        if (strNumReg.test(valA) || strNumReg.test(valB)) {
          return valA - valB
        } else {
          return valA.localeCompare(valB)
        }
      } else {
        return valA - valB
      }
    } else if (type === 'descend') {
      // 降序
      if (
        typeof valA === 'string' &&
        typeof valB === 'string' &&
        (!numReg.test(a) || !numReg.test(b))
      ) {
        if (strNumReg.test(valA) || strNumReg.test(valB)) {
          return valB - valA
        } else {
          return valB.localeCompare(valA)
        }
      } else {
        return valB - valA
      }
    }
  })
}

const resTableRef = ref()

const getSortArr = (arr) => {
  emit('getSortArr', arr)
}

/**
 * X、ChildX、Y、RY计算处理
 */
const graphChartCompute = ({
  dataX,
  dataValX,
  dataChildX,
  dataValChildX,
  dataY,
  groupYGroup,
  computeObjArr,
  computeKeys,
  sortColumns,
}) => {
  // X轴根据排序字段排序
  const cloneRows = cloneDeep(props.rows)
  if (!props.config.groupX.every((e) => e.sort[0] === 'cancel')) {
    let i, type
    props.config.groupX.forEach((x) => {
      if (x.sort[0] !== 'cancel') {
        type = x.sort[0]
        i = props.headers.findIndex((name) => name.split(',')[0] === x.name)
      }
    })
    fileSort(cloneRows, i, type)
  }
  // X轴获取未去重数据集合
  cloneRows.forEach((item) => {
    const xName = []
    props.config.groupX.forEach((x) => {
      const i = props.headers.findIndex((e) => e.split(',')[0] === x.name)
      xName.push(item[i] === null ? '(null)' : item[i])
    })
    dataX.push(xName)
  })
  // 过滤null跟重复集合名称
  dataX.forEach((item) => {
    if (
      dataValX.every(
        (itemVal) => JSON.stringify(item) !== JSON.stringify(itemVal)
      ) &&
      item.every((item) => item !== '(null)')
    ) {
      dataValX.push(item)
    }
  })

  if (props.config.groupChildX && props.config.groupChildX.length) {
    cloneRows.forEach((item) => {
      const ChildXName = []
      props.config.groupChildX.forEach((x) => {
        const i = props.headers.findIndex((e) => e.split(',')[0] === x.name)
        ChildXName.push(item[i] === null ? '(null)' : item[i])
      })
      dataChildX.push(ChildXName)
    })
    // 过滤null跟重复集合名称
    dataChildX.forEach((item) => {
      if (
        dataValChildX.every(
          (itemVal) => JSON.stringify(item) !== JSON.stringify(itemVal)
        ) &&
        item.every((item) => item !== '(null)')
      ) {
        dataValChildX.push(item)
      }
    })
    // 子X轴分组排序
    if (!props.config.groupChildX.every((e) => e.sort[0] === 'cancel')) {
      let i, type
      props.config.groupChildX.forEach((x, index) => {
        if (x.sort[0] !== 'cancel') {
          type = x.sort[0]
          i = index
        }
      })
      fileSort(dataValChildX, i, type)
    }

    dataY.forEach((item) => {
      if (dataValChildX.length) {
        dataValChildX.forEach((items) => {
          groupYGroup.push({
            iconStatus: item.iconStatus,
            name: item.name,
            newName: items,
            newNameY: item.newName,
            numStatus: item.numStatus,
            value: item.value,
            sort: item.sort,
          })
        })
      } else {
        groupYGroup.push(item)
      }
    })
  } else {
    groupYGroup.push(...dataY)
  }
  // 计算值
  let computeObj = {}

  groupYGroup.forEach((item) => {
    const dataY = []
    const dataValY = []
    const dataValBoxY = {} // 去重暂存
    const i = props.headers.findIndex((e) => e.split(',')[0] === item.name)
    cloneRows.forEach((childItem) => {
      // number类型取原值，非number类型有值取1，无值取0
      dataY.push(
        typeof childItem[i] === 'number'
          ? childItem[i]
          : childItem[i] === undefined || childItem[i] === null
            ? 0
            : 1
      )
      dataValY.push(childItem[i])
    })
    // 计算
    const countObj = {}
    computeObj = {} // 计算
    dataX.forEach((name, index) => {
      if (name.length && name.every((item) => item === '(null)')) {
        // null集合名称不处理
        return
      }
      const nameStr = name.join(',')
      let groupChildXIndexs = []
      let isTrue = true
      if (props.config.groupChildX && props.config.groupChildX.length) {
        // 有子分组
        groupChildXIndexs = props.config.groupChildX.map((r) =>
          props.headers.findIndex((e) => e.split(',')[0] === r.name)
        )
        groupChildXIndexs.forEach((r, childXIndex) => {
          if (cloneRows[index][r] !== item.newName[childXIndex]) {
            isTrue = false
          }
        })
      }
      if (!isTrue) {
        if (!computeObj[nameStr]) {
          computeObj[nameStr] = 0
        }
      } else {
        // 求和 || 均值
        if (item.value[0] === 'sum' || item.value[0] === 'average') {
          if (
            computeObj[nameStr] !== undefined &&
            computeObj[nameStr] !== null
          ) {
            computeObj[nameStr] = computeObj[nameStr] + dataY[index]
          } else {
            computeObj[nameStr] = dataY[index]
          }
          if (item.value[0] === 'average') {
            if (
              (countObj[nameStr] === undefined || countObj[nameStr] === null) &&
              dataValY[index] === null
            ) {
              countObj[nameStr] = 0
            } else if (dataValY[index] !== null) {
              if (countObj[nameStr]) {
                countObj[nameStr] += 1
              } else {
                countObj[nameStr] = 1
              }
            }
          }
        }
        // 计数
        if (item.value[0] === 'count') {
          if (
            (computeObj[nameStr] === undefined ||
              computeObj[nameStr] === null) &&
            dataValY[index] === null
          ) {
            computeObj[nameStr] = 0
          } else if (dataValY[index] !== null) {
            if (computeObj[nameStr]) {
              computeObj[nameStr] += 1
            } else {
              computeObj[nameStr] = 1
            }
          }
        }
        // 去重计数
        if (item.value[0] === 'removalCount') {
          if (!dataValBoxY[nameStr]) {
            dataValBoxY[nameStr] = []
          }
          if (
            (computeObj[nameStr] === undefined ||
              computeObj[nameStr] === null) &&
            dataValY[index] === null
          ) {
            computeObj[nameStr] = 0
          } else if (dataValY[index] !== null) {
            if (computeObj[nameStr]) {
              if (!dataValBoxY[nameStr].includes(dataValY[index])) {
                computeObj[nameStr] += 1
              }
            } else {
              computeObj[nameStr] = 1
            }
            dataValBoxY[nameStr].push(dataValY[index])
          }
        }
        // 最大值
        if (item.value[0] === 'max') {
          if (
            computeObj[nameStr] !== undefined &&
            computeObj[nameStr] !== null
          ) {
            if (computeObj[nameStr] < dataY[index]) {
              computeObj[nameStr] = dataY[index]
            }
          } else {
            computeObj[nameStr] = dataY[index]
          }
        }
        // 最小值
        if (item.value[0] === 'min' && cloneRows[index][i] !== null) {
          if (
            computeObj[nameStr] !== undefined &&
            computeObj[nameStr] !== null
          ) {
            if (computeObj[nameStr] > dataY[index]) {
              computeObj[nameStr] = dataY[index]
            }
          } else {
            computeObj[nameStr] = dataY[index]
          }
        }
      }
    })

    // 均值
    if (item.value[0] === 'average') {
      for (const iterator in computeObj) {
        computeObj[iterator] = countObj[iterator]
          ? Number((computeObj[iterator] / countObj[iterator]).toFixed(2))
          : 0
      }
    }
    computeObjArr.push(computeObj)
  })
  // y轴排序
  if (!dataY.every((e) => e.sort[0] === 'cancel')) {
    let i, type
    dataY.forEach((y, index) => {
      if (y.sort[0] !== 'cancel') {
        type = y.sort[0]
        i = index
      }
    })
    const lists = []
    if (props.config.groupChildX && props.config.groupChildX.length) {
      // 有子分组
      computeObjArr.forEach((item, index) => {
        if (
          (computeObjArr.length / dataY.length) * i <= index &&
          (computeObjArr.length / dataY.length) * (i + 1) > index
        ) {
          for (const name in item) {
            if (
              lists.length &&
              lists.map((e) => Object.keys(e)[0]).includes(name)
            ) {
              const listIndex = lists.findIndex(
                (e) => Object.keys(e)[0] === name
              )
              lists[listIndex][name] += item[name]
            } else {
              const obj = {}
              obj[name] = item[name]
              lists.push(obj)
            }
          }
        }
      })
    } else {
      for (const name in computeObjArr[i]) {
        const obj = {}
        obj[name] = computeObjArr[i][name]
        lists.push(obj)
      }
    }
    lists.sort((a, b) => {
      if (type === 'ascend') {
        return Object.values(a)[0] - Object.values(b)[0]
      } else {
        return Object.values(b)[0] - Object.values(a)[0]
      }
    })
    sortColumns.push(...lists.map((e) => Object.keys(e)[0]))
  } else {
    computeKeys.push(...dataValX.map((e) => e.join(',')))
  }
}

/**
 * @scription 图表
 */
const graphChartMap = ({
  option,
  list,
  computeObjArr,
  computeKeys,
  dataValX,
  dataValChildX,
  groupYGroup,
  sortColumns,
}) => {
  // 饼状图
  if (
    graphTypeNew.value === 5 &&
    (props.config.groupChildX.length ||
      props.config.groupRY.length ||
      props.config.groupY.length > 1)
  ) {
    graphTypeNew.value = 1
  }
  let computeValues = []
  if (graphTypeNew.value === 5) {
    computeValues = []
    const column = sortColumns.length ? sortColumns : computeKeys
    column.forEach((item, index) => {
      computeValues.push({
        value: computeObjArr[0][item],
        name: item,
      })
    })
    options.value = Object.freeze({
      title: {
        text: groupYGroup[0].newName + `-${t('analysis.sqlquery.total')}`,
        show: true,
        left: 'center',
        textStyle: {
          fontWeight: 'normal',
          fontSize: '14px',
        },
      },
      tooltip: {
        trigger: 'item',
        extraCssText: 'z-index: 99',
        confine: true,
      },
      series: [
        {
          type: 'pie',
          top: 30,
          radius: ['40%', '70%'],
          label: {
            formatter: '{b}\n{d}%',
            position: 'outer',
          },
          emphasis: {
            focus: 'self',
          },
          data: computeValues,
        },
      ],
    })
    return false
  }

  const yAxisList = []
  let leftList = []
  let rightList = []
  groupYGroup.forEach((item, index) => {
    computeValues = []
    if (!sortColumns.length) {
      dataValX.forEach((name) => {
        computeValues.push(computeObjArr[index][name.join(',')])
      })
    } else {
      sortColumns.forEach((name) => {
        computeValues.push(computeObjArr[index][name])
      })
    }
    const obj = {
      type: 'line',
      data: computeValues,
      name:
        props.config.groupChildX &&
        props.config.groupChildX.length &&
        Array.isArray(item.newName)
          ? `${item.newName.join()}-${item.newNameY}`
          : item.newName,
      emphasis: {
        focus: 'series',
      },
      label: {
        show: props.settings.y?.label?.show,
        position: 'top',
      },
    }
    if (graphTypeNew.value === 4) {
      obj.areaStyle = {}
      obj.stack = t('analysis.event.total')
      obj.emphasis = {
        focus: 'series',
      }
    }
    if (graphTypeNew.value === 3) {
      obj.type = 'bar'
      obj.barMaxWidth = '40px'
      obj.stack =
        props.config.groupChildX &&
        props.config.groupChildX.length &&
        Array.isArray(item.newName)
          ? `${item.newName.join()}-${item.newNameY}`
          : item.newName
      obj.groupId = new Date().getTime()
    }
    if (graphTypeNew.value === 7) {
      obj.type = 'bar'
      obj.barMaxWidth = '40px'
      obj.stack = item.newNameY
    }
    if (graphTypeNew.value === 20) {
      if (item.graphType !== 1) {
        obj.type = 'bar'
        obj.barMaxWidth = '40px'
        obj.stack = item.newNameY
      }
    }
    if (
      (dataValChildX.length &&
        props.config.groupY.length * dataValChildX.length <= index) ||
      (!dataValChildX.length && props.config.groupY.length <= index)
    ) {
      // 有分组根据分组跟y轴组合长度判断是否有次y轴，无分组根据y轴判断是否有次y轴
      obj.yAxisIndex = 1
      obj.label.show = props.settings.ry?.label?.show
      rightList.push(...computeValues)
    } else {
      leftList.push(...computeValues)
    }
    list.push(obj)
    option.legend.data.push(
      props.config.groupChildX &&
        props.config.groupChildX.length &&
        Array.isArray(item.newName)
        ? `${item.newName.join()}-${item.newNameY}`
        : item.newName
    )
  })
  // 堆叠图Y轴最大值设置
  const leftSumList = []
  const rightSumList = []
  list.forEach((item, index) => {
    item.data.forEach((e, i) => {
      if (list[index].yAxisIndex !== 1) {
        // 有分组根据分组跟y轴组合长度判断是否有次y轴，无分组根据y轴判断是否有次y轴
        if (index === 0) {
          leftSumList.push(e)
        } else {
          leftSumList[i] = leftSumList[i] + e
        }
      } else {
        if (index === 0) {
          rightSumList.push(e)
        } else {
          rightSumList[i] = rightSumList[i] + e
        }
      }
    })
  })
  if ([4, 7].includes(graphTypeNew.value)) {
    leftList = leftSumList
    rightList = rightSumList
  }

  var maxLeft = Number(Math.ceil(Math.max(...leftList)))
  var maxRight = Number(Math.ceil(Math.max(...rightList)))
  if (
    props.config.groupY.length &&
    (!props.settings.y.minAuto || !props.settings.y.maxAuto)
  ) {
    yAxisList.push({
      type: 'value',
      min: props.settings.y.minAuto ? 0 : props.settings.y.min,
      max: props.settings.y.maxAuto ? maxLeft : props.settings.y.max,
      splitNumber: 5,
    })
  } else {
    yAxisList.push({ type: 'value' })
  }
  if (
    props.config.groupRY.length &&
    (!props.settings.ry.minAuto || !props.settings.ry.maxAuto)
  ) {
    yAxisList.push({
      type: 'value',
      min: props.settings.ry.minAuto ? 0 : props.settings.ry.min,
      max: props.settings.ry.maxAuto ? maxRight : props.settings.ry.max,
      splitNumber: 5,
    })
  } else {
    yAxisList.push({ type: 'value' })
  }
  option.xAxis.data = sortColumns.length ? sortColumns : computeKeys
  option.series = list
  option.yAxis = yAxisList

  return true
}

const getEchartsOptionsDebounce = debounce((type) => {
  getEchartsOptions(type)
}, 100)

const chartUtil = cloneDeep(chartUtils)

/**
 * @description 图表数据渲染
 */
const getEchartsOptions = (type) => {
  if (
    JSON.stringify(props.config) === '{}' ||
    JSON.stringify(props.settings) === '{}'
  ) {
    return
  }
  if (
    (!(props.config?.groupX?.length || props.config?.groupChildX?.length) ||
      !(props.config?.groupY?.length || props.config?.groupRY?.length)) &&
    graphTypeNew.value !== 6
  ) {
    return
  }
  // 判断字段是否存在
  let propsFlag = true
  if (
    props.config?.groupX?.length &&
    !props.config?.groupX.every((i) =>
      props.headers.some((e) => e.split(',')[0] === i.name)
    )
  ) {
    propsFlag = false
  }
  if (
    props.config?.groupChildX?.length &&
    !props.config?.groupChildX.every((i) =>
      props.headers.some((e) => e.split(',')[0] === i.name)
    )
  ) {
    propsFlag = false
  }
  if (
    props.config?.groupY?.length &&
    !props.config?.groupY.every((i) =>
      props.headers.some((e) => e.split(',')[0] === i.name)
    )
  ) {
    propsFlag = false
  }
  if (
    props.config?.groupRY?.length &&
    !props.config?.groupRY.every((i) =>
      props.headers.some((e) => e.split(',')[0] === i.name)
    )
  ) {
    propsFlag = false
  }

  const option = cloneDeep(opt)
  const list = []
  const dataX = [] // X轴未去重数据集合
  const dataValX = [] // X轴已去重数据集合
  const dataY = cloneDeep(props.config.groupY)
  if (props.config.groupRY && props.config.groupRY.length) {
    dataY.push(...cloneDeep(props.config.groupRY))
  }
  const computeObjArr = []
  const computeKeys = []

  const groupYGroup = []
  const dataChildX = [] // 子X轴未去重集合
  const dataValChildX = [] // 子X轴已去重集合
  const sortColumns = [] //y轴排序

  if (propsFlag) {
    graphChartCompute({
      dataX,
      dataValX,
      dataChildX,
      dataValChildX,
      dataY,
      groupYGroup,
      computeObjArr,
      computeKeys,
      sortColumns,
    })

    const falg = graphChartMap({
      option,
      list,
      computeObjArr,
      computeKeys,
      dataValX,
      dataValChildX,
      groupYGroup,
      sortColumns,
    })

    if (!falg) {
      return
    }
  }
  //数据表
  state.columns.splice(0, state.columns.length)
  state.tableData.splice(0, state.tableData.length)
  if (graphTypeNew.value === 6) {
    const columnsLabel = props.config.groupX
      .map((item) => item.name)
      .concat(dataY.map((item) => item.newName))
    let arrData = []
    if (dataValX.join(',') === '') {
      arrData = list.map((item) => item.data)
    } else {
      list.forEach((item) => {
        item.data.forEach((items, indexs) => {
          dataValX[indexs].push(items)
        })
      })
      arrData = dataValX
    }
    const arr = Array(arrData.length)
    columnsLabel.forEach((item, index) => {
      state.columns.push({
        title: item,
        prop: `${item}${index}`,
        align: typeof arrData[0][index] === 'number' ? 'right' : 'center',
        sortable: true,
        sortType: typeof arrData[0][index] === 'number' ? 'number' : 'string',
      })
    })
    arrData.forEach((item, index) => {
      item.forEach((items, indexs) => {
        if (arr[index] === undefined) {
          arr[index] = {}
        }
        arr[index][state.columns[indexs].prop] = items
      })
    })
    if (arr.filter((item) => !!item).length) {
      state.tableData = arr
      nextTick(() => {
        //数据表排序赋值
        state.sortArr = cloneDeep(props.config.sortArr || [])
        resTableRef.value?.sortEvent(state.sortArr)
      })
    }
  } else {
    chartUtil.recordDataZoomStartEndPos(chartRef.value.myChart, type)
    // 图表数值显示/隐藏、Y轴、次Y轴数值/百分比展示
    chartUtil.showChartLabel = showChartLabelNew.value
    chartUtil.valueDisplaySelect = props.settings.y?.valueDisplaySelect
    chartUtil.valueDisplaySelectr = props.settings.ry?.valueDisplaySelect
    options.value = Object.freeze(
      chartUtil.newChartOptions(option, true, 'sql')
    )
  }
}

const setCellStyle = ({ row, column, rowIndex, columnIndex }) => {
  let style = { color: '#545E6E' }
  if (
    row &&
    typeof row[column.property] === 'number' &&
    props.config?.groupX.length <= columnIndex
  ) {
    const cur = state.tableData
      .map((item) => item[column.property])
      .sort((a, b) => b - a)[0]
    const per = parseFloat((row[column.property] / cur) * 100)
    const pColor = getPercentColor(per)
    style = { 'background-color': pColor, color: '#1C2028' }
  }
  return style
}

defineExpose({
  tableData: computed(() => state.tableData),
})

defineOptions({
  name: 'VisualChartView',
})
</script>
<template>
  <div class="visual-view-chart fz14">
    <div
      v-if="props.titleFlag"
      class="visual-view-chart-header flex-center mb20">
      <div class="txt-bold">{{ $t('analysis.sqlquery.visualArea') }}</div>
      <div class="ml20">{{ $t('analysis.sqlquery.visualAreaTips') }}</div>
    </div>
    <div v-if="props.showBtn" class="flex-center flex-between mb20">
      <div>
        <el-radio-group
          v-if="props.graphTypeFlag"
          v-model="graphTypeNew"
          class="no-bg-radio-group">
          <el-radio-button
            v-for="item in state.chartTypeList.filter(
              (val) =>
                !(
                  (props.config?.groupChildX?.length ||
                    props.config?.groupRY?.length ||
                    props.config?.groupY?.length > 1) &&
                  val.value === 5
                )
            )"
            :label="item.value"
            :value="item.value"
            :key="`chart_icon_${item.value}`"
            :title="item.title">
            <svg-icon :name="item.icon" class="fz18"></svg-icon>
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="flex-center gap10">
        <Tooltip>
          <el-button
            v-if="graphTypeNew !== 6"
            class="m0 p10 nd-operate-btn-active"
            @click="showChartLabelNew = !showChartLabelNew">
            <SvgIcon
              class="fz16"
              :name="showChartLabelNew ? 'visual-view' : 'visual-noview'" />
          </el-button>
          <template #content
            >{{
              showChartLabelNew
                ? $t('analysis.sqlquery.hideNumerical')
                : $t('analysis.sqlquery.displayNumerical')
            }}
          </template>
        </Tooltip>
        <slot name="remove"></slot>
      </div>
    </div>
    <div :class="props.showBtn ? 'height-calc-92' : 'h100-percentage'">
      <chart
        v-if="
          (props.config?.groupX?.length || props.config?.groupChildX?.length) &&
          (props.config?.groupY?.length || props.config?.groupRY?.length) &&
          graphTypeNew !== 6
        "
        :options="options"
        height="100%"
        ref="chartRef"></chart>
      <div
        v-if="state.tableData?.length && graphTypeNew === 6"
        class="h100-percentage">
        <VxeTableSort
          ref="resTableRef"
          :columns="state.columns"
          :data="state.tableData"
          :pageFlag="false"
          :resizable="true"
          height="100%"
          :cell-style="setCellStyle"
          @getSortArr="getSortArr"></VxeTableSort>
      </div>
      <div class="flex-content-center">
        <Empty
          v-if="
            ((!(
              props.config?.groupX?.length || props.config?.groupChildX?.length
            ) ||
              !(
                props.config?.groupY?.length || props.config?.groupRY?.length
              )) &&
              graphTypeNew !== 6) ||
            (!state.tableData.length && graphTypeNew === 6)
          "
          :desc="$t('analysis.sqlquery.checkChartConfig')"
          class="echarts-item" />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.visual-view-chart {
  height: 100%;
  background: #ffffff;

  &-header {
    height: 20px;
    line-height: 20px;
  }

  .height-calc-92 {
    height: calc(100% - 92px);
  }

  .flex-content-center {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
