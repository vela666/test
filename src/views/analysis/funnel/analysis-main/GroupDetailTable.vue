<template>
  <CommonDialog
    v-model="state.visible"
    :title="$t('analysis.component.groupDetails', [state.groupName])"
    :needFooter="false"
    width="1000px">
    <AnalysisTable
      :columns="state.groupColumns"
      :data="state.groupData"
      :cell-style="cellStyle"
      :exportable="false"
      :ref="(ref) => (state.analysisTableRef = ref)"
      :max-height="540"
      :analysisType="3">
      <template #column="{ item, row, i }">
        <span v-if="item.prop === 'group'" class="flex-center">
          {{ row[item.prop] }}
        </span>
        <!-- 转化/流失 -->
        <template v-else>
          <span v-if="i === 1">
            <template v-if="isValidNumByCluster(row[`${funnelType}_${i}`])">
              <span
                class="text-underline c-pointer"
                @click="
                  state.analysisTableRef?.openUserListDialog(
                    getFunnelGroupClusterParams({
                      row,
                      item,
                      i,
                    })
                  )
                ">
                {{ row[`${funnelType}_${i}`]?.toLocaleString() }}
              </span>
              <Tooltip
                :content="$t('analysis.createResultGroup')"
                placement="right">
                <svg-icon
                  name="creator1"
                  class="c-pointer"
                  @click="
                    state.analysisTableRef.createCluster(
                      getFunnelGroupClusterParams({
                        row,
                        item,
                        i,
                      })
                    )
                  " />
              </Tooltip>
            </template>
            <template v-else>
              {{ row[`${funnelType}_${i}`]?.toLocaleString() }}
            </template>
          </span>
          <div v-else style="color: #1c2028">
            <div v-if="isValidNumByCluster(row[`${funnelType}_${i}`])">
              <span
                class="text-underline c-pointer"
                @click="
                  state.analysisTableRef?.openUserListDialog(
                    getFunnelGroupClusterParams({
                      row,
                      item,
                      i,
                    })
                  )
                ">
                {{ row[`${funnelType}_${i}`]?.toLocaleString() }}
              </span>
              <Tooltip
                :content="$t('analysis.createResultGroup')"
                placement="right">
                <svg-icon
                  name="creator1"
                  class="c-pointer"
                  @click="
                    state.analysisTableRef.createCluster(
                      getFunnelGroupClusterParams({
                        row,
                        item,
                        i,
                      })
                    )
                  " />
              </Tooltip>
            </div>
            <div v-else>{{ row[`${funnelType}_${i}`]?.toLocaleString() }}</div>
            <div>
              <el-tooltip
                placement="right"
                :content="`${item.title}${$t('analysis.funnel.singleStep')}${funnelType === 'cover' ? $t('analysis.funnel.conversionRate') : $t('analysis.funnel.lossRate')}`"
                popper-class="table-column-popper">
                <span>{{ row[`${funnelType}_rate_current_${i}`] }}%</span>
              </el-tooltip>
            </div>
            <div>
              <el-tooltip
                placement="right"
                :content="`${item.title}${$t('analysis.funnel.tableTipTotal')}${funnelType === 'cover' ? $t('analysis.funnel.conversionRate') : $t('analysis.funnel.lossRate')}`"
                popper-class="table-column-popper">
                <span>{{ row[`${funnelType}_rate_total_${i}`] }}%</span>
              </el-tooltip>
            </div>
          </div>
        </template>
      </template>
    </AnalysisTable>
  </CommonDialog>
</template>

<script setup>
import { reactive } from 'vue'
import { AnalysisTable } from '@/views/analysis/components/AnalysisMain/index.js'
import {
  getPercentColor,
  formatDateWithWeek,
  isValidNumByCluster,
} from '@/utils/index.js'
import { t } from '@/locales/i18n'

const props = defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Object,
    default: () => {},
  },
  resultClusterSql: {
    type: String,
    default: '',
  },
  qp: {
    type: Object,
    default: () => {},
  },
  funnelType: {
    type: String,
    default: 'cover',
  },
  chartType: {
    type: String,
    default: 'funnel',
  },
  stepStart: {
    type: Number,
    default: 0,
  },
  stepEnd: {
    type: Number,
    default: 0,
  },
})

const state = reactive({
  visible: false,
  groupName: '',
  groupColumns: [],
  groupData: [],
  analysisTableRef: null,
})

