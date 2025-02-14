<template>
  <AnalysisLayout
    :title="$t('analysis.analysisConditions')"
    :titleTip="$t('analysis.scatter.analysisTips')"
    :sqlContent="state.sqlContent"
    :reportType="6"
    v-model:reportInfo="state.reportInfo"
    v-model:approx-val="state.approxVal"
    @calcute="(type) => reCalcute(type)">
    <template #lb>
      <AnalysisSidebar
        :ref="(ref) => (state.analySidebarRef = ref)"
        :date-range="state.analyMainRef?.dateRange"
        chartType="table"
        :timeParticle="state.analyMainRef?.timeParticle"
        :firstDayOfWeek="state.analyMainRef?.firstDayOfWeek"
        :approxVal="state.approxVal"
        :time-zone="state.timeZone"
        :sortArr="state.analyMainRef?.sortArr"
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
              v-show="state.analyMainRef && !state.analyMainRef.errMessage"
              :ref="(ref) => (state.analyMainRef = ref)"
              :info="state.reportInfo"
              @calcute="reCalcute" />
            <div
              v-show="state.analyMainRef && state.analyMainRef.errMessage"
              class="flex-center flex-level-center h100-percentage overflow-auto">
              <Empty :desc="state.analyMainRef?.errMessage" />
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
  </AnalysisLayout>
</template>

<script setup>
import { ref, nextTick, reactive, watch } from 'vue'
import AnalysisSidebar from './analysis-sidebar/index.vue'
import AnalysisMain from './analysis-main/index.vue'
import { scatterCalcute } from '@/api/modules/analysis/scatter'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { t } from '@/locales/i18n'

const cancelRequest = useCancelRequest()

defineOptions({
  name: 'AnalysisScatter',
})

const state = reactive({
  analyMainRef: null,
  analySidebarRef: null,
  loading: false,
  reportInfo: null,
  sqlContent: '',
  approxVal: 2,
  timeZone: '8',
  selectData: false,
})
const timeZoneStore = useTimeZoneStore()

const calcute = (params) => {
  state.loading = true
  state.analyMainRef.setErrMessage()
  scatterCalcute({
    qp: params,
    selectData: state.selectData,
    callback: cancelRequest.cancelCallBack,
  })
    .then((res) => {
      if (res.code === 200) {
        state.analyMainRef.renderTable(res.data, params)
        state.sqlContent = res.data.sql
      } else {
        state.analyMainRef.setErrMessage(res.message)
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
    state.analyMainRef.setErrMessage(t('analysis.reportCalcCanceled'))
  })
}

const echoGlobalFilters = (info) => {
  state.analyMainRef.echoGlobalFilters(info)
  state.approxVal = info.approxVal
  if (info?.timeZone) {
    timeZoneStore.timeZone = info.timeZone
  }
}

const reCalcute = (type) => {
  nextTick(() => {
    state.analySidebarRef?.calcute(type)
  })
}
</script>
