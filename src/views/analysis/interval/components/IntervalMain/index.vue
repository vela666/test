<!--
 * **************************************************
 * @file 右侧主体组件
 * @author fengsi<294068744@qq.com>
 * @date 2024-02-22 10:15:25
 * **************************************************
-->

<script setup>
import { ref, inject, useAttrs } from 'vue'
import {
  AnalysisMain,
  AnalysisTable,
} from '@/views/analysis/components/AnalysisMain/index.js'
import useMainHook from '@/views/analysis/interval/hooks/main-hook'
import GroupDetailDialog from '@/views/analysis/interval/components/GroupDetailDialog/index.vue'
import NumTypeSelector from '@/views/analysis/interval/components/NumTypeSelector/index.vue'
import GraphTypeSelector from '@/views/analysis/interval/components/GraphTypeSelector/index.vue'
import IntervalRange from '../IntervalRange/index.vue'
import authEnum from '@/views/analysis/enum.js'
import { formatDateWithWeek, isValidNumByCluster } from '@/utils'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'IntervalMain',
})

const attrs = useAttrs()
const props = defineProps({})
const emits = defineEmits(['calculate'])

const {
  state: intervalState,
  requestData,
  cancelCalculate,
  cancelRequest,
  sidebarRef,
} = inject('intervalState')
const {
  state,
  particleType,
  analysisResult,
  handleChange,
  handleChartTypeChange,
  handleExport,
  handleGroupsVisibleChange,
  handleDaysOrNumTypeChange,
  getSortArr,
} = useMainHook(props, { emits })

const groupDetailRef = ref(null)
const intervalRangeRef = ref(null)

/**
 * @description: 间隔分析结果分群参数
 * @return {*}
 */
const getIntervalClusterParams = ({ row, item, i }) => {
  const params = {
    data: {
      clusterSql: requestData.value.resultClusterSql,
      intervalGroup: item.field === 'userNum' ? '' : item.field,
      statisticDate:
        row.date === t('analysis.total')
          ? ''
          : formatDateWithWeek(row.date, true),
    },
    qp: JSON.stringify(requestData.value.qp),
    type: 8,
    groupValue: [],
  }
  return params
}

defineExpose({
  state,
  intervalRangeRef,
})
</script>

