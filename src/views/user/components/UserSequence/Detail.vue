<template>
  <CommonLayout v-loading="state.fullLoaing">
    <div class="nd-user-data-detail no-pdding flex fz14">
      <div class="nd-user-data-detail-l flex-column flex-between">
        <el-collapse class="nd-collapse-attr-info" accordion model-value="1">
          <el-collapse-item name="1">
            <template #title>
              <span class="fz16 c1c2028">
                {{ $t('analysis.ltv.userAttribute') }}
              </span>
            </template>
            <div class="flex-column gap20">
              <div
                class="flex flex-between"
                v-for="(value, key) of state.userProperties"
                :key="key">
                <span class="c86919d nd-base-info-label">{{ key }}</span>
                <span class="c545e6e nd-base-info-value">{{ value }}</span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
        <div class="flex-center flex-between mt20 pr20">
          <el-button @click="changeUser(-1)" class="fz16" text>
            <el-icon>
              <ArrowLeft />
            </el-icon>
            {{ $t('user.previousUser') }}
          </el-button>
          <el-button @click="changeUser(1)" class="fz16" text>
            {{ $t('user.nextUser') }}
            <el-icon>
              <ArrowRight />
            </el-icon>
          </el-button>
        </div>
      </div>
      <div class="nd-user-data-detail-r" v-loading="state.rightLoading">
        <div class="flex-column gap20">
          <div class="flex-center gap10">
            <DateRangeSelect
              @change="eventAndDateChange"
              v-model="state.dateRange"
              :verifyDate="verifyDate"
              hideInfo
              :needDynamic="false" />
            <CustomField
              v-model="state.customColumnValue"
              :data="state.customColumnData"
              :defaultProps="{
                value: 'eventName',
                label: 'eventNameZh',
              }"
              :label="$t('user.event')"
              @submit="customColumnConfirm"
              valueKey
              placement="bottom" />
            <PeriodTypeSelect v-model="state.particleType" :limit="['day']" />
          </div>
          <div class="c545e6e">{{ $t('user.eventsTotal') }}</div>
          <Chart height="300px" ref="chartRef" :options="chartsOption" />
          <div v-loading="state.loadingMore">
            <div class="flex-center gap10 mb20">
              <el-button @click="orderChange">
                <el-icon class="fz18 mr3" v-show="state.sort === 1">
                  <Top />
                </el-icon>
                <el-icon class="fz18 mr3" v-show="state.sort === 2">
                  <Bottom />
                </el-icon>
                {{
                  `${state.sort === 1 ? $t('user.timeAscending') : $t('user.timeDescending')}`
                }}
              </el-button>
              <AttrFilter
                @getList="getUserEventInfo"
                v-model="state.filterParam"
                v-model:reqFilterParam="state.reqFilterParam"
                ref="attrFilterRef"
                :eventIds="attrFilterEventIds" />
            </div>
            <div class="nd-event-info-container gap20">
              <div
                v-for="(item, key) of state.eventInfoData"
                :key="key"
                class="nd-event-info-list">
                <div class="c545e6e fz16 nd-event-info-date">
                  {{ key }}
                </div>

                <div class="flex-column gap10 nd-event-info-sub-container">
                  <div
                    v-for="(info, k) of item"
                    :key="k"
                    class="nd-event-info-sub-list">
                    <div class="nd-event-info-time">
                      {{ info.__s_event_date }}
                    </div>
                    <el-collapse class="nd-collapse-event-info">
                      <el-collapse-item>
                        <template #title>
                          <div class="nd-collapse-event-title">
                            <div class="nd-collapse-event-desc">
                              {{ info.__event_name || '事件' }}
                            </div>
                            <div
                              class="nd-collapse-event-props flex-center flex-warp">
                              <div
                                v-for="(value, index) of filterDisplayProps(
                                  info
                                )"
                                @click.stop="propsFilterChange(value[0], info)"
                                :key="`${value[0]}:${index}`"
                                class="fz14"
                                :class="{ active: isActive(value[0], info) }">
                                <div class="c86919d">
                                  {{
                                    state.columMeta[value[0].toLowerCase()] ||
                                    value[0]
                                  }}：
                                </div>
                                <div class="c545e6e">
                                  {{
                                    value[0]
                                      ? info[value[0].toLowerCase()] || '-'
                                      : '-'
                                  }}
                                </div>
                                <el-button
                                  text
                                  class="nd-collapse-event-delete"
                                  @click.stop="removeDisplayProps(value[0])">
                                  <SvgIcon name="error1" />
                                </el-button>
                              </div>
                            </div>
                          </div>
                        </template>
                        <div class="nd-collapse-event-props-val">
                          <div
                            v-for="(infoItem, key) of filterInfoItem(info)"
                            :key="key"
                            class="flex-center fz14">
                            <div>
                              <span v-showTips class="c545e6e mr20"
                                >{{
                                  state.columMeta[key.toLowerCase()] || key
                                }}：</span
                              >

                              <div class="inline-flex flex-align-items-center">
                                <span
                                  style="max-width: 20vw"
                                  v-showTips
                                  class="c545e6e nd-hover-none"
                                  >{{
                                    infoItem === null ? '-' : infoItem
                                  }}</span
                                >

                                <el-button
                                  class="nd-collapse-event-props-val-btn"
                                  type="primary"
                                  v-copy="infoItem === null ? '-' : infoItem"
                                  text>
                                  {{ $t('btn.copy') }}
                                </el-button>

                                <el-button
                                  class="nd-collapse-event-props-val-btn"
                                  text
                                  type="primary"
                                  @click="
                                    setDisplayProps(
                                      key,
                                      infoItem,
                                      key.toLowerCase()
                                    )
                                  "
                                  >{{
                                    state.displayProps.has(key)
                                      ? $t('user.cancelDisplay')
                                      : $t('user.attributeDisplay')
                                  }}
                                </el-button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </div>
              </div>
              <div class="flex-center flex-level-center c545e6e">
                <div
                  v-if="filterConfig.page * filterConfig.size >= state.total">
                  {{ $t('user.allDataDisplayed') }}
                </div>
                <div v-else class="flex-center" @click="loadMore">
                  {{ $t('user.loadMore') }}
                  <el-icon class="ml3"><ArrowDown /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </CommonLayout>
