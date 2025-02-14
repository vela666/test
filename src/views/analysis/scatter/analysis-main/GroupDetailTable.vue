<template>
  <CommonDialog
    v-model="state.visible"
    :title="$t('analysis.component.groupDetails', [state.groupName])"
    :needFooter="false"
    width="1000px">
    <LimitNotice
      v-if="state.tableData.length >= 1000"
      v-model="state.noticeFlag"
      :text="dataDesc" />
    <AnalysisTable
      :ref="(ref) => (state.analysisTableRef = ref)"
      :columns="state.columns"
      :data="state.tableData"
      :cell-style="cellStyle"
      :exportable="false"
      :max-height="540"
      :analysisType="6">
      <template #column="{ item, row, i }">
        <span v-if="item.prop.includes('groupName')" class="flex-center">
          {{ row[item.prop] }}
        </span>
        <template v-else>
          <div v-if="item.prop === 'col_0'">
            <template v-if="isValidNumByCluster(row['col_0'])">
              <span
                class="text-underline c-pointer"
                @click="
                  state.analysisTableRef?.openUserListDialog(
                    getScatterClusterParams({
                      row,
                      item,
                      i,
                    })
                  )
                ">
                {{ row['col_0']?.toLocaleString() }}
              </span>
              <Tooltip
                :content="$t('analysis.createResultGroup')"
                placement="right">
                <svg-icon
                  name="creator1"
                  class="c-pointer"
                  @click="
                    state.analysisTableRef.createCluster(
                      getScatterClusterParams({
                        row,
                        item,
                        i,
                      })
                    )
                  " />
              </Tooltip>
            </template>
            <template v-else>
              {{ row['col_0']?.toLocaleString() }}
            </template>
          </div>
          <div v-else style="color: #1c2028">
            <div v-if="isValidNumByCluster(row[`col_${i}`])">
              <span
                class="text-underline c-pointer"
                @click="
                  state.analysisTableRef?.openUserListDialog(
                    getScatterClusterParams({
                      row,
                      item,
                      i,
                    })
                  )
                ">
                {{ row[`col_${i}`]?.toLocaleString() }}
              </span>
              <Tooltip
                :content="$t('analysis.createResultGroup')"
                placement="right">
                <svg-icon
                  name="creator1"
                  class="c-pointer"
                  @click="
                    state.analysisTableRef.createCluster(
                      getScatterClusterParams({
                        row,
                        item,
                        i,
                      })
                    )
                  " />
              </Tooltip>
            </div>
            <div v-else>{{ row[`col_${i}`]?.toLocaleString() }}</div>
            <div>{{ row[`col_rate_${i}`] }}%</div>
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
    type: [Object, String],
    default: () => {},
  },
  dataDesc: {
    type: String,
    default: '',
  },
})

const state = reactive({
  visible: false,
  groupName: '',
  group: [],
  columns: [],
  tableData: [],
  dataSource: [],
  noticeFlag: true,
})

const open = (row) => {
  state.groupName = row.date
  state.visible = true
  state.dataSource = row.children
  state.noticeFlag = true

  initTableData()
}

const initTableData = () => {
  renderColumns()
  renderTableData()
}

const renderColumns = () => {
  const columns = []
  const group = [...props.data.group_column.split(',')]

  group.forEach((item, i) => {
    columns.push({
      title: item,
      prop: `groupName_${i}`,
      // fixed: i === 0 ? 'left' : '',
    })
  })
  state.group = group

  props.data.distributionInterval.forEach((item, i) => {
    columns.push({
      title: item,
      prop: i === 0 ? 'col_0' : `col_${i + group.length}`,
      align: 'right',
    })
  })

  state.columns = columns
}

const renderTableData = () => {
  const data = []

  state.dataSource.forEach((item) => {
    const groupField = item.group_column.split(',')
    const obj = {}
    groupField.forEach((val, i) => {
      obj[`groupName_${i}`] = val
    })

    item.values.forEach((val, i) => {
      if (i > 0) {
        obj[`col_${i + state.group.length}`] = Number(val)
        obj[`col_rate_${i + state.group.length}`] = obj['col_0']
          ? Math.round(
              (obj[`col_${i + state.group.length}`] / obj['col_0']) * 10000
            ) / 100
          : 0
      } else {
        obj[`col_0`] = Number(val)
      }
    })
    data.push(obj)
  })

  state.tableData = data.sort((a, b) => b['col_0'] - a['col_0'])
}

const cellStyle = ({ row, columnIndex }) => {
  if (columnIndex >= 2) {
    const params = row[`col_rate_${columnIndex}`]
    const per = parseFloat(params)
    const pColor = getPercentColor(per)
    return {
      backgroundColor: pColor,
    }
  }
  return ''
}

// 分布分析结果分群参数
// { title: '离散数字',fEh: 'def' },
// { title: '自定义区间',fEh: 'user_defined' },
// { title: '默认区间',fEh: 'def_interval' },
const getScatterClusterParams = ({ row, item, i }) => {
  const intervalType = props.qp?.events.intervalType
  let minValue = ''
  let maxValue = ''
  if (/\d+/.test(item.title)) {
    const numReg = /(\[|\()(\d+(\.\d+)?|-∞)(~|,)(\d+(\.\d+)?|\+?∞)\).*/
    const range = item.title.replace(numReg, '$2$4$5').split('~')

    if (range.length === 2) {
      if (item.title.includes('-∞')) {
        minValue = ''
        maxValue = range[1]
      } else if (item.title.includes('∞')) {
        minValue = range[0]
        maxValue = ''
      } else {
        minValue = range[0]
        maxValue = range[1]
      }
    } else {
      minValue = maxValue = range[0]
    }
  }

  // 分组项目
  const groupValue = Object.keys(row)
    .map((key) => {
      if (key.includes('groupName')) {
        return row[key]
      }
    })
    .filter(Boolean)

  const params = {
    data: {
      clusterSql: props.resultClusterSql,
      minValue,
      maxValue,
      statisticDate: formatDateWithWeek(state.groupName, true),
      type:
        intervalType === 'def' ? 0 : intervalType === 'def_interval' ? 1 : 2, // 类型：0 离散 1 默认区间 2 自定义区间
    },
    qp: JSON.stringify(props.qp),
    type: 6,
    groupValue,
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
