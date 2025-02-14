<template>
  <AnalysisMain
    show-header
    :status="analysisResult.status"
    :message="analysisResult.errMessage">
    <template #header>
      <el-space :size="10">
        <DateRangeSelect
          v-model="analysisResult.dateRange"
          placement="bottom-start"
          @change="reCalcute" />
        <DropSelectorSingle
          :hidden="false"
          v-model:visible="visible"
          v-model="analysisResult.timeParticle"
          :data="timeParticleList"
          @change="reCalcute">
          <template #content="{ item }">
            {{ item.label }}
            <CustomWeek
              v-if="item.value === 'week'"
              v-model="analysisResult.firstDayOfWeek"
              v-model:visible="visible"
              @submit="analysisResult.timeParticle = 'week'"
              @change="reCalcute" />
          </template>
        </DropSelectorSingle>
        <AnalysisUpdateTime
          v-if="analysisResult.status !== -1"
          :time="analysisResult.resultGenerateTime" />
      </el-space>

      <div class="flex-center" v-if="analysisResult.status === 1">
        <ChartType modelValue="table" :data="chartTypeList" />
        <Auth :value="authEnum[6].export">
          <el-button @click="download" class="ml10">
            <svg-icon name="async-export" class="fz16" />
            {{ $t('common.download') }}
          </el-button>
        </Auth>
      </div>
    </template>
    <template #table>
      <div class="h100-percentage">
        <CustomTable
          :ref="(ref) => (analysisResult.CustomTableRef = ref)"
          v-model:result="analysisResult"
          @getSortArr="getSortArr"></CustomTable>
      </div>
    </template>
  </AnalysisMain>
</template>

<script setup>
import { ref, computed, nextTick, reactive } from 'vue'
import {
  AnalysisMain,
  ChartType,
} from '@/views/analysis/components/AnalysisMain/index.js'
import { useScatterResultHooks } from '../hooks/scatterResultHooks'
import CustomWeek from './CustomWeek.vue'
import CustomTable from './CustomTable.vue'
import authEnum from '@/views/analysis/enum.js'

defineOptions({
  name: 'ScatterMain',
})

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
  chartTypeList,
  renderTable,
  reCalcute,
  download,
  echoGlobalFilters,
  timeParticleList,
  visible,
  setErrMessage,
} = useScatterResultHooks(emit, props)

const dateRange = computed(() => analysisResult.dateRange)
const timeParticle = computed(() => analysisResult.timeParticle)
const firstDayOfWeek = computed(() => analysisResult.firstDayOfWeek)

const getSortArr = (arr) => {
  analysisResult.sortArr = arr
}
const sortArr = computed(() => analysisResult.sortArr)

const errMessage = computed(() => {
  return analysisResult.errMessage
})

defineExpose({
  dateRange,
  timeParticle,
  firstDayOfWeek,
  renderTable,
  echoGlobalFilters,
  sortArr,
  setErrMessage,
  errMessage,
})
</script>

<style lang="scss" scoped>
.custom-content-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 32px;
  padding: 10px 6px;
  margin: 0px;
  border-radius: 2px;
  border-radius: var(--eas-border-radius);
  color: var(--eas-text-color-primary);
  cursor: pointer;
  &:hover {
    background-color: var(--eas-hover-color);
  }
}
</style>
