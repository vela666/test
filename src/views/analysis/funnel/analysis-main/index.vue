<template>
  <AnalysisMain
    show-header
    :status="analysisResult.status"
    :message="analysisResult.errMessage">
    <template #header>
      <div class="flex-center">
        <DateRangeSelect
          v-model="analysisResult.dateRange"
          placement="bottom-start"
          @change="handleChangeDate" />
        <el-cascader
          v-model="analysisResult.steps"
          :options="analysisResult.stepOptions"
          :separator="$t('analysis.funnel.to')"
          @change="handleStepChange"
          :style="`width: ${stepLabelWidth}px`"
          :class="['ml10', { mr10: !showGroups }]" />

        <DropDownSelector
          placement="bottom-start"
          @change="searchValue = ''"
          v-if="showGroups">
          <template #default>
            {{ $t('analysis.group') }}({{ analysisResult.groupCheck.length }}/{{
              analysisResult.groupOptions.length
            }})
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

        <AnalysisUpdateTime
          v-if="analysisResult.status !== -1"
          :time="analysisResult.resultGenerateTime" />
      </div>

      <ChartType
        v-model="chartType"
        :data="chartTypeList"
        v-if="analysisResult.status === 1" />
    </template>

    <template #chart>
      <LimitNotice
        v-if="analysisResult.dataDesc"
        v-model="analysisResult.noticeFlag"
        :text="analysisResult.dataDesc" />
      <div
        style="overflow: auto"
        :ref="(ref) => (analysisResult.chartEleRef = ref)">
        <Chart
          :ref="(ref) => (analysisResult.chartRef = ref)"
          :options="analysisResult.options"
          height="400px"
          @change="onDatazoom"
          :width="analysisResult.chartWidth" />
      </div>
    </template>

    <template #table>
      <div
        v-if="analysisResult.tableData[analysisResult.funnelType].length > 0">
        <CustomTable
          :ref="(ref) => (analysisResult.CustomTableRef = ref)"
          v-model:result="analysisResult"
          :getStepTitle="getStepTitle"
          :chartType="chartType"
          :stepStart="stepStart"
          :stepEnd="stepEnd"
          @download="download"></CustomTable>
      </div>
    </template>
  </AnalysisMain>
</template>

<script setup>
import { ref, toRef, computed, nextTick } from 'vue'
import {
  AnalysisMain,
  ChartType,
} from '@/views/analysis/components/AnalysisMain/index.js'
import { useFunnelResultHooks } from '../hooks/funnelResultHooks.js'
import DropDownSelector from '@/views/analysis/event/components/DropDownSelector/index.vue'
import CustomTable from './CustomTable.vue'

const props = defineProps({
  info: {
    type: Object,
    default() {
      return {}
    },
  },
})
const emit = defineEmits(['calcute'])

const {
  analysisResult,
  stepLabelWidth,
  chartTypeList,
  chartType,
  getStepTitle,
  stepStart,
  stepEnd,
  onDatazoom,
  handleStepChange,
  getEchartsData,
  download,
  echoGlobalFilters,
  setErrMessage,
} = useFunnelResultHooks(props)

const searchValue = ref('')
const groupOptions = computed(() => {
  return analysisResult.groupOptions.filter((item) =>
    item.toLocaleLowerCase().includes(searchValue.value.toLocaleLowerCase())
  )
})

const handleChangeDate = () => {
  if (analysisResult.status !== -1) {
    nextTick(() => {
      emit('calcute', 'date')
    })
  }
}

const dateRange = computed(() => analysisResult.dateRange)
const showGroups = computed(
  () =>
    analysisResult.dataQP.groupBy?.length > 0 &&
    analysisResult.groupOptions.length > 0
)

const groupDetailRef = ref(null)

const errMessage = computed(() => {
  return analysisResult.errMessage
})

defineExpose({
  chartType,
  steps: toRef(analysisResult, 'steps'),
  funnelType: toRef(analysisResult, 'funnelType'),
  groupCheck: toRef(analysisResult, 'groupCheck'),
  dateRange,
  getEchartsData,
  echoGlobalFilters,
  setErrMessage,
  errMessage,
})
</script>

<style lang="scss" scoped>
:deep(.el-cascader) {
  .el-input__suffix {
    color: inherit;
  }
}

.custom-content-item__label {
  max-width: 130px;
}
</style>
