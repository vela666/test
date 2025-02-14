<script setup>
import { ref } from 'vue'
import {
  AnalysisMain,
  ChartType,
} from '@/views/analysis/components/AnalysisMain/index.js'
import useLtvAnalysis from './hooks/useLtvAnalysis.js'
import GroupDetailTable from './GroupDetailTable.vue'
import { thousandsFilter } from '@/utils/index.js'
import { dataTypeList } from '@/enumeration/index.js'
import authEnum from '@/views/analysis/enum.js'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'
import ResultUserListDialog from '@/views/analysis/components/ResultUserListDialog/index.vue'
import { createLtvResultSegmentation } from '@/api/modules/common'
import { isObject } from 'lodash-es'

defineOptions({
  name: 'LtvMain',
})

const props = defineProps({
  reportInfo: {
    type: Object,
    default: () => ({}),
  },
})

const emits = defineEmits(['calcute'])

const {
  state,
  fetchRequestData,
  changeGraphType,
  shoWSameTime,
  showGroupDrop,
  hasGroup,
  showDetailBtn,
  showDetailTable,
  showTips,
  showCluster,
  showChartTypeList,
  exportTableData,
  reCallAnalysis,
  changeDataView,
  requestId,
  cancelFetchRequest,
  getClusterParams,
} = useLtvAnalysis(props, emits)

const groupDetailRef = ref(null)
const resultClusterRef = ref(null)
const openClustDialog = (params = {}) => {
  resultClusterRef.value?.open(isObject(params) ? params : {})
}

const userListRef = ref(null)
const openUserListDialog = (params = {}) => {
  userListRef.value?.open(isObject(params) ? params : {})
}

defineExpose({
  state,
  fetchRequestData,
})
</script>