</template>

<script setup>
import {
  computed,
  watch,
  reactive,
  ref,
  shallowRef,
  nextTick,
  markRaw,
  inject,
  toRef,
} from 'vue'
import {
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Top,
  Bottom,
  More,
} from '@element-plus/icons-vue'
import { groupBy, isMap } from 'lodash-es'
import AttrFilter from './AttrFilter.vue'
import { isObject } from '@/utils/types'
import { chartColor } from '@/enumeration/chart'
import { asyncGetAppEvents } from '@/api/modules/data-management/event'
import {
  asyncGetEventAmountTrend,
  asyncGetEventInfo,
  asyncGetUserAttrInfo,
} from '@/api/modules/user-sequence'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const props = defineProps({
  userId: {
    type: String,
    default: '',
  },
  // 用户id列表
  fidList: {
    type: Array,
    default() {
      return []
    },
  },
})

const appId = toRef(inject('appId', sessionStorage.getItem('appId')))

const options = shallowRef({
  tooltip: {
    trigger: 'item',
    enterable: true, //鼠标可进入提示框浮层中
    confine: true, //将 tooltip 框限制在图表的区域内
    axisPointer: {
      type: 'shadow',
    },
    // 适用于dataset方式
    /* formatter(params) {
      let html = ''
      // 数组是多个查看，对象是单个查看
      console.log(params)
      if (Array.isArray(params)) {
        let keys = groupBy(params, 'name')
        Object.keys(keys).forEach((k) => {
          let v = keys[k]
          html += `<div class="fz14 txt-bold c86919d ">${k}</div>`
          v.forEach((item, index) => {
            html += `
             <div class="flex-center">
               <span class="mr5 nd-chart-tooltip-shape" style="background-color:${
                 item.color
               }"></span>
               <span>${item.seriesName}：</span>
               <span>${item.value[index + 1]}</span>
             </div>`
          })
        })
      } else {
        html = `
              <div class="fz14 txt-bold c86919d nd-chart-tooltip">${
                params.seriesName
              }</div>
                <div class="flex-center">
                     <span class="mr5 nd-chart-tooltip-shape" style="background-color:${
                       params.color
                     }"></span>
                     <span>${params.name}：</span>
                     <span>${params.value[params.seriesIndex + 1]}</span>
                </div>
              `
      }
      return html
    },*/
    formatter(params) {
      let html = ''
      // 数组是多个查看，对象是单个查看
      if (Array.isArray(params)) {
        let keys = groupBy(params, 'name')
        Object.keys(keys).forEach((k) => {
          let v = keys[k]
          html += `<div class="fz14 txt-bold c86919d ">${k}</div>`
          v.forEach((item, index) => {
            html += `
             <div class="flex-center">
               <span class="mr5 nd-chart-tooltip-shape" style="background-color:${item.color}"></span>
               <span>${item.seriesName}：</span>
               <span>${item.value}</span>
             </div>`
          })
        })
      } else {
        html = `
              <div class="fz14 txt-bold c86919d nd-chart-tooltip">${params.seriesName}</div>
                <div class="flex-center">
                     <span class="mr5 nd-chart-tooltip-shape" style="background-color:${params.color}"></span>
                     <span>${params.name}：</span>
                     <span>${params.value}</span>
                </div>
              `
      }
      return html
    },
  },
  // legend: {
  //   // data: ['配置用户占比', '模拟用户占比'],
  //   bottom: '10%',
  //   itemHeight: 10,
  //   itemWidth: 10,
  //   // orient: 'vertical',
  //   icon: 'circle',
  //   // left: 'left',
  //   // 解决circle文字不对齐问题
  //   textStyle: {
  //     color: '#545e6e',
  //     rich: {
  //       a: {
  //         // verticalAlign: 'middle',
  //       },
  //     },
  //     padding: [3, 0, 0, 0],
  //   },
  //   itemGap: 20,
  // },
  grid: {
    // left: '8%',
    top: '7%',
    right: '5',
    // height: '65%',
    width: '95%',
  },
  dataset: {
    // 用 dimensions 指定了维度的顺序。直角坐标系中，如果 X 轴 type 为 category，
    // 默认把第一个维度映射到 X 轴上，后面维度映射到 Y 轴上。
    // 如果不指定 dimensions，也可以通过指定 series.encode
    // 完成映射，参见后文。
    /*  dimensions: ['product', '配置用户占比', '模拟用户占比'],
          source: [
              { product: '试验组1', 配置用户占比: 0.21, 模拟用户占比: 0.18 },
              { product: '试验组4', 配置用户占比: 83.1, 模拟用户占比: 73.4 },
              { product: '试验组3', 配置用户占比: 86.4, 模拟用户占比: 65.2 },
              { product: '基准组', 配置用户占比: 72.4, 模拟用户占比: 53.9 },
              { product: '试验组2', 配置用户占比: 72.4, 模拟用户占比: 53.9 }
          ] */
    source: [
      /*  ['product', '配置用户占比', '模拟用户占比'],
            ['试验组1', 0.21, 0.18],
            ['试验组4', 0.16, 0.18],
            ['试验组3', 0.15, 0.18],
            ['基准组', 0.15, 0.18],
            ['试验组2', 1, 5]*/
    ],
  },
  xAxis: {
    type: 'category',
    // axisTick: { show: false, alignWithLabel: true },
    axisLabel: {
      color: '#86919d',
    },
    axisPointer: {
      //单个展示增加配置 只有hover柱状图 才显示提示
      show: false,
      type: 'shadow',
      label: {
        show: false,
      },
    },
    axisLine: {
      lineStyle: {
        color: '#cbd0d6',
      },
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      // show: true,
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#e7e7ea',
        type: 'dashed',
      },
    },
  },
  dataZoom: {
    realtime: false,
    type: 'slider',
    show: true,
    xAxisIndex: [0],
    // realtime: false,
    filterMode: 'filter',
    // zoomLock: true,
    brushSelect: false,
    // throttle: 300,
    bottom: 5,
    left: '3%',
    start: 0,
    end: 100,
    // backgroundColor: '#F5F7FE',
    // left: '10%',
    // right: '10%',
    // width: '90%',
    // animation: false,
    // rangeMode: ['value', 'value'],
    // handleSize: 0,
    showDetail: false,
    showDataShadow: false,
    height: '6%',
  },
})

