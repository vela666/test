<script setup>
import { ref, toRef, provide, computed } from 'vue'
import useDashboardRetention from '@/views/analysis/retention/hooks/useDashboardRetention.js'
import GroupDetailTable from '@/views/analysis/retention/components/retention-main/GroupDetailTable.vue'
import ChartCardHeader from '@/views/see-plate/components/Dashboard/components/ChartCardHeader/index.vue'
import { dataTypeList, retentionTypeList } from '@/enumeration/index.js'
import { thousandsFilter } from '@/utils/index.js'
import { setRetentionCellStyle as setCellStyle } from '@/views/analysis/hooks/utils.js'
import authEnum from '@/views/analysis/enum.js'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'
import ResultUserListDialog from '@/views/analysis/components/ResultUserListDialog/index.vue'
import { createRetentionResultSegmentation } from '@/api/modules/common'
import { isObject } from 'lodash-es'

defineOptions({
  name: 'Retention',
})

const props = defineProps({
  info: {
    type: Object,
    default: () => null,
  },
  w: {
    type: Number,
    default: 0,
  },
  explore: {
    // 探索
    type: Boolean,
    default: false,
  },
  params: {
    type: Object,
    default: () => null,
  },
})

const emits = defineEmits(['updReportSet'])

const {
  state,
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
  getData,
  reCalculateData,
  getInfo,
  requestId,
  cancelFetchRequest,
  disableExport,
  showCluster,
  getClusterParams,
  getSetting,
} = useDashboardRetention(props, emits)

const groupDetailRef = ref(null)
const resultClusterRef = ref(null)
const openClustDialog = (params = {}) => {
  resultClusterRef.value?.open(isObject(params) ? params : {})
}

const userListRef = ref(null)
const openUserListDialog = (params = {}) => {
  userListRef.value?.open(isObject(params) ? params : {})
}

const appId = computed(
  () => props?.params?.appId || sessionStorage.getItem('appId')
)

provide('appId', appId)

defineExpose({
  getData,
  chartTypeList: chartTypeList,
  getInfo,
  loading: toRef(state, 'loading'),
  export: exportTableData,
  disableExport,
  getSetting,
})
</script>

<template>
  <CancelModal
    :loading="state.loading"
    :requestId="requestId"
    @cancelCalculate="cancelFetchRequest">
    <div class="dashboard-analysis-card">
      <chart-card-header>
        <template #left>
          <DateRangeSelect
            :showBorder="false"
            :dateIcon="false"
            v-model="state.dateRange"
            placement="bottom-start"
            @change="() => reCalculateData(false)" />
          <KeepCycle
            :showBorder="false"
            placement="bottom"
            v-model="state.unitCycle"
            @change="(val) => reCalculateData(false, val, 'unitCycle')" />
          <DropSelectorSingle
            :showBorder="false"
            v-model="state.showType"
            :data="retentionTypeList"
            @change="changeShowType" />
          <DropSelectorSingle
            :showBorder="false"
            width="150"
            v-model="state.dateType"
            :data="
              dataTypeList.filter(
                (v) => state.unitCycle.type === 'day' || v.value === 0
              )
            "
            @change="() => reCalculateData(false)">
            <template #content="{ item }">
              {{ item.label }}
              <el-tooltip :content="item.tip" v-if="item.tip">
                <svg-icon name="help2" />
              </el-tooltip>
            </template>
          </DropSelectorSingle>
          <template v-if="state.graphType !== 6 && showGroupDrop">
            <GroupSelect
              v-if="!hasGroup && state.graphType === 11 && state.showType === 2"
              :showBorder="false"
              placement="bottom"
              v-model="state.loseGroupOptions"
              :data="state.loseUnionGroups"
              :title="$t('analysis.time')"
              @change="changeDataView" />
            <GroupSelect
              v-else
              :showBorder="false"
              placement="bottom"
              v-model="state.groupOptions"
              :data="state.unionGroups"
              :title="hasGroup ? $t('analysis.group') : $t('analysis.time')"
              @change="changeDataView" />
          </template>
          <SettingShow
            v-model="state.keyDays"
            :unitCycle="state.unitCycle.type"
            :showBorder="false"
            placement="bottom"
            @change="changeDataView" />
          <AnalysisUpdateTime :time="state.resultGenerateTime" />
        </template>
        <template #right>
          <ShowChartLabel
            :showBorder="false"
            v-model="state.showChartLabel"
            v-if="state.graphType !== 6"
            @updChart="changeDataView" />
          <!-- 探索展示 -->
          <template v-if="explore">
            <el-tooltip
              :content="$t('common.refresh')"
              placement="top"
              :hide-after="0">
              <el-button
                class="p0 m0 nd-operate-btn-active fz28"
                text
                @click="reCalculateData(true)">
                <SvgIcon class="fz16 c86919d" name="refresh1" />
              </el-button>
            </el-tooltip>
            <Auth :value="authEnum[2].export">
              <el-tooltip
                :content="$t('analysis.exportDataTip')"
                placement="top"
                :hide-after="0">
                <el-button
                  class="p0 m0 nd-operate-btn-active fz28"
                  text
                  @click="exportTableData">
                  <SvgIcon class="fz18 c86919d" name="download" />
                </el-button>
              </el-tooltip>
            </Auth>
          </template>
          <!-- 图表类型 -->
          <sort-drop
            v-model="state.graphType"
            :typeList="chartTypeList"
            :showBorder="false"
            showText
            @change="changeGraphType"></sort-drop>
        </template>
      </chart-card-header>
      <div class="chart-view-body">
        <empty
          v-if="[0, -1].includes(state.status)"
          :desc="state.descMsg"></empty>
        <template v-else>
          <chart
            v-if="state.graphType !== 6"
            :options="state.options"
            height="100%"></chart>
          <VxeTableSort
            v-else
            :columns="state.columnList"
            :data="state.tableData"
            v-show="!state.loading"
            :cell-style="setCellStyle"
            class="rentention-vxe-grid"
            min-height="100"
            width="100%"
            max-height="100%"
            :empty-text="
              state.loading ? $t('analysis.loading') : $t('common.noData')
            ">
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
                    <template #content>
                      * {{ $t('analysis.ltv.onlyDisplay') }}
                    </template>
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
      </div>
    </div>
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
