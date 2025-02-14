<template>
  <div class="flex-center flex-between mb20" v-if="needHeader">
    <div>
      <slot name="hl" />
    </div>
    <div>
      <slot name="hr" v-if="Object.keys($slots).includes('hr')" />
      <!-- 用户分析 -->
      <Auth v-if="analysisType" :value="authEnum[analysisType].export">
        <el-button @click="download" v-if="exportable && !$slots.hr">
          <svg-icon name="async-export" class="fz16" />
          {{ $t('common.download') }}
        </el-button>
      </Auth>
    </div>
  </div>
  <slot name="title" />

  <VxeTableSort
    ref="tableRef"
    :data="data"
    :columns="columns"
    v-bind="attrs"
    :minHeight="100"
    :pageFlag="pagination">
    <template #customColumn="{ row, column, index }">
      <slot
        :row="row"
        :item="column"
        name="column"
        :i="index"
        :rowIndex="index" />
      <template v-if="!Object.keys($slots).includes('column')">
        <template v-if="showCluster(row, column)">
          <template v-if="isValidNumByCluster(row[column.prop])">
            <span
              class="c-pointer"
              :class="{
                'text-underline': showCluster(row, column),
              }"
              @click="getGroupValue(row, column.title, row[column.prop])">
              {{ row[column.prop]?.toLocaleString() }}
            </span>
            <el-tooltip
              v-if="showCluster(row, column)"
              :content="$t('analysis.createResultGroup')"
              placement="right">
              <svg-icon
                @click="handleClusterOpen(index, row, column)"
                class="c-pointer"
                name="creator1" />
            </el-tooltip>
          </template>
          <template v-else>{{ row[column.prop]?.toLocaleString() }}</template>
        </template>
        <template v-else>
          {{ row[column.prop]?.toLocaleString() }}
        </template>
      </template>
    </template>
  </VxeTableSort>

  <ResultClusterDialog
    ref="resultClusterRef"
    :qp="dataQP"
    :api="apis[analysisType]" />
  <ResultUserListDialog
    ref="resultUserRef"
    :qp="dataQP"
    :totalCount="totalCount"
    :analysisType="analysisType" />
</template>

<script setup>
import { ref, nextTick, useAttrs, inject, toRef } from 'vue'
import ResultClusterDialog from '../ResultClusterDialog/index.vue'
import ResultUserListDialog from '../ResultUserListDialog/index.vue'
import { exportToExcel } from '@/utils/excel'
import { userClusterAdd } from '@/api/modules/analysis/attr.js'
import { funnelClusterAdd } from '@/api/modules/analysis/funnel.js'
import {
  createScatterSegmentation,
  createIntervalSegmentation,
} from '@/api/modules/common'
import dayjs from 'dayjs'
import authEnum from '@/views/analysis/enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { reportTypeListMap } from '@/enumeration/report.js'
import { isValidNumByCluster } from '@/utils'

const attrs = useAttrs()
const props = defineProps({
  isUserCluster: {
    type: Boolean,
    default: false,
  },
  // 报表信息
  info: {
    type: Object,
    default() {
      return {}
    },
  },
  qp: {
    type: Object,
    default: () => {},
  },
  columns: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Array,
    default: () => [],
  },
  // 记录行为会取该值
  fileName: {
    type: [String, Number],
    default: '',
  },
  downloadHeader: {
    type: Array,
    default: () => [],
  },
  downloadData: {
    type: Array,
    default: () => [],
  },
  exportable: {
    type: Boolean,
    default: true,
  },
  pagination: {
    type: Boolean,
    default: true,
  },
  needHeader: {
    type: Boolean,
    default: true,
  },
  // 按钮权限控制 分析类型
  analysisType: {
    type: [String, Number],
    default: '',
  },
})

const appId = toRef(inject('appId', sessionStorage.getItem('appId')))

const resultClusterRef = ref(null)
const resultUserRef = ref(null)
const tableRef = ref(null)
const dataQP = ref({})
const totalCount = ref(0)

