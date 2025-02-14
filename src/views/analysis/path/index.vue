<template>
  <AnalysisLayout
    :title="$t('analysis.analysisConditions')"
    :titleTip="$t('analysis.path.analysisTips')"
    :sqlContent="state.sqlContent"
    :approxable="false"
    :reportType="5"
    v-model:reportInfo="state.reportInfo"
    @calcute="reCalcute">
    <template #lb>
      <AnalysisSidebar
        :ref="(ref) => (state.analySidebarRef = ref)"
        :date-range="state.analyMainRef?.dateRange"
        :loading="state.loading"
        v-model:reportInfo="state.reportInfo"
        v-model:selectData="state.selectData"
        @calcute="calcute"
        @echoGlobalFilters="echoGlobalFilters" />
    </template>
    <template #rb>
      <div class="position-relative w100-percentage h100-percentage">
        <div class="w100-percentage h100-percentage" v-loading="state.loading">
          <AnalysisMain
            :show="!state.errMessage"
            :ref="(ref) => (state.analyMainRef = ref)"
            @calcute="reCalcute" />
          <div
            v-show="state.errMessage"
            class="flex-center flex-level-center h100-percentage overflow-auto">
            <Empty :desc="state.errMessage" />
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
  </AnalysisLayout>
</template>

<script setup>
import { reactive, nextTick } from 'vue'
import AnalysisSidebar from './analysis-sidebar/index.vue'
import AnalysisMain from './analysis-main/index.vue'
import { traceCalculate } from '@/api/modules/analysis/path'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'AnalysisPath',
})

const cancelRequest = useCancelRequest()

const state = reactive({
  analyMainRef: null,
  analySidebarRef: null,
  loading: false,
  reportInfo: null,
  sqlContent: '',
  timeZone: '8',
  selectData: false,
  errMessage: '',
})

/**
 * @description: 开始分析
 * @return {*}
 * @param {*} params
 */
const calcute = (params) => {
  state.loading = true
  state.errMessage = ''
  traceCalculate({
    qp: params,
    selectData: state.selectData,
    callback: cancelRequest.cancelCallBack,
  })
    .then((res) => {
      if (res.code === 200) {
        state.analyMainRef.getEchartsData(res.data, params)
        state.sqlContent = res.data.sql
      } else {
        state.errMessage = res.message
      }
      cancelRequest.cancelReset()
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description 取消计算
 */
const cancelCalculate = () => {
  cancelRequest.cancelCalculate(() => {
    state.loading = false
    state.errMessage = t('analysis.reportCalcCanceled')
  })
}

const echoGlobalFilters = (info) => {
  state.analyMainRef.echoGlobalFilters(info)
}

const reCalcute = (type) => {
  nextTick(() => {
    state.analySidebarRef?.calcute(type)
  })
}
</script>