const open = (group) => {
  state.groupName = group
  state.visible = true

  initTableData()
}

const initTableData = () => {
  renderColumns()
  renderTableData()
}

const renderColumns = () => {
  const columns = []
  props.columns.forEach((item, i) => {
    columns.push({
      ...item,
      title: i === 0 ? t('common.date') : item.title,
      // fixed: i === 0 ? 'left' : '',
    })
  })

  state.groupColumns = columns
}

const renderTableData = () => {
  let data = []
  if (state.groupName === t('analysis.funnel.total')) {
    data = props.data.y[0].totalGroupValues
  } else {
    const i = props.data.x.findIndex((item) => item === state.groupName)
    data = props.data.y[0].itemGroupValues[i]
  }

  data.forEach((item) => {
    item.groupCols = formatDateWithWeek(item.groupCols)
  })

  props.funnelType === 'cover' ? renderCoverData(data) : renderLossData(data)
}

/**
 * @description: 转化
 * @return {*}
 * @param {*} data
 */
const renderCoverData = (data) => {
  const tableData = []
  const list = data
  list.forEach((item) => {
    const obj = {}
    obj.group = item.groupCols
    item.values
      .slice(props.stepStart, props.stepEnd)
      .forEach((item, i, arr) => {
        obj[`cover_${i + 1}`] = item

        if (i > 0) {
          // 分步转化率（当前步骤/上一步骤）
          const cover_rate_current = arr[i - 1]
            ? ((arr[i] / arr[i - 1]) * 100).toFixed(2)
            : 0

          // 步骤一到当前步骤转化率（当前步骤/步骤一）
          const cover_rate_total = arr[0]
            ? ((arr[i] / arr[0]) * 100).toFixed(2)
            : 0

          obj[`cover_rate_current_${i + 1}`] = Number(cover_rate_current)
          obj[`cover_rate_total_${i + 1}`] = Number(cover_rate_total)
        }
      })

    tableData.push(obj)
  })
  state.groupData = tableData
}

/**
 * @description: 流失
 * @return {*}
 * @param {*} data
 */
const renderLossData = (data) => {
  const tableData = []
  const list = data
  list.forEach((item, j) => {
    const obj = {}
    obj.group = item.groupCols

    item.values
      .slice(props.stepStart, props.stepEnd)
      .forEach((item, i, arr) => {
        obj[`loss_${i + 1}`] = item

        if (i > 0) {
          obj[`loss_${i + 1}`] = arr[i - 1] - arr[i]
          // 分步流失（当前步骤与上一步骤之间）
          const loss_rate_current = arr[i - 1]
            ? (100 - (arr[i] / arr[i - 1]) * 100).toFixed(2)
            : 0

          // 步骤一到当前步骤流失率
          const loss_rate_total = arr[0]
            ? (((arr[0] - arr[i]) / arr[0]) * 100).toFixed(2)
            : 0

          obj[`loss_rate_current_${i + 1}`] = Number(loss_rate_current)
          obj[`loss_rate_total_${i + 1}`] = Number(loss_rate_total)
        }
      })

    tableData.push(obj)
  })
  state.groupData = tableData
}

const cellStyle = ({ row, columnIndex }) => {
  if (columnIndex >= 2) {
    let params
    params = row[`${props.funnelType}_rate_current_${columnIndex}`]
    const per = parseFloat(params)

    const pColor = getPercentColor(per)
    return {
      backgroundColor: pColor,
    }
  }
  return ''
}

// 漏斗分组结果分群参数
const getFunnelGroupClusterParams = ({ row, item, i }) => {
  const type = 3
  const level = item.field.split('_')[1]
  const params = {
    appId: sessionStorage.getItem('appId'),
    data: {
      funnelResultClusterSql: props.resultClusterSql,
      level,
      resDay: formatDateWithWeek(row.group, true),
      retention: props.funnelType === 'cover' || i === 1 ? 1 : 2, //i === 1  表格第二列（下标为1）的都是留存用户计算
    },
    qp: JSON.stringify(props.qp),
    type,
    groupValue:
      state.groupName === t('analysis.funnel.total') ? [] : [state.groupName],
  }
  return params
}

defineOptions({
  name: 'GroupDetailTable',
})

defineExpose({
  open,
})
</script>
