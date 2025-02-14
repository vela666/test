<script setup>
import { cloneDeep, debounce } from 'lodash-es'
import { ref, toRef, reactive, watch, nextTick, useAttrs } from 'vue'
import { exportToExcel } from '@/utils/excel'
import dayjs from 'dayjs'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const attrs = useAttrs()
const props = defineProps({
  columns: {
    //列字段
    type: Object,
    default: () => {},
  },
  data: {
    //原始数据集合
    type: Array,
    default: () => [],
  },
  maxHeight: {
    //列字段
    type: [Number, String],
    default: 600,
  },
  pageFlag: {
    type: Boolean,
    default: false,
  },
  needIndex: {
    // 是否需要序号
    type: Boolean,
    default: false,
  },
})

const state = reactive({
  columns: [],
  tableData: [],
  tableLimitData: [],
  sortList: [],
  pageNum: 1,
  pageSize: 10,
  total: 0,
})

const xTable = ref()

/**
 * @description 字段必须用field
 */
const setColumnConfig = (item) => ({
  minWidth: 120,
  resizable: true,
  sortable: true,
  field: item.field || item.prop,
  slots: {
    default: `default_${item.field || item.prop}`,
    header: `header_${item.field || item.prop}`,
  },
})
watch(
  () => props.columns,
  () => {
    const tempColumn = []
    if (props.needIndex) {
      tempColumn.push({
        ...setColumnConfig({ field: 'index' }),
        title: t('common.orderNumber'),
        sortable: false,
        width: 80,
      })
    }

    for (const item of props.columns) {
      tempColumn.push({
        ...setColumnConfig(item),
        ...item,
      })
    }
    state.columns = tempColumn
    loadColumnAndData()
  },
  { deep: true, immediate: true }
)

watch(
  () => props.data,
  () => {
    state.tableData = cloneDeep(props.data)
    state.tableData.forEach((item, index) => {
      item.index = index + 1
    })
    loadColumnAndData()
    state.pageNum = 1
    if (props.pageFlag) {
      state.tableLimitData = state.tableData.slice(
        (state.pageNum - 1) * state.pageSize,
        state.pageNum * state.pageSize
      )
      state.total = state.tableData.length
    }
  },
  { deep: true, immediate: true }
)

function loadColumnAndData() {
  nextTick(() => {
    if (xTable.value) {
      xTable.value?.refreshColumn()
      const data = props.pageFlag ? state.tableLimitData : state.tableData
      xTable.value?.reloadData(data)
      xTable.value?.reloadColumn(state.columns)
    }
  })
}

loadColumnAndData()
/**
 * @description
 * @param {object} item1 排序数据1
 * @param {object} item2 排序数据2
 * @param {Array} arr 排序字段 [{'field': 'a', 'order': 'desc'}] asc升序 desc 降序
 * @returns {boolean}
 */
