<template>
  <AnalysisLayout
    :title="t('analysis.analysisAttributes')"
    :titleTip="$t('analysis.attr.analysisTips')"
    :sqlContent="state.sqlContent"
    :approxable="false"
    :reportType="4"
    asyncExport
    v-model:reportInfo="state.reportInfo"
    @calcute="(type) => reCalcute(type)"
    @exportData="exportDataHandle">
    <template #lb>
      <AnalysisSidebar
        :ref="(ref) => (state.analySidebarRef = ref)"
        :chartType="state.analyMainRef?.chartType"
        :sortArr="state.analyMainRef?.sortArr"
        :sortType="state.analyMainRef?.sortType"
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
              :show="!state.errMessage"
              :info="state.reportInfo"
              :ref="(ref) => (state.analyMainRef = ref)" />
            <div
              v-show="state.errMessage"
              class="flex-center flex-level-center h100-percentage overflow-auto">
              <Empty :desc="state.errMessage" />
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
import { nextTick, reactive } from 'vue'
import AnalysisSidebar from './analysis-sidebar/index.vue'
import AnalysisMain from './analysis-main/index.vue'
import { calculateUserProps } from '@/api/modules/analysis/attr.js'
import useCancelRequest from '@/hooks/useCancelRequest.js'
import { t } from '@/locales/i18n'

const cancelRequest = useCancelRequest()
const state = reactive({
  analyMainRef: null,
  analySidebarRef: null,
  loading: false,
  reportInfo: null,
  sqlContent: '',
  timeZone: '8',
  selectData: false,
})

/**
 * @description: 开始分析
 * @return {*}
 * @param {*} params
 */
const calcute = (params) => {
  state.loading = true
  state.errMessage = ''
  calculateUserProps({
    qp: params,
    selectData: state.selectData,
    callback: cancelRequest.cancelCallBack,
  })
    .then((res) => {
      if (res.code === 200) {
        state.analyMainRef.getEchartsData(
          res.data,
          params.groupBy,
          params,
          state.reportInfo?.graphType
        )
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

const reCalcute = (type) => {
  nextTick(() => {
    state.analySidebarRef?.calcute(type)
  })
}

const echoGlobalFilters = (info) => {
  state.analyMainRef.echoGlobalFilters(info)
}

//异步导出处理
const exportDataHandle = (callback) => {
  if (typeof callback === 'function') {
    callback({
      appId: sessionStorage.getItem('appId'),
      exportName: state.reportInfo?.name || `用户分析_全量数据`,
      qp: state.analySidebarRef?.getParams(),
      sql: state.sqlContent,
    })
  }
}
</script>
