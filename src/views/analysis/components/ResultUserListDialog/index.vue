<template>
  <CommonDialog
    className="nd-user-data-detail-dialog"
    v-model="visible"
    fullscreen
    :show-close="false"
    :needFooter="false">
    <template #header>
      <DialogFullScreenHeader
        @close="dialogClosed"
        :title="$t('analysis.component.userList')" />
    </template>

    <CommonLayout v-loading="state.loading">
      <div class="flex-column h100-percentage">
        <header class="flex flex-between mt20 mb20">
          <CustomField
            v-model="state.checkedValue"
            :data="state.customFieldData"
            :default-props="{ label: 'fZh', value: 'fEn' }"
            value-key
            @submit="confirmField" />
          <div>
            <!-- <el-button @click="resultClusterRef.open()">
              <svg-icon name="add1" class="mr5 fz16" />创建结果分群
            </el-button> -->
            <el-button
              type="primary"
              @click="downloadData"
              :loading="state.downloading"
              :disabled="state.pageData.length === 0">
              <svg-icon name="download" class="mr5 fz16" />
              {{ $t('analysis.component.download') }}
            </el-button>
          </div>
        </header>

        <el-table class="nd-table-custom" :data="state.pageData" border>
          <el-table-column
            v-for="item in state.columns"
            :key="item.prop"
            :label="item.label"
            :prop="item.prop"
            show-overflow-tooltip
            v-bind="{ ...item }"
            :min-width="180"
            sortable
            :fixed="['__fid', '__did'].includes(item.prop)">
            <template #default="{ row }">
              <el-text
                type="primary"
                v-if="['__fid', '__did'].includes(item.prop)"
                @click="showSquenceDetail(row)"
                style="cursor: pointer">
                {{ row[item.prop] }}
              </el-text>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <Pagination
          v-model:limit="pageInfo.pageSize"
          v-model:page="pageInfo.pageNum"
          :total="pageInfo.total"
          :totalCount="totalCount"
          @getData="getList" />
      </template>
    </CommonLayout>
  </CommonDialog>

  <UserSequence ref="userSequenceRef" />
  <ResultCluster ref="resultClusterRef" :qp="qp" />
</template>

<script setup>
import { ref, reactive, markRaw, inject, toRef } from 'vue'
import UserSequence from '@/views/user/components/UserSequence/index.vue'
import {
  userEventSeqList,
  userListDownload,
} from '@/api/modules/analysis/attr.js'
import ResultCluster from '@/views/analysis/components/ResultClusterDialog/index.vue'
import { ElMessage } from 'element-plus'
import { isObject, cloneDeep, isFunction } from 'lodash-es'
import {
  eventUserSequence,
  ltvUserSequence,
  retentionUserSequence,
  funnelUserSequence,
  scatterUserSequence,
  intervalUserSequence,
  pathUserSequence,
  exportFunnelUserSequence,
  exportRetentionUserSequence,
  exportLtvUserSequence,
  exportEventUserSequence,
  exportScatterUserSequence,
  exportIntervalUserSequence,
  exportPathUserSequence,
} from '@/api/modules/common'
import { handleCustomColumn } from '@/utils/dataProcessing.js'
import { t } from '@/locales/i18n'

const props = defineProps({
  qp: {
    type: Object,
    default: () => {},
  },
  totalCount: {
    type: [String, Number],
    default: 0,
  },
  // 分析类型：1 事件分析，2 留存分析，3 漏斗分析，4 用户分析，5 路径分析，6 分布分析，7 sql查询，8 间隔分析，9 LTV分析
  analysisType: {
    type: [String, Number],
    default: '',
  },
})

const appId = toRef(inject('appId', sessionStorage.getItem('appId')))

const userListApis = markRaw({
  1: eventUserSequence,
  2: retentionUserSequence,
  3: funnelUserSequence,
  4: userEventSeqList,
  5: pathUserSequence,
  6: scatterUserSequence,
  8: intervalUserSequence,
  9: ltvUserSequence,
})

const exportUserListApis = markRaw({
  1: exportEventUserSequence,
  2: exportRetentionUserSequence,
  3: exportFunnelUserSequence,
  4: userListDownload,
  5: exportPathUserSequence,
  6: exportScatterUserSequence,
  8: exportIntervalUserSequence,
  9: exportLtvUserSequence,
})

const visible = ref(false)
const resultClusterRef = ref(null)
const userSequenceRef = ref(null)

