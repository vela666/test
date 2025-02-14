<script setup>
import { ref, toRef, computed, reactive, nextTick, watch, provide } from 'vue'
import ChartCardHeader from '@/views/see-plate/components/Dashboard/components/ChartCardHeader/index.vue'
import useDashboardFunnel from '@/views/analysis/funnel/hooks/useDashboardFunnel.js'
import DropDownSelector from '@/views/analysis/event/components/DropDownSelector/index.vue'
import CustomTable from '@/views/analysis/funnel/analysis-main/CustomTable.vue'
import { debounce } from 'lodash-es'
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

const coverLossList = reactive([
  {
    label: '转化',
    value: 'cover',
  },
  {
    label: '流失',
    value: 'loss',
  },
])

const {
  analysisResult,
  dashboardStepLabelWidth,
  chartTypeList,
  chartType,
  getStepTitle,
  stepStart,
  stepEnd,
  onDatazoom,
  renderChartData,
  handleStepChange,
  download,
  echoGlobalFilters,
  getData,
  reCalcute,
  getInfo,
  initTypeList,
  dashboardChartTypeList,
  cancelCalculate,
  cancelRequest,
  getSetting,
} = useDashboardFunnel(props, emits)

const searchValue = ref('')
const groupOptions = computed(() => {
  return analysisResult.groupOptions.filter((item) =>
    item.toLocaleLowerCase().includes(searchValue.value.toLocaleLowerCase())
  )
})
const showGroups = computed(
  () =>
    analysisResult.dataQP.groupBy?.length > 0 &&
    analysisResult.groupOptions.length > 0
)

watch(
  () => props.w,
  debounce((newValue) => {
    if (newValue > 6) {
      analysisResult.chartBarShowNum = 8
    } else {
      analysisResult.chartBarShowNum = 5
    }
    renderChartData()
    setTimeout(() => {
      onDatazoom()
    })
  }, 300),
  {
    immediate: true,
  }
)

const disableExport = computed(
  () => analysisResult.status !== 1 || !!analysisResult.errMessage
)

defineExpose({
  getData,
  reCalcute,
  chartTypeList: initTypeList,
  getInfo,
  disableExport,
  loading: toRef(analysisResult, 'loading'),
  export: download,
  getSetting,
})

const appId = computed(
  () => props?.params?.appId || sessionStorage.getItem('appId')
)

provide('appId', appId)

defineOptions({
  name: 'Funnel',
})
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
          <DropSelectorSingle
            v-if="chartType === 'table'"
            :showBorder="false"
            :hidden="false"
            :width="50"
            v-model="analysisResult.funnelType"
            :data="coverLossList">
          </DropSelectorSingle>
          <DropDownSelector
            v-else-if="showGroups"
            placement="bottom-start"
            @change="searchValue = ''"
            :showBorder="false">
            <template #default>
              {{ $t('analysis.group') }}({{
                analysisResult.groupCheck.length
              }}/{{ analysisResult.groupOptions.length }})
            </template>
            <template #content>
              <div style="width: 160px; overflow: hidden">
                <CommonInput
                  :placeholder="$t('common.pleaseEnter')"
                  v-model="searchValue" />
                <template v-if="groupOptions.length > 0">
                  <div
                    class="mt10 ml10 mb5 fz14"
                    style="color: var(--eas-color-warning)">
                    {{ $t('analysis.funnel.maximumSelect') }}
                  </div>
                  <el-scrollbar :max-height="260">
                    <el-checkbox-group
                      class="custom-checkbox-group"
                      v-model="analysisResult.groupCheck">
                      <el-checkbox
                        class="custom-content-item"
                        v-for="(item, index) in groupOptions"
                        :key="`custom-content-item_${index}`"
                        :label="item"
                        :value="item"
                        :disabled="
                          analysisResult.groupCheck.length >= 4 &&
                          !analysisResult.groupCheck.includes(item)
                        ">
                        <div class="custom-content-item__label" v-showTips>
                          {{ item }}
                        </div>
                      </el-checkbox>
                    </el-checkbox-group>
                  </el-scrollbar>
                </template>
                <div v-else class="mt20 mb20">
                  <empty />
                </div>
              </div>
            </template>
          </DropDownSelector>
          <el-cascader
            v-model="analysisResult.steps"
            :options="analysisResult.stepOptions"
            :separator="$t('common.to')"
            @change="handleStepChange"
            :style="`width: ${dashboardStepLabelWidth}px;border:none`"
            :class="['ml10', { mr10: !showGroups }]" />
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
            <Auth :value="authEnum[3].export">
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
            v-model="chartType"
            :typeList="dashboardChartTypeList"
            :showBorder="false"
            showText></sort-drop>
        </template>
      </chart-card-header>
      <div class="chart-view-body" v-show="!analysisResult.loading">
        <div class="h100-percentage" v-if="!analysisResult.errMessage">
          <div
            v-show="chartType !== 'table' && analysisResult.status"
            class="h100-percentage">
            <div
              class="h100-percentage overflow-auto"
              :ref="(ref) => (analysisResult.chartEleRef = ref)">
              <Chart
                :ref="(ref) => (analysisResult.chartRef = ref)"
                :options="analysisResult.options"
                @change="onDatazoom"
                height="100%"
                :width="analysisResult.chartWidth" />
            </div>
          </div>
          <div
            v-show="chartType === 'table' && analysisResult.status"
            class="h100-percentage">
            <span v-show="analysisResult.status">
              <CustomTable
                :ref="(ref) => (analysisResult.CustomTableRef = ref)"
                v-model:result="analysisResult"
                min-height="100"
                width="100%"
                max-height="100%"
                :hlFlag="false"
                :hrFlag="false"
                :titleFlag="false"
                :pagination="false"
                :needHeader="false"
                :chartType="chartType"
                :stepStart="stepStart"
                :stepEnd="stepEnd"></CustomTable>
            </span>
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
<style lang="scss" scoped>
:deep(.el-cascader) {
  .el-input__wrapper {
    box-shadow: none !important;
    padding: 0;
    .el-input__suffix {
      display: none;
    }
  }
  &:not(.is-disabled):hover,
  :hover {
    .el-input__wrapper {
      box-shadow: none !important;
    }
  }
}
</style>