const sortFun = (item1, item2, arr) => {
  // 多字段排序
  //asc升序 desc 降序
  let props = []
  if (arr && arr.length) {
    props = arr
  }
  const sortPropsRes = [] // 存储排序属性比较结果。
  // 如果未指定排序属性(即obj不存在)，则按照全属性升序排序。
  // 记录下两个排序项按照各个排序属性进行比较得到的结果
  let asc = true

  function handleIsNull(val) {
    return ['', null, '未知'].includes(val)
  }

  const numReg = /(\[|\()(\d+(\.\d+)?|-∞)(~|,)(\d+(\.\d+)?|\+?∞)\)/
  const strNumReg = /^(-|\+)?\d+(\.\d+)?$/
  const strPercent = /^(-|\+)?\d+(\.\d+)?%$/

  function handleCustomNum(attrB1, attrB2) {
    if (numReg.test(attrB1) || numReg.test(attrB2)) {
      if (['-∞', '+∞'].includes(attrB1.replace(numReg, '$2'))) {
        if (attrB1.replace(numReg, '$2') === '+∞') {
          attrB1 = Infinity
        } else {
          attrB1 = -Infinity
        }
      } else {
        attrB1 = parseFloat(attrB1.replace(numReg, '$2'))
      }
      if (['-∞', '+∞'].includes(attrB2.replace(numReg, '$2'))) {
        if (attrB2.replace(numReg, '$2') === '+∞') {
          attrB2 = Infinity
        } else {
          attrB2 = -Infinity
        }
      } else {
        attrB2 = parseFloat(attrB2.replace(numReg, '$2'))
      }
    }
    return { attrB1, attrB2 }
  }

  if (props.length < 1) {
    for (const p in item1) {
      let attrA1, attrA2
      attrA1 = item1[p]
      attrA2 = item2[p]
      if (handleIsNull(attrA1) && handleIsNull(attrA2)) {
        sortPropsRes.push(0)
      } else if (!handleIsNull(attrA1) && handleIsNull(attrA2)) {
        sortPropsRes.push(1)
        break
      } else if (handleIsNull(attrA1) && !handleIsNull(attrA2)) {
        sortPropsRes.push(-1)
        break // 小于时跳出循环。
      } else {
        if (
          typeof attrA1 === 'string' &&
          typeof attrA2 === 'string' &&
          (!numReg.test(attrA1) || !numReg.test(attrA2))
        ) {
          let newNumA,
            newNumB,
            strFlag = false
          // 字符串类型（包括字符串数值）
          if (strNumReg.test(attrA1) || strNumReg.test(attrA2)) {
            // 字符串数值
            newNumA = parseFloat(attrA1)
            newNumB = parseFloat(attrA2)
          } else if (strPercent.test(newNumA) || strPercent.test(newNumB)) {
            // 百分比
            newNumA = parseFloat(attrA1.slice(0, -1))
            newNumB = parseFloat(attrA2.slice(0, -1))
          } else {
            //普通类型字符串
            strFlag = true
          }
          if (
            (!strFlag && newNumA > newNumB) ||
            (strFlag && attrA1.localeCompare(attrA2) > 0)
          ) {
            sortPropsRes.push(1)
            break // 大于时跳出循环。
          } else if (
            (!strFlag && newNumA === newNumB) ||
            (strFlag && attrA1 === attrA2)
          ) {
            sortPropsRes.push(0)
          } else {
            sortPropsRes.push(-1)
            break // 小于时跳出循环。
          }
        } else {
          // 数值
          if (attrA1 > attrA2) {
            sortPropsRes.push(1)
            break // 大于时跳出循环。
          } else if (attrA1 === attrA2) {
            sortPropsRes.push(0)
          } else {
            sortPropsRes.push(-1)
            break // 小于时跳出循环。
          }
        }
      }
    }
  } else {
    for (let i = 0; i < props.length; i++) {
      const prop = props[i].field
      // 循环排序字段
      asc = props[i].order === 'asc'
      let attrB1, attrB2
      attrB1 = item1[prop]
      attrB2 = item2[prop]
      if (handleIsNull(attrB1) && handleIsNull(attrB2)) {
        sortPropsRes.push(0)
      } else if (!handleIsNull(attrB1) && handleIsNull(attrB2)) {
        sortPropsRes.push(asc ? 1 : -1)
        break // 大于时跳出循环。
      } else if (handleIsNull(attrB1) && !handleIsNull(attrB2)) {
        sortPropsRes.push(asc ? -1 : 1)
        break // 小于时跳出循环。。
      } else {
        const obj = handleCustomNum(attrB1, attrB2)
        attrB1 = obj.attrB1
        attrB2 = obj.attrB2
        if (
          typeof attrB1 === 'string' &&
          typeof attrB2 === 'string' &&
          (!numReg.test(attrB1) || !numReg.test(attrB2))
        ) {
          let newNumA2,
            newNumB2,
            strFlag = false
          // 字符串类型（包括字符串数值）
          if (strNumReg.test(attrB1) || strNumReg.test(attrB2)) {
            // 字符串数值
            newNumA2 = parseFloat(attrB1)
            newNumB2 = parseFloat(attrB2)
          } else if (strPercent.test(attrB1) || strPercent.test(attrB2)) {
            // 百分比
            newNumA2 = parseFloat(attrB1.slice(0, -1))
            newNumB2 = parseFloat(attrB2.slice(0, -1))
          } else {
            //普通类型字符串
            strFlag = true
          }
          if (
            (!strFlag && newNumA2 > newNumB2) ||
            (strFlag && attrB1.localeCompare(attrB2) > 0)
          ) {
            sortPropsRes.push(asc ? 1 : -1)
            break // 大于时跳出循环。
          } else if (
            (!strFlag && newNumA2 === newNumB2) ||
            (strFlag && attrB1 === attrB2)
          ) {
            sortPropsRes.push(0)
          } else {
            sortPropsRes.push(asc ? -1 : 1)
            break // 小于时跳出循环。
          }
        } else {
          // 数值
          if (attrB1 > attrB2) {
            sortPropsRes.push(asc ? 1 : -1)
            break // 大于时跳出循环。
          } else if (attrB1 === attrB2) {
            sortPropsRes.push(0)
          } else {
            sortPropsRes.push(asc ? -1 : 1)
            break // 小于时跳出循环。。
          }
        }
      }
    }
  }
  // 根据各排序属性比较结果综合判断得出两个比较项的最终大小关系
  for (let j = 0; j < sortPropsRes.length; j++) {
    if (sortPropsRes[j] === 1 || sortPropsRes[j] === -1) {
      return sortPropsRes[j]
    }
  }
  return false
}

const emit = defineEmits(['getSortArr'])

/**
 * @description 排序方法
 */
const sortMethod = ({ sortList }) => {
  const arr = []
  const tempColumn = []
  for (const item of state.columns) {
    tempColumn.push({
      ...item,
      sortnum: 0,
      order: '',
    })
  }
  sortList.forEach((item, index) => {
    arr.push({
      field: item.field,
      order: item.order,
    })
    tempColumn.forEach((col) => {
      if (col.field === item.field) {
        col.sortnum = index + 1
        col.order = item.order
        return
      }
    })
  })
  state.columns = tempColumn
  emit('getSortArr', arr)

  const cloneData = cloneDeep(props.data)
  if (sortList.length) {
    cloneData
      .sort((a, b) => sortFun(a, b, arr))
      .forEach((item, index) => {
        item.index = index + 1
      })
  }
  state.tableData = cloneData
  if (props.pageFlag) {
    // 有分页数据，不能直接赋值，直接赋值属于操作dom元素，界面会卡扽
    return state.tableData.slice(
      (state.pageNum - 1) * state.pageSize,
      state.pageNum * state.pageSize
    )
  } else {
    return state.tableData
  }
}

/**
 * @description 获取分页数据
 */
const handleGetList = ({ page, limit }) => {
  state.pageNum = page
  if (state.sortList.length) {
    sortEvent(state.sortList)
  } else {
    state.tableLimitData = state.tableData.slice(
      (page - 1) * limit,
      page * limit
    )
    loadColumnAndData()
  }
}

const getList = () => {
  handleGetList({ page: state.pageNum, limit: state.pageSize })
}

/**
 * @description 排序改变chang方法
 */
const handleSortChange = ({ sortList }) => {
  state.sortList = sortList || []
  if (!sortList?.length) {
    sortMethod({ sortList })
  }
}

/**
 * @description 排序回填
 */
const sortEvent = (confs) => {
  const $table = xTable.value
  if ($table) {
    nextTick(() => {
      $table.sort(confs)
    })
  }
}

/**
 * @description 清除所有排序
 */
const clearSort = () => {
  const $table = xTable.value
  if ($table) {
    $table.clearSort()
  }
}

/**
 * @description 导出 Excel 文件
 * fileHeader: [key1,key2,key2...]
 * fileData: [value1,value2,value3...]
 * @author fengsi<294068744@qq.com>
 * @date 2024-03-07 15:29:20
 */
const exportExcel = ({ fileHeader, fileData }, fileName = '导出') => {
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
    fileName: `${fileName}_${dayjs().format('YYYYMMDD')}_${dayjs().valueOf()}`,
  })
}

