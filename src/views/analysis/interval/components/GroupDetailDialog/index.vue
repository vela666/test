<!--
 * **************************************************
 * @file 分组详情组件
 * @author fengsi<294068744@qq.com>
 * @date 2024-02-29 12:18:09
 * @since v
 * **************************************************
-->

<script setup>
import { reactive } from 'vue'
import { AnalysisTable } from '@/views/analysis/components/AnalysisMain/index.js'
import { formatDateWithWeek, isValidNumByCluster } from '@/utils'
import { t } from '@/locales/i18n'

defineOptions({
  name: 'GroupDetailDialog',
})
const props = defineProps({
  groupColumn: {
    type: Array,
    default: () => [],
  },
  tableColumns: {
    type: Array,
    default: () => [],
  },
  requestData: {
    type: Object,
    default: () => {},
  },
})
const emits = defineEmits(['submit'])

const state = reactive({
  visible: false,
  groupName: null,
  tableColumns: [],
  tableData: [],
  noticeFlag: true,
  dataDesc: '',
})
const open = (options = {}) => {
  const { item, row } = options

  state.groupName = row.date
  state.tableColumns = []
  state.tableData = row.groupBox || row.groupInterval || []
  state.dataDesc = props.requestData?.analysis?.dataDesc
  state.noticeFlag = true

  props.groupColumn.forEach((item, index) => {
    state.tableColumns.push({
      prop: `_${index}`,
      title: item,
    })

    state.tableData.forEach((row) => {
      row[`_${index}`] = row._groupCols?.[index] || row._groupCols?.[index]
    })
  })

  state.tableColumns.push(
    ...props.tableColumns.filter((item) => item.prop !== 'date')
  )

  state.visible = true
}

/**
 * @description: 间隔分析结果分群参数
 * @return {*}
 */
const getIntervalClusterParams = ({ row, item, i }) => {
  const params = {
    data: {
      clusterSql: props.requestData.resultClusterSql,
      intervalGroup: item.field === 'userNum' ? '' : item.field,
      statisticDate:
        state.groupName === t('analysis.total')
          ? ''
          : formatDateWithWeek(row.date, true),
    },
    qp: JSON.stringify(props.requestData.qp),
    type: 8,
    groupValue: row._groupCols,
  }
  return params
}

defineExpose({
  open,
})
</script>

<template>
  <common-dialog
    v-model="state.visible"
    :title="$t('analysis.component.groupDetails', [state.groupName])"
    :show-btn="false"
    width="70%">
    <LimitNotice
      v-if="state.tableData.length >= 1000"
      v-model="state.noticeFlag"
      :text="state.dataDesc" />
    <AnalysisTable
      :ref="(ref) => (state.analysisTableRef = ref)"
      :columns="state.tableColumns"
      :data="state.tableData"
      :min-height="100"
      :max-height="480"
      :exportable="false"
      :analysisType="8">
      <template #column="{ item, row, i }">
        <el-tooltip
          v-if="tableColumns[i - groupColumn.length + 1]?.tooltip"
          placement="top"
          :content="
            tableColumns[i - groupColumn.length + 1].tooltip(
              item,
              row,
              row.groupCols
            )
          "
          popper-class="table-item-popper">
          <el-space
            v-if="Array.isArray(row[`_${item.prop}`])"
            direction="vertical"
            :size="0">
            <span v-if="isValidNumByCluster(row[`_${item.prop}`]?.[0])">
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
                {{ row[`_${item.prop}`]?.[0]?.toLocaleString() }}
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
              {{ row[`_${item.prop}`]?.[0]?.toLocaleString() }}
            </span>
            <span>
              {{ row[`_${item.prop}`]?.[1]?.toLocaleString() }}
              {{ t('analysis.interval.times') }}
            </span>
          </el-space>
          <template v-else>
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
        </el-tooltip>
        <template v-else>{{ row[`${item.prop}`]?.toLocaleString() }}</template>
      </template>
    </AnalysisTable>
  </common-dialog>
</template>