const chartRef = ref(null)
const attrFilterRef = ref(null)
const attrFilterEventIds = computed(() => {
  return state.customColumnData
    .filter((item) => {
      return state.customColumnValue.includes(item.eventName)
    })
    .map((item) => item.eventId)
})
const initVal = () => {
  const condition = {
    relation: 0,
    filters: [],
  }
  return {
    state: {
      sort: 1,
      // 属性筛选条件
      filterParam: condition,
      // 请求参数
      reqFilterParam: {},
      userProperties: {},
      customColumnData: [],
      customColumnValue: [],
      dateRange: {
        date: [
          dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
          dayjs().format('YYYY-MM-DD'),
        ],
        diff: '',
      },
      particleType: { particle: 'day' },
      columMeta: {},
      eventInfoData: {},
      fId: props.userId,
      displayProps: new Map(),
      // 赋值当前点击柱状图日期
      currentChartClickDate: '',
      total: 0,
      chartData: [],

      fullLoaing: false,
      rightLoading: false,
      loadingMore: false,
      propertyFilter: new Map(),
    },
    filterConfig: {
      // 分页器配置
      page: 1, // 当前页码
      size: 20, // 每页数量
      // 时间排序方式:降序desc 升序asc 1 升序 2 倒序
      sort: '',
      // 根据哪个字段排序
      sortFiled: '',
    },
    condition,
  }
}

