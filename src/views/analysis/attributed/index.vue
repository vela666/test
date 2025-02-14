<template>
  <AnalysisLayout
    :title="$t('analysis.analysisConditions')"
    :titleTip="$t('analysis.attributed.analysisTips')"
    :sqlContent="state.sqlContent"
    :reportType="14"
    :approxable="false"
    v-model:reportInfo="state.reportInfo"
    @calcute="(type) => reCalcute(type)">
    <template #lb>
      <AnalysisSidebar
        ref="analySidebarRef"
        :date-range="analyMainRef?.dateRange"
        :chartType="state.graphType"
        :sortArr="analyMainRef?.sortArr"
        :loading="state.loading"
        v-model:reportInfo="state.reportInfo"
        v-model:selectData="state.selectData"
        @calcute="calcute"
        @echoGlobalFilters="echoGlobalFilters" />
    </template>
    <template #rb>
      <div class="position-relative w100-percentage h100-percentage">
        <div class="w100-percentage h100-percentage" v-loading="state.loading">
          <div class="w100-percentage h100-percentage" v-show="!state.loading">
            <AnalysisMain
              ref="analyMainRef"
              :info="state.reportInfo"
              @calcute="reCalcute" />
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
import { ref, nextTick, reactive } from 'vue'
import AnalysisSidebar from './analysis-sidebar/index.vue'
import AnalysisMain from './analysis-main/index.vue'
import { attributedCalcute } from '@/api/modules/analysis/attributed.js'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { t } from '@/locales/i18n'

const cancelRequest = useCancelRequest()

const analyMainRef = ref()
const analySidebarRef = ref()
const state = reactive({
  loading: false,
  reportInfo: null,
  sqlContent: '',
  selectData: false,
  graphType: 'table',
})
const timeZoneStore = useTimeZoneStore()

const calcute = (params) => {
  state.loading = true
  analyMainRef.value.setErrMessage()
  attributedCalcute({
    qp: params,
    selectData: state.selectData,
    callback: cancelRequest.cancelCallBack,
  })
    .then((res) => {
      if (res.code === 200) {
        state.sqlContent = res.data?.sql
      } else {
        analyMainRef.value.setErrMessage(res.message)
      }
      analyMainRef.value.renderTable(res.data || {}, params)
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
    analyMainRef.value.setErrMessage(t('analysis.reportCalcCanceled'))
  })
}

const echoGlobalFilters = (info) => {
  analyMainRef.value.echoGlobalFilters(info)
  if (info?.timeZone) {
    timeZoneStore.timeZone = info.timeZone
  }
}

const reCalcute = (type) => {
  nextTick(() => {
    analySidebarRef.value?.calcute(type)
  })
}

defineOptions({
  name: 'Attributed',
})
</script>
