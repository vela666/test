<script setup>
import { provide } from 'vue'
import { useIntervalState } from '@/views/analysis/interval/hooks/global-state'

import IntervalSidebar from './components/IntervalSidebar/index.vue'
import IntervalMain from './components/IntervalMain/index.vue'

defineOptions({
  name: 'Interval',
})

const {
  sidebarRef,
  mainRef,
  state,
  reportInfo,
  requestData,
  handleIntervalAnalyse,
  cancelCalculate,
  cancelRequest,
  clearView,
} = useIntervalState()

provide('intervalState', {
  sidebarRef,
  mainRef,
  state,
  reportInfo,
  requestData,
  handleIntervalAnalyse,
  cancelCalculate,
  cancelRequest,
})
</script>

<template>
  <AnalysisLayout
    v-model:reportInfo="reportInfo"
    v-model:approx-val="state.affinity"
    v-model:time-zone="state.timeZone"
    :report-type="state.analysisType"
    :title="state.title"
    :title-tip="state.titleTip"
    :approxable="state.approvable"
    :sql-content="requestData.sql"
    @refresh="handleIntervalAnalyse(sidebarRef.getRequestParams(), true)"
    @timeZoneChange="(value) => (state.timeZone = value)">
    <template #lb>
      <IntervalSidebar
        :ref="(ref) => (sidebarRef = ref)"
        @clearView="clearView" />
    </template>
    <template #rb>
      <IntervalMain
        :ref="(ref) => (mainRef = ref)"
        @calculate="handleIntervalAnalyse(sidebarRef.getRequestParams())" />
    </template>
  </AnalysisLayout>
</template>

<style scoped lang="scss"></style>