<template>
  <div class="position-relative w100-percentage h100-percentage">
    <div
      class="w100-percentage h100-percentage"
      v-loading="state.loading || intervalState.loading">
      <div
        class="w100-percentage h100-percentage"
        v-show="!state.loading && !intervalState.loading">
        <analysis-main
          v-show="!intervalState.errMessage"
          show-header
          :status="state.status"
          v-bind="attrs">
          <template #header>
            <el-space>
              <DateRangeSelect
                v-model="intervalState.dateRange"
                placement="bottom-start"
                @change="handleChange" />
              <PeriodTypeSelect
                v-model="particleType.value"
                :limit="particleType.options"
                @change="handleChange" />
              <AnalysisUpdateTime
                v-if="state.status > -1"
                :time="requestData.resultGenerateTime" />
            </el-space>
            <el-space>
              <IntervalRange
                @change="handleChange"
                v-if="intervalState.graphType === 3"
                ref="intervalRangeRef"
                :intervalLimit="sidebarRef.intervalLimit"
                v-model="intervalState.intervalSplit" />
              <virtualized-selector
                v-if="intervalState.graphType === 3"
                v-show="state.status > 0"
                v-model="intervalState.groupCheck.checkedTime"
                :options="state.days"
                :clearable="false"
                with-radio
                :persistent-label="$t('common.date')"
                style="width: 80px"
                @change="handleDaysOrNumTypeChange" />
              <virtualized-selector
                v-if="
                  requestData.analysis.groupValue &&
                  intervalState.graphType === 8
                "
                v-show="state.status > 0"
                v-model="intervalState.groupCheck.boxplotChecked"
                :options="state.unionGroups"
                :clearable="false"
                :multiple-limit="4"
                multiple
                with-checkbox
                :persistent-label="$t('analysis.group')"
                style="width: 80px"
                @visible-change="handleGroupsVisibleChange" />
              <virtualized-selector
                v-if="
                  requestData.analysis.groupValue &&
                  intervalState.graphType === 3
                "
                v-show="state.status > 0"
                v-model="intervalState.groupCheck.barChecked"
                :options="state.unionGroups"
                :clearable="false"
                with-radio
                :persistent-label="$t('analysis.group')"
                style="width: 80px"
                @visible-change="handleGroupsVisibleChange" />
              <NumTypeSelector
                v-if="intervalState.graphType === 3"
                v-model="intervalState.groupCheck.intervalType"
                type="button"
                @change="handleDaysOrNumTypeChange" />
              <GraphTypeSelector
                v-model="intervalState.graphType"
                type="button"
                :limit="[8, 3]"
                @change="handleChartTypeChange" />
            </el-space>
          </template>

          <template #chart>
            <Chart
              :ref="(ref) => (analysisResult.chartRef = ref)"
              :options="analysisResult.chartOption"
              height="260px" />
          </template>

          <template #table>
            <div>
              <analysis-table
                :ref="(ref) => (analysisResult.tableRef = ref)"
                :columns="analysisResult.tableColumns"
                :data="analysisResult.tableData"
                :is-user-cluster="false"
                :qp="analysisResult.tableDataQP"
                file-name="间隔分析"
                @getSortArr="getSortArr"
                :analysisType="8">
                <template #hr>
                  <Auth :value="authEnum[8].export">
                    <el-button @click="handleExport">
                      <svg-icon name="async-export" class="fz16" />
                      {{ $t('common.download') }}
                    </el-button>
                  </Auth>
                </template>
                <template #column="{ item, row, i }">
                  <template v-if="item.prop === 'date'">
                    <template v-if="requestData.analysis.groupValue">
                      <template
                        v-if="
                          (intervalState.graphType === 8 &&
                            row.groupBox?.length === 0) ||
                          (intervalState.graphType === 3 &&
                            row.groupInterval?.length === 0)
                        "
                        >{{ row[item.prop] }}</template
                      >
                      <el-button
                        v-else
                        text
                        style="padding: 0"
                        @click.stop="groupDetailRef?.open({ item, row })">
                        <svg-icon name="add1" class="mr3" />
                        {{ row[item.prop] }}
                      </el-button>
                    </template>
                    <template v-else>{{ row[item.prop] }}</template>
                  </template>
                  <el-tooltip
                    v-else
                    placement="top"
                    :content="item.tooltip(item, row)"
                    popper-class="table-column-popper">
                    <template v-if="intervalState.graphType === 8">
                      <span
                        v-if="
                          item.prop === 'userNum' &&
                          isValidNumByCluster(row[`_${item.prop}`])
                        ">
                        <span
                          class="text-underline c-pointer"
                          @click="
                            analysisResult.tableRef.openUserListDialog(
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
                              analysisResult.tableRef.createCluster(
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
                    </template>
                    <el-space
                      v-else-if="intervalState.graphType === 3"
                      direction="vertical"
                      :size="0">
                      <span
                        v-if="isValidNumByCluster(row[`_${item.prop}`]?.[0])">
                        <span
                          class="text-underline c-pointer"
                          @click="
                            analysisResult.tableRef.openUserListDialog(
                              getIntervalClusterParams({
                                row,
                                item,
                                i,
                              })
                            )
                          ">
                          {{ row[`_${item.prop}`]?.[0]?.toLocaleString() }}
                        </span>
                        <Tooltip
                          :content="$t('analysis.createResultGroup')"
                          placement="right">
                          <svg-icon
                            name="creator1"
                            class="c-pointer"
                            @click="
                              analysisResult.tableRef.createCluster(
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
                        {{ row[`_${item.prop}`]?.[0]?.toLocaleString() }}
                      </span>
                      <span>
                        {{ row[`_${item.prop}`]?.[1]?.toLocaleString() }}
                        {{ t('analysis.interval.times') }}
                      </span>
                    </el-space>
                  </el-tooltip>
                </template>
              </analysis-table>
            </div>
          </template>
        </analysis-main>
        <div
          v-show="intervalState.errMessage"
          class="flex-center flex-level-center h100-percentage overflow-auto">
          <Empty :desc="intervalState.errMessage" />
        </div>
      </div>
    </div>
    <el-button
      v-if="intervalState.loading && cancelRequest.requestId"
      round
      class="m0 skip cancel-btn"
      @click="cancelCalculate">
      {{ $t('analysis.cancelCalculation') }}
    </el-button>
  </div>
  <GroupDetailDialog
    ref="groupDetailRef"
    :group-column="requestData.analysis.groupValue?.groupColumn.split(',')"
    :table-columns="analysisResult.tableColumns"
    :requestData="requestData" />
</template>

<style scoped lang="scss"></style>