const state = reactive({
  pageData: [],
  columns: [],
  loading: false,
  checkedValue: [],
  customFieldData: [],
  downloading: false,
  paramsData: null,
  allAttrNames: [],
})

const pageInfo = reactive({
  pageSize: 20,
  pageNum: 1,
  total: 0,
})

const getList = () => {
  let params = {
    page: pageInfo.pageNum,
    size: pageInfo.pageSize,
    qp: props.qp,
    appId: appId.value,
  }
  const paramsDataCopy = cloneDeep(state.paramsData)
  if (isObject(paramsDataCopy) && Object.keys(paramsDataCopy).length > 0) {
    params = Object.assign(params, paramsDataCopy)
  }
  state.loading = true
  const method = isFunction(userListApis[props.analysisType])
    ? userListApis[props.analysisType]
    : userEventSeqList
  method(params)
    .then((res) => {
      const { list, other, page } = res.data
      state.pageData = list
      pageInfo.total = page.totalCount
      getDefaultColumns(other.columMeta)
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description: 设置默认选中的列
 * @return {*}
 */
const getDefaultColumns = (obj) => {
  // 用户ID 访客ID置顶
  const defaultColumn = ['__fid', '__did']

  const data = []
  Object.keys(obj).forEach((key) => {
    data.push({
      fZh: obj[key],
      fEn: key,
    })
  })

  const defaultField = data
    .filter((item) => ['__fid', '__did'].includes(item.fEn))
    .map((item) => {
      item.disabled = true
      return item
    })

  const preAttrs = [] // 预置属性
  const customAttr = [] //自定义属性
  const preAttrNames = []
  const customAttrNames = []
  for (const item of data) {
    if (item?.fEn?.startsWith('__')) {
      if (!['__fid', '__did'].includes(item.fEn)) {
        preAttrs.push(item)
        preAttrNames.push(item.fEn)
      }
    } else {
      customAttr.push(item)
      customAttrNames.push(item.fEn)
    }
  }
  state.allAttrNames = [
    ...new Set([...defaultColumn, ...preAttrNames, ...customAttrNames]),
  ]

  state.customFieldData = [...defaultField, ...preAttrs, ...customAttr]

  /*  state.checkedValue = [
    ...new Set([...defaultColumn, ...customAttr.map((item) => item.fEn)]),
  ]*/
  state.checkedValue = handleCustomColumn([
    ...new Set([...defaultColumn, ...preAttrNames, ...customAttrNames]),
  ])

  // 设置默认列
  const customTableColumn = JSON.parse(
    localStorage.getItem('customTableColumn') || '[]'
  )
  const column = [...preAttrs, ...customAttr]
  const tmp = customTableColumn.length
    ? column.reduce((p, c) => {
        customTableColumn.forEach((item) => {
          if (c.fEn === item) {
            p.push(c)
          }
        })
        return p
      }, [])
    : column

  // 设置默认列
  // formateColumns([...defaultField, ...tmp])
  formateColumns([...defaultField, ...tmp])
}

const formateColumns = (list) => {
  state.columns = list.map((item) => {
    item.label = item.fZh
    item.prop = item.fEn
    return item
  })
}

/**
 * @description: 用户行为序列
 * @return {*}
 */
const showSquenceDetail = (row) => {
  userSequenceRef.value.open(row, state.pageData)
}

const open = (info) => {
  if (isObject(info)) {
    state.paramsData = cloneDeep({ ...info, appId: appId.value })
  }
  visible.value = true
  getList()
}

const dialogClosed = () => {
  visible.value = false
  state.paramsData = null
}
/**
 * @description: 自定义列
 * @return {*}
 */
const confirmField = (data) => {
  formateColumns(data)
  localStorage.setItem(
    'customTableColumn',
    JSON.stringify(data.map((item) => item.fEn))
  )
}

const downloadData = () => {
  state.downloading = true
  let params = { qp: props.qp, appId: appId.value }
  const paramsDataCopy = cloneDeep(state.paramsData)
  if (isObject(paramsDataCopy) && Object.keys(paramsDataCopy).length > 0) {
    params = Object.assign({}, paramsDataCopy)
  }
  params['headColumnList'] = cloneDeep(state.allAttrNames)
  const method = isFunction(exportUserListApis[props.analysisType])
    ? exportUserListApis[props.analysisType]
    : userListDownload

  method(params)
    .then(() => {
      ElMessage.success(t('analysis.dataExportSuccessful'))
    })
    .finally(() => {
      state.downloading = false
    })
}

defineExpose({
  open,
})
</script>
