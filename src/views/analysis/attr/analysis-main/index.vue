<template>
  <AnalysisMain :status="analysisResult.status" v-bind="attrs">
    <template #header>
      <AnalysisUpdateTime :time="analysisResult.resultGenerateTime" />
      <div>
        <sort-drop
          v-if="analysisResult.dataQP.groupBy.length > 0 && chartType !== 'pie'"
          v-model="analysisResult.sortType"
          class="mr10"
          @change="groupSortChange" />
        <ChartType v-model="chartType" :data="chartTypeList" />
      </div>
    </template>

    <template #chart>
      <LimitNotice
        v-if="analysisResult.dataDesc"
        v-model="analysisResult.noticeFlag"
        :text="analysisResult.dataDesc" />
      <Chart
        :ref="(ref) => (analysisResult.chartRef = ref)"
        :options="analysisResult.option"
        height="400px" />
    </template>

    <template #table>
      <div v-if="analysisResult.tableData.length > 0">
        <AnalysisTable
          :ref="(ref) => (analysisResult.tableRef = ref)"
          :info="info"
          :columns="analysisResult.columns"
          :data="analysisResult.tableData"
          :isUserCluster="isUserCluster"
          :qp="analysisResult.dataQP"
          fileName="用户分析"
          analysisType="4"
          @getSortArr="getSortArr" />
      </div>
    </template>
  </AnalysisMain>
</template>

<script setup>
import { ref, computed, useAttrs, toRef } from 'vue'
import {
  AnalysisMain,
  ChartType,
  AnalysisTable,
} from '@/views/analysis/components/AnalysisMain/index.js'
import { useAnalysisResult } from '../hooks/analysisResultHooks'

const attrs = useAttrs()
const props = defineProps({
  info: {
    type: Object,
    default() {
      return {}
    },
  },
})
const {
  analysisResult,
  isUserCluster,
  chartTypeList,
  chartType,
  getEchartsData,
  echoGlobalFilters,
  groupSortChange,
} = useAnalysisResult()

const getSortArr = (arr) => {
  analysisResult.sortArr = arr
}
const sortArr = computed(() => analysisResult.sortArr)

defineExpose({
  getEchartsData,
  chartType,
  sortArr,
  sortType: toRef(analysisResult, 'sortType'),
  echoGlobalFilters,
})
</script>

<style lang="scss" scoped></style>
