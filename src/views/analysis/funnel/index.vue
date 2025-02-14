<template>
  <AnalysisLayout
    :title="$t('analysis.analysisConditions')"
    :titleTip="$t('analysis.funnel.analysisTips')"
    :approxable="false"
    :sqlContent="state.sqlContent"
    :reportType="3"
    v-model:reportInfo="state.reportInfo"
    @calcute="(type) => reCalcute(type)">
    <template #lb>
      <AnalysisSidebar
        :ref="(ref) => (state.analySidebarRef = ref)"
        :date-range="state.analyMainRef?.dateRange"
        :chartType="state.analyMainRef?.chartType"
        :funnelType="state.analyMainRef?.funnelType"
        :steps="state.analyMainRef?.steps"
        :groupCheck="state.analyMainRef?.groupCheck"
        :loading="state.loading"
        :time-zone="state.timeZone"
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
import { reactive, nextTick } from 'vue'
import AnalysisSidebar from './analysis-sidebar/index.vue'
import AnalysisMain from './analysis-main/index.vue'
import { calculateFunnel } from '@/api/modules/analysis/funnel'
import useTimeZoneStore from '@/store/modules/time-zone.js'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { t } from '@/locales/i18n'

const cancelRequest = useCancelRequest()

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

const calcute = (params, type) => {
  state.loading = true
  state.analyMainRef.setErrMessage()
  calculateFunnel({
    qp: params,
    selectData: state.selectData,
    callback: cancelRequest.cancelCallBack,
  })
    .then((res) => {
      if (res.code === 200) {
        state.analyMainRef.getEchartsData(
          res.data,
          params,
          state.reportInfo?.graphType,
          type
        )
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

/**
 * @description: 保存草稿--回显时间
 * @return {*}
 * @param {*} date
 */
const echoGlobalFilters = (info) => {
  state.analyMainRef.echoGlobalFilters(info)
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