<template>
  <CancelModal
    :loading="state.loading"
    :requestId="requestId"
    @cancelCalculate="cancelFetchRequest">
    <AnalysisMain
      show-header
      :status="state.status"
      :message="state.status == -1 ? '' : state.descMsg">
      <template #header>
        <div class="flex-center">
          <DateRangeSelect
            v-model="state.dateRange"
            placement="bottom-start"
            @change="reCallAnalysis" />
          <KeepCycle
            v-model="state.unitCycle"
            class="ml10 mr10"
            @change="(val) => reCallAnalysis(val, 'unitCycle')" />
          <DropSelectorSingle
            placement="bottom-start"
            width="150"
            v-model="state.dateType"
            :data="
              dataTypeList.filter(
                (v) => state.unitCycle.type === 'day' || v.value === 0
              )
            "
            @change="reCallAnalysis" />
        </div>
        <div class="flex-center" v-if="state.status === 1">
          <el-checkbox
            v-model="state.onlyUserAction"
            v-if="shoWSameTime"
            @change="changeDataView">
            {{ $t('analysis.ltv.displayedSimultaneously') }}
          </el-checkbox>
          <SettingShow
            :unitCycle="state.unitCycle.type"
            v-model="state.keyDays"
            class="ml10 mr10"
            @change="changeDataView" />
          <ChartType
            :data="showChartTypeList"
            v-model="state.graphType"
            @change="changeGraphType" />
        </div>
      </template>
      <template #chart>
        <div class="chart-tool">
          <AnalysisUpdateTime :time="state.resultGenerateTime" />
          <div class="flex-center">
            <ShowChartLabel
              v-model="state.showChartLabel"
              v-if="state.graphType !== 6"
              @updChart="changeDataView" />
            <GroupSelect
              v-if="showGroupDrop"
              v-model="state.groupOptions"
              :data="state.unionGroups"
              :title="hasGroup ? $t('analysis.group') : $t('common.date')"
              @change="changeDataView" />
            <Auth :value="authEnum[9].export">
              <el-button
                :class="['btn-w32', { ml10: !showGroupDrop }]"
                @click="exportTableData">
                <svg-icon name="async-export" class="fz18 c545e6e"></svg-icon>
                {{ $t('common.download') }}
              </el-button>
            </Auth>
          </div>
        </div>
        <chart
          v-if="state.graphType !== 6"
          :options="state.options"
          height="400px"></chart>
        <VxeTableSort
          v-else
          :columns="state.columnList"
          :data="state.tableData"
          :min-height="100"
          v-show="!state.loading">
          <template #customColumn="{ row, column, index }">
            <div v-if="index === 0">
              <span v-if="showDetailBtn(row, index)">
                <svg-icon
                  name="add1"
                  class="mr5 c-pointer"
                  v-if="showDetailBtn(row, index, 'btn')"
                  @click="showDetailTable(row, groupDetailRef)" />
              </span>
              <span>{{ row[column.field] }}</span>
            </div>
            <template v-else>
              <template v-if="showTips(row, index)">
                <el-tooltip placement="top" :hide-after="0">
                  <template #content
                    >* {{ $t('analysis.ltv.onlyDisplay') }}</template
                  >
                  <div style="width: 100%">
                    <div>
                      <span>{{ thousandsFilter(row[column.field]) }}</span>
                    </div>
                    <div v-if="row[column.field + '_user'] !== undefined">
                      <span>{{
                        thousandsFilter(row[column.field + '_user'])
                      }}</span>
                    </div>
                    <div class="table_tip__info">*</div>
                  </div>
                </el-tooltip>
              </template>
              <template v-else>
                <div>
                  <div>
                    <template
                      v-if="
                        showCluster(
                          row,
                          index,
                          column.field,
                          state.onlyUserAction ? 2 : 1
                        )
                      ">
                      <span
                        class="text-underline c-pointer"
                        @click="
                          openUserListDialog(
                            getClusterParams(
                              { row, column },
                              index,
                              state.onlyUserAction ? 2 : 1
                            )
                          )
                        ">
                        {{ thousandsFilter(row[column.field]) }}
                      </span>
                      <el-tooltip
                        :content="$t('analysis.createResultGroup')"
                        :hide-after="0"
                        placement="top">
                        <svg-icon
                          class="ml5 c-pointer"
                          name="creator1"
                          @click="
                            openClustDialog(
                              getClusterParams(
                                { row, column },
                                index,
                                state.onlyUserAction ? 2 : 1
                              )
                            )
                          " />
                      </el-tooltip>
                    </template>
                    <span v-else>{{ thousandsFilter(row[column.field]) }}</span>
                  </div>
                  <div v-if="row[column.field + '_user'] !== undefined">
                    <template
                      v-if="showCluster(row, index, column.field + '_user', 2)">
                      <span
                        class="text-underline c-pointer"
                        @click="
                          openUserListDialog(
                            getClusterParams({ row, column }, index, 2)
                          )
                        ">
                        {{ thousandsFilter(row[column.field + '_user']) }}
                      </span>
                      <svg-icon
                        class="ml5 c-pointer"
                        name="creator1"
                        @click="
                          openClustDialog(
                            getClusterParams({ row, column }, index, 2)
                          )
                        " />
                    </template>
                    <span v-else>{{
                      thousandsFilter(row[column.field + '_user'])
                    }}</span>
                  </div>
                </div>
              </template>
            </template>
          </template>
        </VxeTableSort>
      </template>
    </AnalysisMain>
  </CancelModal>
  <group-detail-table ref="groupDetailRef"></group-detail-table>
  <ResultClusterDialog
    ref="resultClusterRef"
    :qp="{}"
    :api="createLtvResultSegmentation" />
  <ResultUserListDialog ref="userListRef" :analysisType="9" />
</template>

<style scoped lang="scss">
.flex-center {
  display: flex;
  align-items: center;
}
.btn-box {
  width: 20px;
  height: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.table_tip__info {
  position: absolute;
  top: -3px;
  right: 5px;
}
</style>
