<script setup>
import { ref, toRef, computed, provide } from 'vue'
import ChartCardHeader from '@/views/see-plate/components/Dashboard/components/ChartCardHeader/index.vue'
import CustomTable from '@/views/analysis/attributed/analysis-main/CustomTable.vue'
import useDashboard from '@/views/analysis/attributed/hooks/useDashboard.js'
import authEnum from '@/views/analysis/enum.js'

const props = defineProps({
  info: {
    type: Object,
    default: () => null,
  },
  w: {
    type: Number,
    default: 0,
  },
  explore: {
    // 探索
    type: Boolean,
    default: false,
  },
  params: {
    type: Object,
    default: () => null,
  },
})

const emits = defineEmits(['updReportSet'])

const {
  analysisResult,
  download,
  getData,
  reCalcute,
  getInfo,
  initTypeList,
  dashboardChartTypeList,
  cancelCalculate,
  cancelRequest,
  getSetting,
} = useDashboard(props, emits)

const getSortArr = (arr) => {
  analysisResult.sortArr = arr
}

const disableExport = computed(
  () => analysisResult.status !== 1 || !!analysisResult.errMessage
)

const appId = computed(
  () => props?.params?.appId || sessionStorage.getItem('appId')
)

provide('appId', appId)

defineExpose({
  getData,
  chartTypeList: initTypeList,
  getInfo,
  disableExport,
  loading: toRef(analysisResult, 'loading'),
  export: download,
  getSetting,
})

defineOptions({ name: 'Attributed' })
</script>
<template>
  <div class="position-relative h100-percentage">
    <div v-loading="analysisResult.loading" class="dashboard-analysis-card">
      <chart-card-header>
        <template #left>
          <DateRangeSelect
            :showBorder="false"
            :dateIcon="false"
            v-model="analysisResult.dateRange"
            placement="bottom-start"
            @change="() => reCalcute(false)" />
          <AnalysisUpdateTime :time="analysisResult.resultGenerateTime" />
        </template>
        <template #right>
          <!-- 图表类型 -->
          <!-- 探索展示 -->
          <template v-if="explore">
            <el-tooltip
              :content="$t('common.refresh')"
              placement="top"
              :hide-after="0">
              <el-button
                class="p0 m0 nd-operate-btn-active fz28"
                text
                @click="reCalcute(true)">
                <SvgIcon class="fz16" name="refresh1" />
              </el-button>
            </el-tooltip>
            <Auth :value="authEnum[6].export">
              <el-tooltip
                :content="$t('common.download')"
                placement="top"
                :hide-after="0">
                <el-button
                  class="p0 m0 nd-operate-btn-active fz28"
                  text
                  :disabled="disableExport"
                  @click="download">
                  <SvgIcon class="fz18" name="download" />
                </el-button>
              </el-tooltip>
            </Auth>
          </template>
          <sort-drop
            modelValue="table"
            :typeList="dashboardChartTypeList"
            :showBorder="false"
            showText></sort-drop>
        </template>
      </chart-card-header>
      <div class="chart-view-body" v-show="!analysisResult.loading">
        <div class="h100-percentage" v-if="!analysisResult.errMessage">
          <div class="h100-percentage" v-show="analysisResult.status">
            <CustomTable
              :ref="(ref) => (analysisResult.CustomTableRef = ref)"
              v-model:result="analysisResult"
              :pagination="false"
              :needHeader="false"
              min-height="100"
              width="100%"
              max-height="100%"
              @getSortArr="getSortArr" />
          </div>
          <div
            v-show="!analysisResult.status"
            class="chart-body-empty flex-center flex-level-center h100-percentage">
            <Empty />
          </div>
        </div>
        <div
          v-else
          class="flex-center flex-level-center h100-percentage overflow-auto">
          <Empty :desc="analysisResult.errMessage" />
        </div>
      </div>
    </div>
    <el-button
      v-if="analysisResult.loading && cancelRequest.requestId"
      round
      class="m0 skip cancel-btn"
      @click="cancelCalculate">
      {{ $t('analysis.cancelCalculation') }}
    </el-button>
  </div>
</template>
<style lang="scss" scoped></style>
