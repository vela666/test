<script setup>
import { ref, reactive, nextTick, watch } from 'vue'
import visualChart from './visualChart.vue'
import ResultChart from './components/ResultChart.vue'
import searchResultTable from './hooks/searchResultTable.js'
import { useRoute } from 'vue-router'
import authEnum from '@/views/analysis/enum.js'
const route = useRoute()

const props = defineProps({
  sql: {
    type: String,
    default: '',
  },
  list: {
    type: Array,
    default: () => [],
  },
  updateFlag: {
    //是否需要编辑
    type: Boolean,
    default: true,
  },
})

const resTableRef = ref(null)

const emits = defineEmits(['reportDetail', 'loading'])

const {
  state,
  getSortArr,
  handleResSortArr,
  handleVisualizationDialog,
  handleClose,
  handleGetShowChartLabel,
  handleRemoveChart,
  getGraphConfig,
  setGraphConfig,
  handleCalculate,
  getHistoryQuery,
  handleDownload,
  saveQp,
  filterBytes,
  setDetail,
  reportDetail,
  cancelCalculate,
  cancelRequest,
} = searchResultTable({ route, resTableRef, props, emits })

defineExpose({
  getGraphConfig,
  setGraphConfig,
  handleCalculate,
  getHistoryQuery,
  setDetail,
})