const state = reactive(initVal().state)
const filterConfig = reactive(initVal().filterConfig)

const chartsOption = computed(() => {
  /*// 合并 x 和 y 数组 适用dataset方式
  const mergedData = [state.chartData.x, state.chartData.y]

  // 找到最长的子数组长度
  const maxLength = Math.max(...mergedData.map((arr) => arr.length))

  // 填充数组至最大长度
  const alignedData = mergedData.map((arr) => [
    ...arr,
    ...Array(maxLength - arr.length).fill(''),
  ])

  // 转置数组
  const transposedData = alignedData[0].map((_, i) =>
    alignedData.map((row) => row[i])
  )*/

  return {
    ...options.value,
    xAxis: {
      ...options.value.xAxis,
      data: state.chartData.xAxisDataList,
    },
    series: [
      {
        name: t('analysis.event.total'),
        type: 'bar',
        barGap: 0,
        label: {
          show: false,
        },
        emphasis: {
          focus: 'series',
        },
        // 设置柱子最大宽度为 30
        barMaxWidth: 30,
        itemStyle: {
          color: chartColor[0],
        },
        data: state.chartData.yAxisDataList,
      },
    ],
    /*dataset: {
      /!* source: state.chartData.map((item) => {
        console.log(item)
        return [
          // item.groupName,
          // parseFloat(item.cfgRatio),
          // parseFloat(item.userNumRatio),
        ]
      }),*!/
      source: transposedData,
    },*/
  }
})