const apis = ref({
  3: funnelClusterAdd,
  4: userClusterAdd,
  6: createScatterSegmentation,
  8: createIntervalSegmentation,
})

const getGroupValue = (row, label, value) => {
  let sliceGroupVal = []
  if (props.qp.userCrowds.length === 0) {
    if (props.qp.groupBy.length === 1) {
      sliceGroupVal = [row.name]
    }
    if (props.qp.groupBy.length === 2) {
      sliceGroupVal = [row.name, label]
    }
  } else {
    sliceGroupVal = [row.name]
  }
  dataQP.value = {
    ...props.qp,
    sliceGroupVal,
  }

  totalCount.value = value

  nextTick(() => {
    resultUserRef.value.open()
  })
}

/**
 * @description: 是否显示用户分群、用于序列操作按钮
 * @return {*}
 */
const showCluster = (row, item) => {
  return (
    props.isUserCluster && row[item.prop] && typeof row[item.prop] === 'number'
  )
}

/**
 * @description: 导出数据
 * @return {*}
 */
const download = () => {
  recordBehavior({
    moduleName: '分析',
    submoduleName: props.fileName,
    operate: '导出报表数据',
    businessId: props.info?.businessId,
  })
  const fileHeader = props.columns.map((item) => item.title)
  const fileData = []

  const data = tableRef.value.data || []
  data.forEach((item) => {
    const list = []
    props.columns.forEach((val) => {
      list.push(item[val.prop])
    })
    fileData.push(list)
  })

  exportExcel({
    fileHeader,
    fileData, //二维数组,
  })
}

/**
 * @description: 导出excel
 * @return {*}
 * @param {array} fileHeader
 * @param {array} fileData 二维数组
 */
const exportExcel = ({ fileHeader, fileData }) => {
  const sheetData = []
  sheetData.push(fileHeader)
  fileData.forEach((item) => {
    sheetData.push(item)
  })

  const sheets = {
    sheetData,
  }
  exportToExcel({
    sheets,
    fileName: `${props.fileName}_${dayjs().format(
      'YYYYMMDD'
    )}_${dayjs().valueOf()}`,
  })
}

/**
 * @description: 漏斗创建结果分群
 * @return {*}
 */
const createCluster = (info) => {
  resultClusterRef.value.open(info)
}

/**
 * @description: 漏斗用户列表
 * @return {*}
 */
const openUserListDialog = (params) => {
  resultUserRef.value.open(params)
}

/**
 * @description: 用户列表
 * @return {*}
 */
const clusterUserList = () => {
  resultUserRef.value.open()
}

const handleClusterOpen = (index, row, column) => {
  dataQP.value = {
    ...props.qp,
  }
  const info = getClusterParams(row, column)
  resultClusterRef.value.open(info)
}

// 获取添加属性分群参数
const getClusterParams = (row, column) => {
  const userCrowds = dataQP.value.userCrowds || []
  const groupBy = dataQP.value.groupBy || []
  const type = 4
  const temp = {
    appId: appId.value || sessionStorage.getItem('appId'),
    qp: JSON.stringify(dataQP.value),
    type,
    groupValue: [],
    startDate: '',
    eventAlis: '',
    endDate: '',
  }
  if (userCrowds.length === 0) {
    if (groupBy.length === 1) {
      temp['groupValue'] = [row.name]
    } else if (groupBy.length === 2) {
      temp['groupValue'] = [row.name, column.title]
    }
  } else {
    temp['data'] = {
      chooseUserCrowdName: row.name,
    }
  }
  return temp
}

defineExpose({
  download,
  exportExcel,
  createCluster,
  openUserListDialog,
  clusterUserList,
  getTableRef() {
    return tableRef.value
  },
})
</script>

<style lang="scss" scoped>
:deep() {
  .vxe-body--column {
    vertical-align: middle;
  }
}
</style>
