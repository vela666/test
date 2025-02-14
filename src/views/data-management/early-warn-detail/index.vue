<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import operateEarlyWarn from '../early-warn/operateEarlyWarn.vue'
import {
  earlyWarnSelectDetails,
  earlyWarnDetailList,
} from '@/api/modules/data-management/early'
import { cloneDeep } from 'lodash-es'
import dayjs from 'dayjs'
import { t } from '@/locales/i18n'
const route = useRoute()

const operateEarlyWarnRef = ref()

const chartRef = ref()

const timeLabelMap = [
  '',
  t('dataManagement.earlyWarn.lastDay'),
  t('dataManagement.earlyWarn.lastHour'),
  t('dataManagement.earlyWarn.fixedValue'),
  t('dataManagement.earlyWarn.intervalMaxMin'),
  t('dataManagement.earlyWarn.yearOnYear'),
]

const state = reactive({
  id: null,
  title: '',
  timeLabel: '',
  cycle: null,
  info: {},
  dateRange: {
    startTime: dayjs(new Date(new Date() - 6 * 24 * 60 * 60 * 1000)).format(
      'YYYY-MM-DD'
    ),
    endTime: dayjs(new Date()).format('YYYY-MM-DD'),
  },
  columns: [],
  tableData: [],
  tablePageData: [],
  pageNum: 1,
  pageSize: 10,
  total: 0,
  option: {
    tooltip: {
      trigger: 'item',
      extraCssText: 'z-index: 99',
      confine: true,
    },
    grid: {
      top: '3%',
      left: '3%',
      right: '3%',
      bottom: '10%',
      containLabel: true,
    },
    xAxis: {
      axisTick: {
        show: false,
      },
      axisLine: {},
      axisLabel: {},
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
    legend: {
      bottom: 10,
      type: 'scroll',
      data: [],
    },
  },
  loading: false,
  isEmpty: false,
})

onMounted(async () => {
  const { id } = route.query
  if (id) {
    state.id = +id
    await getDetailInfo()
    getEarlyWarnDetailList()
  }
})

/**
 * @description 获取预警详情
 */
const getDetailInfo = async () => {
  if (!state.id) return
  try {
    state.loading = true
    const res = await earlyWarnSelectDetails({ id: state.id })
    if (res && res.code === 200) {
      state.info = res.data
      const params = state.info.param ? JSON.parse(state.info.param) : {}
      if (Array.isArray(params.customIndex)) {
        //自定义公式指标
        state.title =
          params.customIndex[0].eventNameDisplay &&
          params.customIndex[0].analysisDesc
            ? `${params.customIndex[0].eventNameDisplay}${t('common.of')}${params.customIndex[0].analysisDesc}`
            : params.customIndex[0].alias || t('analysis.indicators')
      } else {
        state.title =
          params.eventNameDisplay && params.analysisDesc
            ? `${params.eventNameDisplay}${t('common.of')}${params.analysisDesc}`
            : params.alias || t('analysis.indicators')
      }
      state.timeLabel = timeLabelMap[res.data.cycle]
      state.cycle = res.data.cycle
      operateEarlyWarnRef.value.setData(cloneDeep(res.data))
    }
  } catch (error) {
    console.error(error)
  } finally {
    state.loading = false
  }
}

/**
 * @description 获取预警结果集合
 */
const getEarlyWarnDetailList = () => {
  if (!state.id) return
  state.loaing = true
  earlyWarnDetailList({
    ewId: state.id,
    cycle: state.cycle,
    startTime: state.dateRange.startTime,
    endTime: state.dateRange.endTime,
  })
    .then((res) => {
      if (res && res.code === 200) {
        setTableData(res.data)
        setChart(res.data)
      }
    })
    .finally(() => {
      state.loaing = false
    })
}

/**
 * @description change时间重新获取结果集合
 */
const changeTimeValue = () => {
  getEarlyWarnDetailList()
}

/**
 * @description 设置表格数据
 */
const setTableData = (data) => {
  state.columns = []
  state.tableData = []
  state.tablePageData = []
  if (Array.isArray(data)) {
    state.columns = [
      {
        label: t('dataManagement.earlyWarn.earlyWarningTime'),
        prop: 'ewTime',
        align: 'left',
        sortable: true,
      },
      { label: state.title, prop: 'ewTotal', align: 'left', sortable: true },
      {
        label: t('dataManagement.earlyWarn.differenceRateLabel', [
          state.timeLabel,
        ]),
        prop: 'ewTrend',
        align: 'left',
        sortable: true,
      },
      {
        label: t('dataManagement.earlyWarn.differenceLabel', [state.timeLabel]),
        prop: 'ewDifference',
        align: 'left',
        sortable: true,
      },
      {
        label: t('dataManagement.earlyWarn.earlyWarningSituation'),
        prop: 'ewStatus',
        align: 'left',
        sortable: true,
        width: '120',
      }, // 1,正常; 2,异常
    ]
    state.tableData = data
    state.total = data.length
    state.tablePageData = getTableFilter()
  }
}

const getList = () => {
  state.tablePageData = getTableFilter()
}

const getTableFilter = () => {
  const tableFilter = []
  state.tableData.forEach((item, index) => {
    if (
      state.pageSize * state.pageNum - state.pageSize <= index &&
      index <= state.pageNum * state.pageSize - 1
    ) {
      tableFilter.push(item)
    }
  })
  return tableFilter
}

const setChart = (dataSource) => {
  if (Array.isArray(dataSource) && dataSource.length > 0) {
    const xAxisData = []
    const seriesData = []
    const data = cloneDeep(dataSource)
    // data.sort((a, b) => b.ewTime.localeCompare(a.ewTime))
    data.forEach((item) => {
      xAxisData.push(item.ewTime)
      const dataItem = { value: item.ewTotal }
      if (item.ewStatus !== 1) {
        dataItem['itemStyle'] = { color: '#ff5d5d' }
      }
      seriesData.push(dataItem)
    })
    state.option.xAxis.data = xAxisData
    state.option.series = [
      {
        type: 'line',
        data: seriesData,
      },
    ]
    // 超过10条出现滚动条
    if (xAxisData.length > 10) {
      state.option['dataZoom'] = {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        realtime: false,
        filterMode: 'filter',
        zoomLock: true,
        brushSelect: false,
        bottom: 0,
        startValue: 0,
        endValue: 7,
        rangeMode: ['value', 'value'],
        handleSize: 0,
        showDetail: false,
        showDataShadow: false,
        height: '10px',
      }
    } else {
      state.option['dataZoom'] = undefined
    }
  }
}

defineOptions({
  name: 'earlyWarnDetail',
})
</script>
<template>
  <CommonDetailPage :title="t('dataManagement.earlyWarn.earlyWarningDetails')">
    <CommonLayout>
      <div class="flex h100-percentage">
        <div class="mt20 w580 pr20" style="overflow: auto">
          <operateEarlyWarn
            ref="operateEarlyWarnRef"
            :disabled="true"></operateEarlyWarn>
        </div>
        <div class="detail-split"></div>
        <div class="pt20 pl20 pr20" style="flex: 1; overflow: auto">
          <div class="c545e6e">{{ state.title }}</div>
          <div class="mt20 mb20">
            <DateRangeSelect
              v-model="state.dateRange"
              :needDynamic="false"
              @change="changeTimeValue"
              placement="bottom-start">
            </DateRangeSelect>
          </div>
          <div
            v-loading="state.loading"
            style="
              min-height: calc(100% - 94px);
              width: 100%;
              display: flex;
              align-items: center;
            ">
            <div v-show="state.tableData.length <= 0" style="width: 100%">
              <Empty :desc="t('common.noData')" class="echarts-item" />
            </div>
            <div
              v-show="state.tableData.length > 0"
              style="width: 100%; overflow: auto">
              <div class="card-chart">
                <chart
                  :options="state.option"
                  style="height: 400px; width: 100%"
                  ref="chartRef"></chart>
              </div>
              <div class="card-table" style="width: 100%">
                <el-table
                  :data="state.tablePageData"
                  :header-cell-style="{ background: '#f0f2f5' }"
                  size="small">
                  <el-table-column
                    v-for="(item, index) in state.columns"
                    :key="`el-table-column_${item.prop}_${index}`"
                    :prop="item.prop"
                    :label="item.label"
                    :align="item.align"
                    :sortable="item.sortable"
                    :width="item.width">
                    <template #default="{ row }">
                      <div v-if="item.prop === 'ewTrend'" class="yf-warn-total">
                        <span
                          v-if="
                            isNaN(parseFloat(row['ewTrend'])) ||
                            parseFloat(row['ewTrend']) === 0
                          ">
                          {{ row['ewTrend'] || '-' }}</span
                        >
                        <template v-else>
                          <i
                            :class="[
                              row['ewDifference'] > 0
                                ? 'el-icon-caret-top'
                                : 'el-icon-caret-bottom',
                            ]"></i>
                          <span
                            :class="[
                              row['ewDifference'] > 0
                                ? 'up-color'
                                : 'down-color',
                            ]">
                            {{ row['ewTrend'] }}
                          </span>
                        </template>
                      </div>
                      <div
                        v-else-if="item.prop === 'ewStatus'"
                        class="yf-warn-status">
                        <div
                          :class="[
                            row['ewStatus'] === 1
                              ? 'info___1ate0'
                              : 'warn___1ate0',
                          ]"></div>
                        <div>
                          {{
                            row['ewStatus'] === 1
                              ? t('btn.normal')
                              : t('dataManagement.earlyWarn.abnormal')
                          }}
                        </div>
                      </div>
                      <div v-else>
                        {{ row[item.prop] }}
                      </div>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="mt20 mb20 flex flex-justify-content-end">
                  <Pagination
                    v-model:limit="state.pageSize"
                    v-model:page="state.pageNum"
                    :total="state.total"
                    @getData="getList" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CommonLayout>
  </CommonDetailPage>
</template>
<style lang="scss" scoped>
.detail-split {
  width: 1px;
  height: auto;
  background: var(--eas-split-line-color);
}
.up-color {
  color: var(--eas-color-success);
}
.down-color {
  color: var(--eas-color-error);
}
.yf-warn-total {
  display: inline-block;
  :deep(.el-icon-caret-top) {
    color: var(--eas-color-success);
  }
  :deep(.el-icon-caret-bottom) {
    color: var(--eas-color-error);
  }
}
.yf-warn-status {
  display: flex;
  align-items: center;
  font-size: 13px;
  line-height: 20px;
  & > div:first-child {
    flex-grow: 0;
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: 50%;
  }
  .info___1ate0 {
    background-color: var(--eas-color-success);
  }
  .warn___1ate0 {
    background-color: var(--eas-color-error);
  }
}
</style>