// 获取用户信息
const getUserInfo = async () => {
  const { data } = await asyncGetUserAttrInfo({
    appId: appId.value,
    fid: state.fId,
  })
  const columMeta = data.columnDescriptionInfo
  const userInfo = data.columnValueInfo
  const did = {}
  const fid = {}
  const pre = {}
  const temp = {}
  for (const key in userInfo) {
    const newKey = columMeta[key.toLowerCase()]
      ? columMeta[key.toLowerCase()]
      : key

    if (key.toLowerCase() === '__fid') {
      fid[newKey] = userInfo[key] ?? '-'
    } else if (key.toLowerCase() === '__did') {
      did[newKey] = userInfo[key] ?? '-'
    } else if (key.startsWith('__')) {
      pre[newKey] = userInfo[key] ?? '-'
    } else {
      temp[newKey] = userInfo[key] ?? '-'
    }
  }
  /*const userProperties = Object.keys(userInfo).reduce((acc, cur) => {
    const newKey = columMeta[cur] ?? cur
    acc[newKey] = userInfo[cur] ?? '-'
    return acc
  }, {})*/
  state.userProperties = { ...fid, ...did, ...pre, ...temp }
}
// 获取事件
const getEvents = async () => {
  const { data } = await asyncGetAppEvents({ appId: appId.value, type: 3 })
  state.customColumnData = markRaw(data)
  state.customColumnValue = data.map((item) => item.eventName)
}
// 获取行为事件总量
const getChartData = async () => {
  chartRef.value?.myChart?.off('click')
  const params = {
    appId: appId.value,
    fid: state.fId,
    startDate: state.dateRange.date[0],
    endDate: state.dateRange.date[1],
    timeParticle: state.particleType.particle,
    eventNameList: state.customColumnValue,
  }

  const { data } = await asyncGetEventAmountTrend(params)
  state.chartData = data
  requestIdleCallback(() => {
    chartRef.value.myChart.on(
      'click',
      ({ componentType, componentSubType, name }) => {
        if (componentType === 'series' && componentSubType === 'bar') {
          state.currentChartClickDate =
            state.currentChartClickDate === name ? '' : name
          state.eventInfoData = {}
          resetPageSetting()
          getUserEventInfo()
        }
      }
    )
  })
}
// 获取用户事件行为
const getUserEventInfo = async () => {
  const params = {
    appId: appId.value,
    fid: state.fId,
    sort: state.sort,
    page: filterConfig.page,
    size: filterConfig.size,
    startDate: state.currentChartClickDate || state.dateRange.date[0],
    endDate: state.currentChartClickDate || state.dateRange.date[1],
    timeParticle: state.particleType.particle,
    eventNameList: state.customColumnValue,
  }

  if (state.propertyFilter.size > 0) {
    const propertyFilter = {}
    for (const [key, value] of state.propertyFilter) {
      propertyFilter[key] = value
    }
    params.propertyFilter = propertyFilter
  }

  if (Object.keys(state.reqFilterParam).length) {
    params.filterParam = state.reqFilterParam
  }
  state.loadingMore = true
  const { data } = await asyncGetEventInfo(params).finally((_) => {
    state.loadingMore = false
  })
  state.eventInfoData = data.eventData
  state.columMeta = data.eventColumnInfo
  state.total = data.total
}
// 重置分页
const resetPageSetting = () => {
  filterConfig.page = 1
  filterConfig.size = 20
  state.total = 0
}

const eventAndDateChange = async () => {
  state.currentChartClickDate = ''
  resetPageSetting()
  state.rightLoading = true
  try {
    await Promise.allSettled([getChartData(), getUserEventInfo()])
  } catch (e) {
    console.log(e)
  }
  state.rightLoading = false
}

// 选择事件改变
const customColumnConfirm = async (list) => {
  state.filterParam = initVal().condition
  eventAndDateChange()
}

// 查询周期 按天等
const changeTimeValue = () => {
  // getChartData()
  // state.currentChartClickDate = ''
  // resetPageSetting()
  // getUserEventInfo()
}

// 日期限制
const verifyDate = (val) => {
  const start = dayjs(val.date[0])
  const end = dayjs(val.date[1])
  const diff = end.diff(start, 'days')
  if (diff > 30) {
    return t('user.selectDayExceed')
  }
}

