<!--
  * *************************************************
  * @file 间隔分析
  * @author fengsi<294068744@qq.com>
  * @date 2024-03-04 18:19:20 *
  *************************************************
-->

<script setup>
import { computed, nextTick, provide } from 'vue'
import userIntervalHook from '@/views/analysis/interval/hooks'

import NumTypeSelector from '@/views/analysis/interval/components/NumTypeSelector/index.vue'
import GraphTypeSelector from '@/views/analysis/interval/components/GraphTypeSelector/index.vue'
import ChartCardHeader from '@/views/see-plate/components/Dashboard/components/ChartCardHeader/index.vue'
import IntervalGroupDetailDialog from '@/views/analysis/interval/components/IntervalGroupDetailDialog/index.vue'
import IntervalRange from '@/views/analysis/interval/components/IntervalRange/index.vue'
import SvgButton from '@/components/AnalysisLayout/SvgButton.vue'
import authEnum from '@/views/analysis/enum.js'
import { AnalysisTable } from '@/views/analysis/components/AnalysisMain/index.js'
import { formatDateWithWeek, isValidNumByCluster } from '@/utils'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'Interval',
})

const props = defineProps({
  params: {
    type: Object,
    default() {
      return {
        condition: {},
        reqConditionParam: {},
        dateRange: {},
        groupBy: [],
      }
    },
  },
  info: {
    type: Object,
    default: () => {},
  },
  w: {
    type: Number,
    default: 0,
  },
  explore: {
    type: Boolean,
    default: false,
  },
})
const emits = defineEmits([])

const {
  state,
  timeZoneStore,
  requestParams,
  dayOptions,
  groupOptions,
  analysedData,
  analysedResult,
  getRequestParams,
  handleIntervalCalculate,
  handleChange,
  handleExport,
  handleChartNumVisibleChange,
  handleDayGroup3NumChange,
  handleGroup8Change,
  getTable12Tooltip,
  getTable13Tooltip,
  handleTableSort,
  handleGraphTypeChange,
  getInfo,
  cancelCalculate,
  cancelRequest,
  getSetting,
} = userIntervalHook(props, {
  emits,
})

/**
 * @description: 间隔分析结果分群参数
 * @return {*}
 */
const getIntervalClusterParams = ({ row, item, i }) => {
  const params = {
    data: {
      clusterSql: analysedData.value.resultClusterSql,
      intervalGroup: item.field === 'userNum' ? '' : item.field,
      statisticDate:
        row.date === t('analysis.total')
          ? ''
          : formatDateWithWeek(row.date, true),
    },
    qp: JSON.stringify(getRequestParams()),
    type: 8,
    groupValue: [],
  }
  return params
}

const appId = computed(
  () => props?.params?.appId || sessionStorage.getItem('appId')
)

provide('appId', appId)

const disableExport = computed(
  () => analysedData?.analysis?.days?.length === 0 || !!state.errMessage
)

defineExpose({
  loading: computed(() => state.loading),
  chartTypeList: computed(() => state.graphTypeSelectorRef.getData()),
  disableExport,
  export: handleExport,
  /**
   * @description type refresh(刷新)/date(日期)/timeZone(时区)/condition(条件)/notReq(不要请求)
   * @author fengsi<294068744@qq.com>
   * @date 2024-03-15 12:04:58
   */
  getData: (params) => {
    if (params?.type === 'notReq') return

    if (params?.type === '') {
      if (
        props.params.dateRange?.startTime &&
        props.params.dateRange?.endTime
      ) {
        requestParams.dateRange = props.params.dateRange
      }
      if (props.params.reqConditionParam?.filts?.length > 0) {
        state.qp.conditionFilts = props.params.reqConditionParam
      }
    }

    if (props.explore) {
      state.qp.conditionFilts = props.params.reqConditionParam
      state.qp.groupBy = props.params.groupBy
    }

    if (params?.type === 'timeZone') {
      requestParams.timeZone = timeZoneStore.timeZone
    } else if (params?.type === 'date') {
      if (props.params.dateRange.startTime && props.params.dateRange.endTime) {
        requestParams.dateRange = props.params.dateRange
      } else {
        const { eventView } = state.qp

        requestParams.dateRange.diff = eventView.recentDay
        requestParams.dateRange.recentDay = eventView.recentDay
        requestParams.dateRange.shortcutType = eventView.shortcutType
        requestParams.dateRange.startTime = eventView.startTime
        requestParams.dateRange.endTime = eventView.endTime
      }
    } else if (params?.type === 'condition') {
      state.qp.conditionFilts = props.params.reqConditionParam
    }

    return handleIntervalCalculate(params?.type === 'refresh')
  },
  getInfo,
  getSetting,
})
</script>

