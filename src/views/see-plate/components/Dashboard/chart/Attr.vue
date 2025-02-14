<template>
  <div class="position-relative h100-percentage">
    <DashboardChartLayout
      :loading="analysisResult.loading"
      :status="analysisResult.status"
      :errMessage="analysisResult.errMessage">
      <template #header>
        <chart-card-header v-if="w > 3 || explore">
          <template #left>
            <AnalysisUpdateTime :time="analysisResult.resultGenerateTime" />
            <template
              v-if="
                analysisResult.dataQP?.groupBy.length > 0 &&
                chartType !== 'table' &&
                chartType !== 'pie'
              ">
              <sort-drop
                :showBorder="false"
                placement="bottom"
                v-model="analysisResult.sortType"
                @change="groupSortChange" />
            </template>
          </template>
          <template #right>
            <template v-if="explore">
              <el-tooltip
                :content="$t('common.refresh')"
                placement="top"
                :hide-after="0">
                <el-button
                  class="p0 m0 nd-operate-btn-active fz28"
                  text
                  @click="getData({ type: 'refresh' })">
                  <SvgIcon class="fz16" name="refresh1" />
                </el-button>
              </el-tooltip>

              <Auth :value="authEnum[4].export">
                <el-tooltip
                  :content="$t('common.download')"
                  placement="top"
                  :hide-after="0">
                  <el-button
                    class="p0 m0 nd-operate-btn-active fz28"
                    text
                    :disabled="disableExport"
                    @click="exportData">
                    <SvgIcon class="fz18" name="download" />
                  </el-button>
                </el-tooltip>
              </Auth>
            </template>
            <!-- 图表类型 -->
            <sort-drop
              v-if="chartTypeList.length > 0"
              v-model="chartType"
              :typeList="dashboardChartTypeList"
              :showBorder="false"
              showText></sort-drop>
          </template>
        </chart-card-header>
      </template>

      <template #default>
        <div class="h100-percentage" v-show="!analysisResult.loading">
          <!-- 小图展示 -->
          <!-- <div class="h100-percentage" v-if="!analysisResult.errMessage"> -->
          <MiniView
            v-if="w <= 3 && !explore"
            :data="miniInfo"
            :time="analysisResult.resultGenerateTime"
            :info="info"
            :rate="false" />
          <div v-show="w > 3 || explore" class="h100-percentage">
            <Chart
              v-if="
                chartType !== 'table' &&
                analysisResult.status &&
                (w > 3 || explore)
              "
              :ref="(ref) => (analysisResult.chartRef = ref)"
              :options="analysisResult.option"
              height="100%" />

            <div class="h100-percentage" v-show="chartType === 'table'">
              <AnalysisTable
                :ref="(ref) => (analysisResult.tableRef = ref)"
                :info="info"
                :columns="analysisResult.columns"
                :data="analysisResult.tableData"
                :isUserCluster="isUserCluster"
                :qp="analysisResult.dataQP"
                :pagination="false"
                :needHeader="false"
                fileName="用户分析"
                min-height="100"
                width="100%"
                analysisType="4"
                max-height="100%"
                @getSortArr="getSortArr" />
            </div>
          </div>
          <!-- </div> -->
          <!-- <div
            v-else
            class="flex-center flex-level-center h100-percentage overflow-auto">
            <Empty :desc="analysisResult.errMessage" />
          </div> -->
        </div>
      </template>
    </DashboardChartLayout>
    <el-button
      v-if="analysisResult.loading && cancelRequest.requestId"
      round
      class="m0 skip cancel-btn"
      @click="cancelCalculate">
      {{ $t('analysis.cancelCalculation') }}
    </el-button>
  </div>
</template>

<script setup>
import { computed, toRef, provide, watch } from 'vue'
import ChartCardHeader from '@/views/see-plate/components/Dashboard/components/ChartCardHeader/index.vue'
import { useAttrDashBoardHooks } from '@/views/analysis/attr/hooks/useDashboardAttr'
import { AnalysisTable } from '@/views/analysis/components/AnalysisMain/index.js'
import SvgButton from '@/components/AnalysisLayout/SvgButton.vue'
import MiniView from './eventAnalysis/components/MiniView.vue'
import authEnum from '@/views/analysis/enum.js'

defineOptions({
  name: 'Attr',
})

const props = defineProps({
  info: {
    type: Object,
    default: () => {},
  },
  explore: {
    // 探索
    type: Boolean,
    default: false,
  },
  w: {
    type: Number,
    default: 0,
  },
  // 公共条件参数
  params: {
    type: Object,
    default: () => {},
  },
})

const emit = defineEmits(['updReportSet'])

const {
  analysisResult,
  miniInfo,
  chartType,
  chartTypeList,
  isUserCluster,
  dashboardChartTypeList,
  initTypeList,
  getData,
  exportData,
  getInfo,
  cancelCalculate,
  cancelRequest,
  groupSortChange,
} = useAttrDashBoardHooks(props)

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
  export: exportData,
  isMini: () => analysisResult.isMini,
  getInfo,
  cancelCalculate,
  loading: toRef(analysisResult, 'loading'),
  disableExport,
  getSetting() {
    return {
      // 探索分组项 不过滤  ['__fid', '__bid', '__did']
      filterable: false,
      groupLimit: ['eventField'],
      conditionLimit: ['eventField'],
    }
  },
})
</script>
