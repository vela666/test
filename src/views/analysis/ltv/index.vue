<script setup>
import { ref, shallowRef } from 'vue'
import LtvSidebar from './components/ltv-sidebar/index.vue'
import LtvMain from './components/ltv-main/index.vue'
defineOptions({
  name: 'LTV',
})

const ltvMainRef = ref(null)
const ltvSidebarRef = ref(null)
const reportInfo = shallowRef(null)
</script>

<template>
  <AnalysisLayout
    :title="$t('analysis.analysisConditions')"
    :titleTip="$t('analysis.ltv.analysisTips')"
    :reportType="9"
    :approxable="false"
    :sqlContent="ltvMainRef?.state?.sqlList"
    v-model:reportInfo="reportInfo"
    @calcute="
      (type) => ltvSidebarRef?.startAnalysis(false, type === 'refresh')
    ">
    <template #lb>
      <LtvSidebar
        ref="ltvSidebarRef"
        :loading="ltvMainRef?.state?.loading"
        :mainState="ltvMainRef?.state"
        @analysis="(options) => ltvMainRef?.fetchRequestData(options)"
        v-model:reportInfo="reportInfo" />
    </template>
    <template #rb>
      <LtvMain
        ref="ltvMainRef"
        :reportInfo="reportInfo"
        @calcute="ltvSidebarRef?.startAnalysis" />
    </template>
  </AnalysisLayout>
</template>

<style scoped lang="scss"></style>
