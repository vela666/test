<script setup>
import { ref, shallowRef } from 'vue'
import RetentionSidebar from './components/retention-sidebar/index.vue'
import RetentionMain from './components/retention-main/index.vue'
defineOptions({
  name: 'Retention',
})
const retentionMainRef = ref(null)
const retentionSidebarRef = ref(null)
const reportInfo = shallowRef(null)
</script>

<template>
  <AnalysisLayout
    :reportType="2"
    :title="$t('analysis.analysisConditions')"
    :titleTip="$t('analysis.retention.analysisTips')"
    :approxable="false"
    v-model:reportInfo="reportInfo"
    :sqlContent="retentionMainRef?.state?.sqlList"
    @calcute="
      (type) => retentionSidebarRef?.startAnalysis(false, type === 'refresh')
    ">
    <template #lb>
      <RetentionSidebar
        ref="retentionSidebarRef"
        :loading="retentionMainRef?.state?.loading"
        :mainState="retentionMainRef?.state"
        @analysis="(options) => retentionMainRef?.fetchRequestData(options)"
        v-model:reportInfo="reportInfo" />
    </template>
    <template #rb>
      <RetentionMain
        :reportInfo="reportInfo"
        ref="retentionMainRef"
        @calcute="retentionSidebarRef?.startAnalysis" />
    </template>
  </AnalysisLayout>
</template>

<style scoped lang="scss"></style>
