<!--
 * **************************************************
 * @file 间隔分析分组详情组件
 * @author fengsi<294068744@qq.com>
 * @date 2024-03-07 09:45:44
 * **************************************************
-->

<script setup>
import { reactive } from 'vue'
import userIntervalHook from '@/views/analysis/interval/hooks'
import { AnalysisTable } from '@/views/analysis/components/AnalysisMain/index.js'
import { formatDateWithWeek, isValidNumByCluster } from '@/utils'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'IntervalGroupDetailDialog',
})

const props = defineProps({
  groupColumn: {
    type: Array,
    default() {
      return []
    },
  },
  tableColumns: {
    type: Array,
    default() {
      return []
    },
  },
  qp: {
    type: Function,
    default: () => ({}),
  },
})
const emits = defineEmits({})

const { getTable12Tooltip, getTable13Tooltip } = userIntervalHook(props, {
  emits,
})
const state = reactive({
  visible: false,
  groupName: null,
  graphType: null,
  tableColumns: [],
  tableData: [],
  analysedData: {
    type: Object,
    default() {
      return {
        analysis: {},
        cache: false,
        resultClusterSql: null,
        resultGenerateTime: null,
        sql: null,
      }
    },
  },
})
const open = ({ row, item, i }, graphType, analysedData) => {
  console.log(row)
  state.groupName = row.date
  state.graphType = graphType
  state.analysedData = analysedData
  state.tableColumns = props.groupColumn
    .map((title, index) => ({
      prop: `_${index}`,
      title,
    }))
    .concat(props.tableColumns?.slice(1) || [])
  state.tableData = (row.groupBox || row.groupInterval)?.map((item) => {
    item.groupCols.split(',').forEach((col, index) => {
      item[`_${index}`] = col
    })

    return item
  })
  state.visible = true
}

/**
 * @description: 间隔分析结果分群参数
 * @return {*}
 */
const getIntervalClusterParams = ({ row, item, i }) => {
  const params = {
    data: {
      clusterSql: state.analysedData.resultClusterSql,
      intervalGroup: item.field === 'userNum' ? '' : item.field,
      statisticDate:
        state.groupName === t('analysis.total')
          ? ''
          : formatDateWithWeek(row.date, true),
    },
    qp: JSON.stringify(props.qp()),
    type: 8,
    groupValue: row.groupCols.split(','),
  }
  return params
}

defineExpose({ open })
</script>

<template>
  <common-dialog
    v-model="state.visible"
    :title="$t('analysis.component.groupDetails', [state.groupName])"
    :show-btn="false"
    width="70%">
    <AnalysisTable
      :ref="(ref) => (state.analysisTableRef = ref)"
      :columns="state.tableColumns"
      :data="state.tableData"
      :max-height="480"
      :exportable="false"
      :analysisType="8"
      page-flag>
      <template #column="{ row, item, i }">
        <span v-if="i < groupColumn.length">{{ row[item.prop] }}</span>
        <el-tooltip
          v-else
          placement="top"
          :content="
            state.graphType === 12
              ? getTable12Tooltip({ row, item, i }, state.analysedData)
              : getTable13Tooltip({ row, item, i }, state.analysedData)
          ">
          <template v-if="state.graphType === 12">
            <span
              v-if="
                item.prop === 'userNum' &&
                isValidNumByCluster(row[`_${item.prop}`])
              ">
              <span
                class="text-underline c-pointer"
                @click="
                  state.analysisTableRef.openUserListDialog(
                    getIntervalClusterParams({
                      row,
                      item,
                      i,
                    })
                  )
                ">
                {{ row[`_${item.prop}`]?.toLocaleString() }}
              </span>
              <Tooltip
                :content="$t('analysis.createResultGroup')"
                placement="right">
                <svg-icon
                  name="creator1"
                  class="c-pointer"
                  @click="
                    state.analysisTableRef.createCluster(
                      getIntervalClusterParams({
                        row,
                        item,
                        i,
                      })
                    )
                  " />
              </Tooltip>
            </span>
            <span v-else> {{ row[`_${item.prop}`]?.toLocaleString() }}</span>
          </template>
          <el-space
            v-else
            :size="0"
            direction="vertical"
            style="line-height: 1.2">
            <span v-if="isValidNumByCluster(row[item.prop]?._userNumData)">
              <span
                class="text-underline c-pointer"
                @click="
                  state.analysisTableRef.openUserListDialog(
                    getIntervalClusterParams({
                      row,
                      item,
                      i,
                    })
                  )
                ">
                {{ row[item.prop]?._userNumData?.toLocaleString() }}
              </span>
              <Tooltip
                :content="$t('analysis.createResultGroup')"
                placement="right">
                <svg-icon
                  name="creator1"
                  class="c-pointer"
                  @click="
                    state.analysisTableRef.createCluster(
                      getIntervalClusterParams({
                        row,
                        item,
                        i,
                      })
                    )
                  " />
              </Tooltip>
            </span>
            <span v-else>
              {{ row[item.prop]?._userNumData?.toLocaleString() }}
            </span>
            <span>
              {{ row[item.prop]?._numData?.toLocaleString() }}
              {{ t('analysis.interval.times') }}
            </span>
          </el-space>
        </el-tooltip>
      </template>
    </AnalysisTable>
  </common-dialog>
</template>
