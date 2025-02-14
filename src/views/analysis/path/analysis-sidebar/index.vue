<template>
  <AnalysisLeft>
    <AnalysisIndexLabel
      :label="$t('analysis.path.eventAnalysis')"
      class="ml20"
      :tip="$t('analysis.path.eventAnalysisTips')" />
    <!-- 参与分析的事件 -->
    <div class="analysis_item eas-block-container analysis-hover__bg">
      <IndexSelectMultiple
        v-model="analysis.eventNames"
        @change="eventChange" />

      <PathAnalysisEvent
        :ref="(ref) => (analysis.eventFieldRef = ref)"
        v-model="analysis.event"
        :sourceEvent="analysis.sourceEvent"
        v-model:watchFlag="watchState.eventWatch" />
    </div>

    <!-- 分析路径以 -->
    <AnalysisIndexLabel
      :label="$t('analysis.path.analyzePath')"
      class="ml20 mt10" />
    <PathSourceEvent
      :ref="(ref) => (analysis.sourceEventRef = ref)"
      v-model="analysis.sourceEvent"
      v-model:watchFlag="watchState.sourceEventWatch" />

    <!-- 会话间隔时长 -->
    <AnalysisDuration
      v-model="session"
      :title="$t('analysis.path.durationSessionInterval')"
      :tip="$t('analysis.path.durationSessionIntervalTips')"
      layout="second,minute,hour"
      :max-minute="999" />

    <!-- 用户满足 -->
    <AnalysisGlobalFilter
      :title="$t('analysis.path.userAccordWith')"
      v-model="state.conditionFilters"
      :data="state.globalFieldsData"
      @add="addGlobalFilter"
      @remove="removeGlobalFilter" />

    <template #footer>
      <AnalysisFooter
        reportType="path"
        :chartType="chartType"
        :loading="loading"
        :reportInfo="reportInfo"
        :qp="getParams"
        @calcute="calcute"
        @saveDraft="saveDraft"
        @paddingDraft="paddingDraft"
        v-bind="attrs" />
    </template>
  </AnalysisLeft>
</template>

<script setup>
import { nextTick, watch, useAttrs } from 'vue'
import {
  AnalysisFooter,
  AnalysisIndexLabel,
} from '@/views/analysis/components/AnalysisSideBar'
import { useAnalysisHooks } from '@/views/analysis/hooks/analysisHooks'
import { usePathSidebarHooks } from '../hooks/pathSidebarHooks'
import PathAnalysisEvent from './PathAnalysisEvent.vue'
import PathSourceEvent from './PathSourceEvent.vue'

defineOptions({
  name: 'PathAnalysisSidebar',
})

const attrs = useAttrs()
const props = defineProps({
  chartType: {
    type: [String, Number],
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  dateRange: {
    type: Object,
    default: () => {},
  },
  reportInfo: {
    type: Object,
    default: () => {},
  },
  timeZone: {
    type: [String, Number],
    default: '',
  },
})

const emit = defineEmits(['calcute', 'update:timeZone', 'echoGlobalFilters'])

const { state, addGlobalFilter, removeGlobalFilter } = useAnalysisHooks({
  limit: ['userField', 'userCluster', 'userLabel', 'customTableList'],
})

const {
  analysis,
  session,
  getParams,
  eventChange,
  saveDraft,
  paddingDraft,
  echoDetail,
  watchState,
  initBeforeGetEvents,
} = usePathSidebarHooks(state, props, emit)

const selectData = defineModel('selectData')
/**
 * @description: 开始分析
 * @return {*}
 */
const calcute = (type) => {
  const params = getParams()
  if (!params) return
  selectData.value = type === 'refresh'
  emit('calcute', params)
}

watch(
  () => props.reportInfo,
  (val) => {
    if (val) {
      initBeforeGetEvents(async () => {
        await reportDetail(val, val.fromSave)
      })
    }
  },
  {
    immediate: true,
  }
)

/**
 * @description: 获取报表详情
 * @return {*}
 * @param {*} info
 * @param {*} fromSave 从保存场景来的,不重新计算
 */
function reportDetail(info, fromSave = false) {
  const data = JSON.parse(info.qp)
  echoDetail(data, () => {
    nextTick(() => {
      if (!fromSave) {
        calcute()
      }
    })
  })
}

defineExpose({
  calcute,
})
</script>

<style lang="scss" scoped>
.analysis_item {
  margin: 4px 10px 0px;
  padding: 10px;
}
</style>