// 属性过滤
const filterInfoItem = (info) => {
  if (isObject(info)) {
    const pre = {}
    const temp = {}
    // 这些值不显示
    const blackList = [
      '__s_event_date',
      '__pt_date',
      '__s_date_month_utc8',
      '__s_date_hour_utc8',
    ]
    const keyArr = Object.keys(info).filter(
      (el) => blackList.indexOf(el) === -1
    )
    for (const val of keyArr) {
      if (val.indexOf('__') === 0) {
        pre[val] = info[val]
      } else {
        temp[val] = info[val]
      }
    }
    return { ...pre, ...temp }
  }
  return info
}

// 切换上下个用户
const changeUser = (val) => {
  const showList = props.fidList
  const len = showList.length
  const userId = state.fId
  if (!Array.isArray(showList) || len === 0) return
  const findIndex = showList.findIndex((el) => String(el) === String(userId))
  if (findIndex === -1) return
  if (findIndex === 0 && val === -1) {
    ElMessage.warning(t('user.firstUser'))
    return
  }
  if (findIndex === len - 1 && val === 1) {
    ElMessage.warning(t('user.lastUser'))
    return
  }

  state.fId = showList[findIndex + val]
  state.currentChartClickDate = ''
  resetPageSetting()
  getData(false)
}
// 加载更多
const loadMore = (list) => {
  filterConfig.page++
  getUserEventInfo()
}
// 时间排序改变
const orderChange = () => {
  state.sort = state.sort === 1 ? 2 : 1
  getUserEventInfo()
}

//将外显的属性缓存到localStorage里
const setLocalDisplay = (map) => {
  if (isMap(map)) {
    const displayKeys = Array.from(map)
    localStorage.setItem(
      `${sessionStorage.getItem('appId')}DisplayKeys`,
      JSON.stringify(displayKeys)
    )
  }
}

// 从localStorage里获取缓存的外显属性
const getLocalDisplay = () => {
  const storageData = localStorage.getItem(
    `${sessionStorage.getItem('appId')}DisplayKeys`
  )
  if (storageData) {
    const displayKeys = JSON.parse(storageData)
    if (Array.isArray(displayKeys)) {
      state.displayProps = new Map(displayKeys)
    }
  }
}

// 过滤外显属性
const filterDisplayProps = (info) => {
  const filters = new Map()
  const propsArr = Object.keys(info)
  if (Array.isArray(propsArr)) {
    for (const item of propsArr) {
      if (state.displayProps.has(item)) {
        filters.set(item, state.displayProps.get(item))
      }
    }
  }
  return filters
}

// 设置外显属性
const setDisplayProps = (item, val, key) => {
  if (state.displayProps.has(item)) {
    state.displayProps.delete(item)
  } else {
    state.displayProps.set(item, val)
  }
  if (state.propertyFilter.has(item)) {
    state.propertyFilter.delete(item)
    getUserEventInfo()
  }
  setLocalDisplay(state.displayProps)
}
// 移除外显属性
const removeDisplayProps = (item) => {
  state.displayProps.delete(item)
  setLocalDisplay(state.displayProps)

  if (state.propertyFilter.has(item)) {
    state.propertyFilter.delete(item)
    getUserEventInfo()
  }
}

/**
 * @description: 选中/取消选中属性
 * @return {*}
 */
const propsFilterChange = (key, info) => {
  if (isActive(key, info)) {
    state.propertyFilter.delete(key)
  } else {
    state.propertyFilter.set(key, info[key.toLowerCase()])
  }

  getUserEventInfo()
}

/**
 * @description: 属性是否选中
 * @return {*}
 */
const isActive = (key, info) => {
  if (!key) return false
  const value = info[key.toLowerCase()]
  if (state.propertyFilter.get(key) === value) return true
  return false
}

const getData = async (bool = true) => {
  state.fullLoaing = true
  try {
    if (bool) {
      await getEvents()
      getLocalDisplay()
    }
    await Promise.allSettled([
      getUserInfo(),
      getChartData(),
      getUserEventInfo(),
    ])
  } catch (e) {
    console.log(e)
  }
  state.fullLoaing = false
}

getData()

defineOptions({
  name: 'Detail',
})
</script>