<template>
  <div class="position-relative h100-percentage">
    <div v-loading="state.loading" class="interval-chart-card">
      <div class="h100-percentage" v-show="!state.loading">
        <chart-card-header>
          <template #left>
            <DateRangeSelect
              v-model="requestParams.dateRange"
              :show-border="false"
              :date-icon="false"
              placement="bottom-start"
              @change="handleChange" />
            <PeriodTypeSelect
              v-model="requestParams.timeParticle"
              :limit="['day', 'hour', 'month', 'summary']"
              :show-border="false"
              @change="handleChange" />
            <template v-if="requestParams.graphType === 3">
              <VirtualizedSelector
                v-model="requestParams.groupCheck.checkedTime"
                :options="dayOptions"
                :disabled="dayOptions.length === 0"
                :clearable="false"
                :show-border="false"
                with-radio
                :persistent-label="$t('analysis.time')"
                style="width: 2em"
                @change="handleDayGroup3NumChange" />
              <VirtualizedSelector
                v-if="analysedData.analysis.groupValue"
                v-model="requestParams.groupCheck.barChecked"
                :key="requestParams.groupCheck.barChecked"
                :options="groupOptions"
                :disabled="groupOptions.length === 0"
                :clearable="false"
                :show-border="false"
                with-radio
                :persistent-label="$t('analysis.group')"
                style="width: 2em"
                @change="handleDayGroup3NumChange" />
              <NumTypeSelector
                v-model="requestParams.groupCheck.intervalType"
                type="dropdown"
                :show-border="false"
                @change="handleDayGroup3NumChange" />
            </template>
            <VirtualizedSelector
              v-if="
                analysedData.analysis.groupValue &&
                requestParams.graphType === 8
              "
              v-model="requestParams.groupCheck.boxplotChecked"
              :key="requestParams.groupCheck.boxplotChecked"
              :options="groupOptions"
              :disabled="groupOptions.length === 0"
              :clearable="false"
              :show-border="false"
              :multiple-limit="4"
              multiple
              with-checkbox
              :persistent-label="$t('analysis.group')"
              style="width: 2em"
              @visible-change="handleGroup8Change" />
            <IntervalRange
              @change="handleChange"
              v-if="requestParams.graphType === 3"
              :showBorder="false"
              ref="intervalRangeRef"
              :intervalLimit="{
                time: state.qp?.intervalRange?.value,
                type: state.qp?.intervalRange?.unit,
              }"
              v-model="requestParams.intervalSplit" />
            <AnalysisUpdateTime
              :time="analysedData.resultGenerateTime"
              @change="handleChange" />
          </template>

          <template #right>
            <!--        <ShowChartLabel-->
            <!--          v-model="requestParams.groupCheck.chartNumVisible"-->
            <!--          :show-border="false"-->
            <!--          @updChart="handleChartNumVisibleChange" />-->
            <template v-if="state.qp.conditionFilts">
              <!--              <el-tooltip content="刷新" placement="top" :hide-after="0">-->
              <!--                <svg-button-->
              <!--                  text-->
              <!--                  icon="refresh"-->
              <!--                  @click="handleIntervalCalculate(true)"></svg-button>-->
              <!--              </el-tooltip>-->
              <Auth :value="authEnum[8].export">
                <el-tooltip
                  :content="$t('common.download')"
                  placement="top"
                  :hide-after="0">
                  <svg-button
                    text
                    icon="async-export"
                    :disabled="analysedData.analysis.days?.length === 0"
                    @click="handleExport"></svg-button>
                </el-tooltip>
              </Auth>
            </template>
            <GraphTypeSelector
              :ref="(ref) => (state.graphTypeSelectorRef = ref)"
              v-model="requestParams.graphType"
              type="dropdown"
              @change="handleGraphTypeChange" />
          </template>
        </chart-card-header>

        <div class="chart-card-body">
          <template
            v-if="analysedData.analysis.days?.length > 0 && !state.errMessage">
            <Chart
              v-if="[8, 3].includes(requestParams.graphType)"
              :ref="(ref) => (analysedResult.chartRef = ref)"
              :options="
                analysedResult.chartOption[requestParams.graphType] || {}
              "
              height="100%" />
            <div class="h100-percentage">
              <AnalysisTable
                v-if="[12, 13].includes(requestParams.graphType)"
                :ref="(ref) => (analysedResult.tableRef = ref)"
                :columns="
                  analysedResult.tableColumns[requestParams.graphType] || []
                "
                :data="analysedResult.tableData[requestParams.graphType] || []"
                :analysisType="8"
                :pagination="false"
                :needHeader="false"
                width="100%"
                max-height="100%"
                @getSortArr="handleTableSort">
                <template #column="{ row, item, i }">
                  <template v-if="i === 0">
                    <div
                      v-if="analysedData.analysis.value"
                      class="text-align-left">
                      {{ row[item.prop] }}
                    </div>
                    <div v-else class="text-align-left">
                      <el-button
                        text
                        :disabled="row.groupInterval?.length === 0"
                        style="padding: 0"
                        @click.stop="
                          state.groupDetailRef?.open(
                            { row, item, i },
                            requestParams.graphType,
                            analysedData
                          )
                        ">
                        <svg-icon name="add1" class="mr3" />
                        {{ row[item.prop] }}
                      </el-button>
                    </div>
                  </template>
                  <template v-else>
                    <el-tooltip
                      v-if="requestParams.graphType === 12"
                      placement="top"
                      :content="
                        getTable12Tooltip({ row, item, i }, analysedData)
                      ">
                      <span
                        v-if="
                          item.prop === 'userNum' &&
                          isValidNumByCluster(row[`_${item.prop}`])
                        ">
                        <span
                          class="text-underline c-pointer"
                          @click="
                            analysedResult.tableRef.openUserListDialog(
                              getIntervalClusterParams({
                                row,
                                item,
                                i,
                              })
                            )
                          ">
                          {{ row[`_${item.prop}`]?.toLocaleString() }}
                        </span>
                        <Tooltip
                          :content="$t('analysis.createResultGroup')"
                          placement="right">
                          <svg-icon
                            name="creator1"
                            class="c-pointer"
                            @click="
                              analysedResult.tableRef.createCluster(
                                getIntervalClusterParams({
                                  row,
                                  item,
                                  i,
                                })
                              )
                            " />
                        </Tooltip>
                      </span>
                      <span v-else>
                        {{ row[`_${item.prop}`]?.toLocaleString() }}
                      </span>
                    </el-tooltip>
                    <el-tooltip
                      v-else
                      placement="top"
                      :content="
                        getTable13Tooltip({ row, item, i }, analysedData)
                      ">
                      <el-space
                        :size="0"
                        direction="vertical"
                        style="line-height: 1.2">
                        <span
                          v-if="
                            isValidNumByCluster(row[item.prop]?._userNumData)
                          ">
                          <span
                            class="text-underline c-pointer"
                            @click="
                              analysedResult.tableRef.openUserListDialog(
                                getIntervalClusterParams({
                                  row,
                                  item,
                                  i,
                                })
                              )
                            ">
                            {{ row[item.prop]?._userNumData?.toLocaleString() }}
                          </span>
                          <Tooltip
                            :content="$t('analysis.createResultGroup')"
                            placement="right">
                            <svg-icon
                              name="creator1"
                              class="c-pointer"
                              @click="
                                analysedResult.tableRef.createCluster(
                                  getIntervalClusterParams({
                                    row,
                                    item,
                                    i,
                                  })
                                )
                              " />
                          </Tooltip>
                        </span>
                        <span v-else>
                          {{ row[item.prop]?._userNumData?.toLocaleString() }}
                        </span>
                        <span>
                          {{ row[item.prop]?._numData?.toLocaleString() }}次
                        </span>
                      </el-space>
                    </el-tooltip>
                  </template>
                </template>
              </AnalysisTable>
            </div>
          </template>

          <Empty v-else :desc="state.errMessage || $t('common.noData')" />
        </div>
        <IntervalGroupDetailDialog
          :ref="(ref) => (state.groupDetailRef = ref)"
          :group-column="analysedData.analysis.groupValue?._groupColumn"
          :table-columns="analysedResult.tableColumns[requestParams.graphType]"
          :qp="getRequestParams" />
      </div>
    </div>
    <el-button
      v-if="state.loading && cancelRequest.requestId"
      round
      class="m0 skip cancel-btn"
      @click="cancelCalculate">
      {{ $t('analysis.cancelCalculation') }}
    </el-button>
  </div>
</template>

<style scoped lang="scss">
.interval-chart-card {
  overflow: hidden;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;

  .chart-card-body {
    overflow: hidden;
    flex-grow: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    height: calc(100% - 40px);

    > .h100-percentage,
    > .chart {
      width: 100%;
      height: 100%;
    }

    :deep(.vxe-table) {
      .vxe-body--column {
        vertical-align: middle;
      }
    }
  }
}
</style>