defineExpose({
  sortEvent,
  clearSort,
  exportExcel,
  xTable,
  data: toRef(state, 'tableData'),
})

defineOptions({
  name: 'VxeTableSort',
})
</script>
<template>
  <div class="h100-percentage">
    <vxe-grid
      border
      ref="xTable"
      auto-resize
      :scroll-y="{
        enabled: true,
        gt: 100,
      }"
      :scroll-x="{
        enabled: true,
        gt: 100,
      }"
      :max-height="maxHeight"
      show-overflow
      :sort-config="{
        multiple: true,
        chronological: true,
        trigger: 'default',
        sortMethod: sortMethod,
      }"
      @sort-change="handleSortChange"
      :rowConfig="{
        useKey: true,
        isHover: false,
        isCurrent: false,
      }"
      class="nd-vxe-table-custom nd-vxe-column-center"
      show-header-overflow="ellipsis"
      v-bind="attrs">
      <template
        v-for="item in state.columns"
        :key="`${item.field}_header`"
        #[item.slots.header]="{ column, columnIndex }">
        <slot name="customHeader" :column="column"></slot>
        <template v-if="!Object.keys($slots).includes('customHeader')">
          <span class="vxe-header-custom">
            <div style="display: inline-block">
              {{ column.title }}
              <Tooltip v-if="item.tip">
                <SvgIcon class="mr3 c86919d fz14" name="help2" />
                <template #content>
                  <span v-html="item.tip"></span>
                </template>
              </Tooltip>
            </div>

            <span v-if="column.order" class="sort-number">
              {{ state.columns[columnIndex].sortnum }}
            </span>
          </span>
        </template>
      </template>
      <template
        v-for="(item, index) in state.columns"
        :key="`${item.field}_row`"
        #[item.slots.default]="{ row }">
        <slot
          name="customColumn"
          :row="row"
          :column="item"
          :index="index"></slot>
        <template v-if="!Object.keys($slots).includes('customColumn')">
          {{ row[item.field] }}
        </template>
      </template>
    </vxe-grid>
    <div
      v-if="pageFlag"
      class="report-view-footer flex-center flex-justify-content-end">
      <Pagination
        v-model:limit="state.pageSize"
        v-model:page="state.pageNum"
        :total="state.total"
        @getData="getList" />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.report-view-footer {
  width: 100%;
  height: 64px;
}

.vxe-header-custom {
  white-space: break-spaces !important;
}
</style>