<style scoped lang="scss">
:deep(.common-layout-container) {
  padding: 0;
}
// 左侧信息的
.nd-collapse-attr-info {
  display: flex;
  flex-direction: column;
  border: none;
  overflow: hidden;
  height: 100%;

  :deep(.el-collapse-item) {
    display: flex;
    flex-direction: column;
    //height: 100%;
    overflow: hidden;
    min-height: 48px;
    /* &.is-active {
    }
    > div {
      &:first-of-type {
        padding-right: 20px;
      }
    }*/
    .el-collapse-item__header {
      border: none;
      transition: none;
    }

    .el-collapse-item__wrap {
      border: none;

      .el-collapse-item__content {
        height: 100%;
        padding-bottom: 0px;

        > div {
          max-height: 100%;
          overflow-y: auto;
          padding-right: 20px;
        }
      }
    }

    .el-collapse-item__arrow {
      color: var(--eas-text-color-light);
    }
  }
}
// 右侧信息的
.nd-collapse-event-info {
  width: calc(100% - 95px);
  border-radius: 4px;
  border: 1px solid var(--eas-border-color);
  padding: 0 20px;
  overflow: hidden;

  :deep(.el-collapse-item) {
    .el-collapse-item__header {
      border: none;
      transition: none;
      height: auto;
    }
    .el-collapse-item__wrap {
      border: none;
    }
    .el-collapse-item__content {
      padding-bottom: 20px;
    }
  }
}

.nd-event-info-container {
  display: flex;
  flex-direction: column;
  .nd-event-info-sub-list {
    display: flex;
    align-items: stretch;
    position: relative;
  }
  .nd-event-info-time {
    display: flex;
    align-items: center;
    position: relative;
    //height: 100%;
    margin-right: 30px;
    color: var(--eas-text-color-primary);

    //border-right: 1px solid var(--eas-border-color);
    &:after {
      content: '';
      position: absolute;
      right: -14px;
      width: 10px;
      z-index: 1;
      height: 10px;
      border-radius: 50%;
      background-color: var(--eas-border-color);
    }
    &:before {
      content: '';
      position: absolute;
      right: -10px;
      width: 1px;
      height: 100%;
      background-color: var(--eas-border-color);
    }
  }
  .nd-event-info-sub-container {
    transform: translateX(25px);
  }
  /* .nd-collapse-event-info {
    transform: translateX(83px);
  }*/
  .nd-collapse-event-desc {
    margin-right: 50px;
    white-space: nowrap;
  }
  .nd-collapse-event-title {
    display: flex;
    flex: 1;
    order: 1;
    align-items: center;
  }
  .nd-collapse-event-props {
    padding: 20px 0;
    gap: 10px;
    > div {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 50px;
      padding: 6px 10px;
      background-color: var(--eas-color-primary-light-1);
      border-radius: 3px;
      line-height: normal;
      &:hover {
        .nd-collapse-event-delete {
          visibility: visible;
        }
      }
      &.active {
        background-color: var(--eas-color-primary);
        div {
          color: #fff !important;
        }
      }
    }
    .nd-collapse-event-delete {
      position: absolute;
      color: var(--eas-message-error-text-color) !important;
      top: -7px;
      right: -7px;
      visibility: hidden;
    }
  }
  .nd-collapse-event-props-val {
    display: flex;
    flex-wrap: wrap;
    > div {
      width: 50%;

      &:nth-child(odd) {
        padding-right: 20px;
        border-right: 1px solid var(--eas-border-color);
      }
      &:nth-child(even) {
        padding-left: 20px;
      }
      &:hover {
        .nd-collapse-event-props-val-btn {
          display: block;
        }
        .nd-hover-none {
          display: none;
        }
      }
      > div {
        position: relative;
        display: flex;
        //flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid var(--eas-border-color);
        height: 40px;
        width: 100%;
      }
    }

    .nd-collapse-event-props-val-btn {
      display: none;
    }
  }
}

@import '@/views/user/group-data-detail/index.scss';
.nd-user-data-detail-l {
  display: flex;
  flex-direction: column;
  padding: 20px 0;
}
</style>