defineOptions({
  name: 'searchResultTable',
})
</script>
<template>
  <div v-loading="state.loading" class="p20">
    <div
      v-if="JSON.stringify(state.resData) !== '{}'"
      class="flex-center flex-between">
      <div>
        <el-radio-group v-model="state.activeRadio" class="no-bg-radio-group">
          <el-radio-button
            v-for="item in state.chartTypeList.filter(
              (item) =>
                !(
                  JSON.stringify(state.graphConfig) === '{}' &&
                  item.value === 'chart'
                )
            )"
            :value="item.value"
            :label="item.value"
            :key="`chart_icon_${item.value}`"
            :title="item.title">
            <svg-icon :name="item.icon" class="fz18"></svg-icon>
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="flex-center">
        <!-- 可视化图表 -->
        <el-button
          class="skip ml12"
          @click="handleVisualizationDialog"
          :disabled="!state.resData.showResultRows">
          <SvgIcon class="fz16 mr3" name="visualization" />
          <span class="fz14">{{ $t('analysis.sqlquery.visualChart') }}</span>
        </el-button>
        <!-- 导出 -->
        <Auth :value="authEnum[7].export">
          <el-button
            class="skip ml12"
            @click="handleDownload"
            :disabled="!state.resData.showResultRows">
            <SvgIcon class="fz16 mr3" name="export2" />
            <span class="fz14">{{ $t('common.download') }}</span>
          </el-button>
        </Auth>
        <!-- 另存为 -->
        <SaveReport
          v-if="route.query.id && updateFlag && authEnum[7].add"
          :text="$t('analysis.saveAs')"
          :reportType="7"
          :qp="saveQp"
          :chartType="state.graphType"
          :reportInfo="state.detailInfo"
          :updateFlag="updateFlag"
          @reportDetail="reportDetail"
          type="1" />
        <!-- 更新/保存报表 -->
        <SaveReport
          v-if="
            (route.query.id &&
              updateFlag &&
              authEnum[7].upd &&
              state.detailInfo.authority > 1) ||
            (!(route.query.id && updateFlag) && authEnum[7].add)
          "
          :reportType="7"
          :qp="saveQp"
          :chartType="state.graphType"
          :text="
            route.query.id && updateFlag
              ? $t('analysis.updateReport')
              : $t('analysis.saveReport')
          "
          :reportInfo="state.detailInfo"
          :updateFlag="updateFlag"
          @reportDetail="reportDetail" />

        <!-- <el-button v-if="route.query.id" class="m0 skip" @click="handleSave">
          <SvgIcon class="fz16 mr3" name="save" />
          <span class="fz14">另存为</span>
        </el-button>
        <el-button class="m0 skip" type="primary" @click="handleSave">
          <SvgIcon
            class="fz16 mr3"
            :name="route.query.id ? 'refresh' : 'save-report'"
          />
          <span class="fz14">
            {{ route.query.id ? '更新报表' : '保存报表' }}
          </span>
        </el-button> -->
      </div>
    </div>
    <div
      v-show="
        state.activeRadio === 'data' && JSON.stringify(state.resData) !== '{}'
      "
      class="flex-center mt20 mb20">
      <div class="mr20">
        <span class="txt-bold">SQL_ID：</span>
        <span>{{ state.resData.queryId }}</span>
      </div>
      <div class="ml20 mr20">
        <span class="txt-bold">{{ $t('analysis.sqlquery.queryTime') }}：</span>
        <span>{{ state.resData.queryStart }}</span>
      </div>
      <div class="ml20 mr20">
        <span class="txt-bold">{{ $t('analysis.sqlquery.timeConsumption') }}：</span>
        <span>{{ state.resData.duration }}ms</span>
      </div>
      <div class="ml20">
        <span class="txt-bold">{{ $t('analysis.sqlquery.result') }}：</span>
        <span
          >{{
            state.resData.resultBytes && filterBytes(state.resData.resultBytes)
          }}
          {{ state.resData.showResultRows }}/{{ state.resData.resultRows }}
          {{ $t('analysis.sqlquery.row') }}
        </span>
      </div>
    </div>
    <div class="res">
      <div v-if="!state.errMessage">
        <div v-show="state.activeRadio === 'data' && !state.loading">
          <VxeTableSort
            v-if="JSON.stringify(state.resData) !== '{}'"
            ref="resTableRef"
            :columns="state.columns"
            :data="state.tableData"
            :pageFlag="true"
            @getSortArr="getSortArr"
            :resizable="true">
          </VxeTableSort>
          <div v-else class="res-table-empty flex-center flex-level-center">
            <Empty />
          </div>
        </div>
        <div
          v-show="state.activeRadio === 'chart' && !state.loading"
          class="res-table-chart">
          <ResultChart
            class="mt20"
            :headers="state.headers"
            :rows="state.rows"
            :graphConfig="state.graphConfig"
            @changShowChartLabel="handleGetShowChartLabel"
            @remove="handleRemoveChart"
            @getSortArr="handleResSortArr"></ResultChart>
        </div>
      </div>
      <div v-else>
        <el-alert
          :title="state.errMessage"
          :type="state.errType"
          show-icon
          :closable="false" />
        <el-alert type="warning" :closable="false">
          <template #title>
            <h4 class="mt20 mb20">{{ $t('analysis.sqlquery.sqlErrorTitle') }}</h4>
            <p class="mb20">
              {{ $t('analysis.sqlquery.sqlErrorTips1') }}
            </p>
            <p class="mb20">
              {{ $t('analysis.sqlquery.sqlErrorTips2') }}
            </p>
            <p class="mb20">
              {{ $t('analysis.sqlquery.sqlErrorTips3') }}
            </p>
            <p class="mb20">
              {{ $t('analysis.sqlquery.sqlErrorTips4') }}
              <el-link
                href="https://help.aliyun.com/zh/hologres/user-guide/hologres-development-standards?spm=a2c4g.11186623.0.i2"
                target="_blank"
                type="warning">
                https://help.aliyun.com/zh/hologres/user-guide/hologres-development-standards?spm=a2c4g.11186623.0.i2
              </el-link>
            </p>
            <p class="mb20">
              {{ $t('analysis.sqlquery.sqlErrorTips5') }}
            </p>
          </template>
        </el-alert>
      </div>
      <visualChart
        v-model:visible="state.dialogVisible"
        :columns="state.columns"
        :data="state.tableData"
        :headers="state.headers"
        :rows="state.rows"
        :config="state.config"
        :settings="state.settings"
        v-model:graphType="state.graphType"
        :showChartLabel="state.showChartLabel"
        @close="handleClose"></visualChart>
    </div>
  </div>
  <el-button
    v-if="state.loading && cancelRequest.requestId"
    round
    class="m0 skip cancel-btn"
    @click="cancelCalculate">
    {{ $t('analysis.cancelCalculation') }}
  </el-button>
</template>
<style lang="scss" scoped>
.res {
  min-height: 400px;
  &-table-chart {
    height: 500px;
  }
  .res-table-empty {
    height: 500px;
  }
}
</style>
