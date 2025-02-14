<script setup>
import { computed, ref } from 'vue'
import { dataTypeList, retentionTypeList } from '@/enumeration/index.js'
import {
  AnalysisMain,
  ChartType,
} from '@/views/analysis/components/AnalysisMain/index.js'
import useRetentionAnalysis from './hooks/useRetentionAnalysis.js'
import { thousandsFilter } from '@/utils/index.js'
import GroupDetailTable from './GroupDetailTable.vue'
import { setRetentionCellStyle as setCellStyle } from '@/views/analysis/hooks/utils.js'
import authEnum from '@/views/analysis/enum.js'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'
import ResultUserListDialog from '@/views/analysis/components/ResultUserListDialog/index.vue'
import { createRetentionResultSegmentation } from '@/api/modules/common'
import { isObject } from 'lodash-es'

defineOptions({
  name: 'RetentionMain',
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
  hasGroup,
  shoWSameTime,
  showGroupDrop,
  changeGraphType,
  valueTypeChange,
  changeDataView,
  reCallAnalysis,
  showDetailBtn,
  showDetailTable,
  changeShowType,
  exportTableData,
  showTips,
  chartTypeList,
  requestId,
  cancelFetchRequest,
  showCluster,
  getClusterParams,
} = useRetentionAnalysis(props, emits)

const groupDetailRef = ref(null)
const resultClusterRef = ref(null)
const openClustDialog = (params = {}) => {
  console.log('openClustDialog', params)
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
          <div class="mr10">
            <DropSelectorSingle
              placement="bottom-start"
              v-model="state.showType"
              :data="retentionTypeList"
              @change="changeShowType" />
          </div>
          <DropSelectorSingle
            placement="bottom-start"
            width="150"
            v-model="state.dateType"
            :data="
              dataTypeList.filter(
                (v) => state.unitCycle.type === 'day' || v.value === 0
              )
            "
            @change="reCallAnalysis">
            <template #content="{ item }">
              {{ item.label }}
              <el-tooltip :content="item.tip" v-if="item.tip">
                <svg-icon name="help2" />
              </el-tooltip>
            </template>
          </DropSelectorSingle>
        </div>
        <div class="flex-center" v-if="state.status === 1">
          <el-checkbox
            v-model="state.onlyUserAction"
            v-if="shoWSameTime"
            :disabled="state.showType === 2"
            @change="changeDataView">
            {{ $t('analysis.retention.displayedSimultaneously') }}
          </el-checkbox>
          <SettingShow
            :unitCycle="state.unitCycle.type"
            v-model="state.keyDays"
            class="ml10 mr10"
            @change="changeDataView" />
          <ChartType
            :data="chartTypeList"
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
            <el-radio-group
              v-show="state.graphType !== 6 && !state.onlyUserAction"
              :disabled="state.onlyUserAction"
              v-model="state.valueType"
              @change="valueTypeChange"
              class="no-bg-radio-group ml10 h32">
              <el-radio-button :value="1" :label="1">
                {{ $t('analysis.ratio') }}
              </el-radio-button>
              <el-radio-button
                :value="2"
                :label="2"
                :disabled="state.graphType === 11 && hasGroup">
                {{ $t('analysis.numPeople') }}
              </el-radio-button>
            </el-radio-group>
            <template v-if="showGroupDrop">
              <GroupSelect
                v-if="
                  !hasGroup && state.graphType === 11 && state.showType === 2
                "
                v-model="state.loseGroupOptions"
                :data="state.loseUnionGroups"
                :title="$t('analysis.group')"
                @change="changeDataView" />
              <GroupSelect
                v-else
                v-model="state.groupOptions"
                :data="state.unionGroups"
                :title="hasGroup ? $t('analysis.group') : $t('common.date')"
                @change="changeDataView" />
            </template>
            <Auth :value="authEnum[2].export">
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
          v-show="!state.loading"
          :cell-style="setCellStyle"
          class="rentention-vxe-grid">
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
                    >* {{ $t('analysis.retention.onlyDisplay') }}</template
                  >
                  <div style="width: 100%">
                    <div>{{ thousandsFilter(row[column.field]) }}</div>
                    <div v-if="row[`${column.field}_per`] !== undefined">
                      {{ row[`${column.field}_per`] }}
                    </div>
                    <div v-if="row[`${column.field}_user`] !== undefined">
                      {{ thousandsFilter(row[`${column.field}_user`]) }}
                    </div>
                    <div class="table_tip__info">*</div>
                  </div>
                </el-tooltip>
              </template>
              <template v-else>
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
                  <template v-else>
                    {{ thousandsFilter(row[column.field]) }}
                  </template>
                </div>
                <div v-if="row[`${column.field}_per`] !== undefined">
                  {{ row[`${column.field}_per`] }}
                </div>
                <div v-if="row[`${column.field}_user`] !== undefined">
                  <template
                    v-if="showCluster(row, index, `${column.field}_user`, 2)">
                    <span
                      class="text-underline c-pointer"
                      @click="
                        openUserListDialog(
                          getClusterParams({ row, column }, index, 2)
                        )
                      ">
                      {{ thousandsFilter(row[`${column.field}_user`]) }}
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
                            getClusterParams({ row, column }, index, 2)
                          )
                        " />
                    </el-tooltip>
                  </template>
                  <template v-else>
                    {{ thousandsFilter(row[`${column.field}_user`]) }}
                  </template>
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
    :api="createRetentionResultSegmentation" />
  <ResultUserListDialog ref="userListRef" :analysisType="2" />
</template>

<style scoped lang="scss">
.rentention-vxe-grid {
  :deep(.vxe-cell.c--tooltip) {
    max-height: 72px !important;
  }
}
.h32 {
  :deep(.el-radio-button__inner) {
    height: 32px;
    display: flex;
    align-items: center;
  }
}
.table_tip__info {
  position: absolute;
  top: -3px;
  right: 5px;
}
</style>
