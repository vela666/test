<script setup>
import { ref, toRef, computed } from 'vue'
import ChartCardHeader from '@/views/see-plate/components/Dashboard/components/ChartCardHeader/index.vue'
import ResultChart from '@/views/analysis/sqlquery/components/ResultChart.vue'
import useDashboardSql from '@/views/analysis/sqlquery/hooks/useDashboardSql.js'
import authEnum from '@/views/analysis/enum.js'

const props = defineProps({
  info: {
    type: Object,
    default: () => {},
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

const resTableRef = ref(null)

const emits = defineEmits(['updReportSet'])

const {
  state,
  getSortArr,
  handleResSortArr,
  handleGetShowChartLabel,
  getData,
  handleRefresh,
  exportTableData,
  chartTypeList,
  getExploreVisualData,
  getInfo,
  cancelCalculate,
  cancelRequest,
} = useDashboardSql({ resTableRef, props })

const disableExport = computed(
  () => JSON.stringify(state.resData) === '{}' || !!state.errMessage
)

defineExpose({
  getData,
  chartTypeList,
  disableExport,
  loading: toRef(state, 'loading'),
  getExploreVisualData,
  getInfo,
  export: exportTableData,
})
defineOptions({
  name: 'Sql',
})
</script>
<template>
  <div class="position-relative h100-percentage">
    <div v-loading="state.loading" class="dashboard-analysis-card">
      <chart-card-header>
        <template #left>
          <AnalysisUpdateTime :time="state.resData.resultGenerateTime" />
        </template>
        <template #right>
          <ShowChartLabel
            :showBorder="false"
            v-model="state.graphConfig.showChartLabel"
            v-if="
              JSON.stringify(state.graphConfig) !== '{}' &&
              state.graphConfig?.graphType !== 6 &&
              state.activeRadio !== 'data'
            "
            @updChart="handleGetShowChartLabel" />
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
                @click="handleRefresh">
                <SvgIcon class="fz16" name="refresh1" />
              </el-button>
            </el-tooltip>
            <Auth :value="authEnum[7].export">
              <el-tooltip
                :content="$t('common.download')"
                placement="top"
                :hide-after="0">
                <el-button
                  class="p0 m0 nd-operate-btn-active fz28"
                  text
                  @click="exportTableData">
                  <SvgIcon class="fz18" name="download" />
                </el-button>
              </el-tooltip>
            </Auth>
          </template>
          <sort-drop
            v-model="state.activeRadio"
            :typeList="chartTypeList"
            :showBorder="false"
            showText></sort-drop>
        </template>
      </chart-card-header>
      <div class="chart-view-body" v-show="!state.loading">
        <div class="w100-percentage h100-percentage" v-if="!state.errMessage">
          <div
            class="w100-percentage h100-percentage"
            v-show="state.activeRadio === 'data'">
            <VxeTableSort
              v-if="JSON.stringify(state.resData) !== '{}'"
              ref="resTableRef"
              min-height="100"
              width="100%"
              max-height="100%"
              :columns="state.columns"
              :data="state.tableData"
              :pageFlag="false"
              @getSortArr="getSortArr"
              :resizable="true">
            </VxeTableSort>
            <div
              v-else
              class="chart-body-empty flex-center flex-level-center h100-percentage">
              <Empty />
            </div>
          </div>
          <div
            v-show="state.activeRadio === 'chart'"
            class="w100-percentage h100-percentage">
            <ResultChart
              :headers="state.headers"
              :rows="state.rows"
              :graphConfig="state.graphConfig"
              :showBtn="false"
              @getSortArr="handleResSortArr"></ResultChart>
          </div>
        </div>
        <div
          v-else
          class="flex-center flex-level-center h100-percentage overflow-auto">
          <Empty :desc="state.errMessage" />
        </div>
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
<style lang="scss" scoped></style>
