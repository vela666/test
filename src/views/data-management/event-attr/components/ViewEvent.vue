<template>
  <CommonDrawer
    v-model="state.show"
    :title="$t('dataManagement.eventAttr.viewAssociatedEvents')"
    @close="close"
    :showBtn="false"
    :loading="state.operateLoading">
    <div class="mb20 flex flex-between">
      <CommonInput
        v-model="filterConfig.key"
        :desc="$t('dataManagement.searchEventPlaceholder')"
        class="w240" />
    </div>
    <el-table
      v-loading="state.exhibitLoading"
      class="nd-table-custom h-auto"
      :data="filtetData"
      border
      ref="tableRef">
      <el-table-column
        v-for="(column, index) of columns"
        :prop="column.prop"
        :key="index"
        :label="column.label"
        show-overflow-tooltip
        :sortable="!!column.sortable"
        :sort-method="(a, b) => column.sortMethod(a, b, column.prop)">
        <template #header v-if="column.header">
          <FilterDropdown
            v-model="filterConfig[column.filterKey]"
            :list="column.list"
            :name="column.label" />
        </template>
        <template #default="{ row }">
          <template v-if="column.prop === 'eventType'">
            {{ eventTypeListMap[row[column.prop]] }}
          </template>
          <template v-else>
            {{ row[column.prop] }}
          </template>
        </template>
      </el-table-column>
    </el-table>
  </CommonDrawer>
</template>

<script setup>
import { reactive, ref, markRaw, computed } from 'vue'
import { alphabetSort } from '@/utils'
import {
  eventTypeList,
  eventTypeListMap,
} from '@/enumeration/data-management/event'

import { asyncGetAttrCorrelationEvent } from '@/api/modules/data-management/event-attr'
import { delNullProperty } from '@/utils/dataProcessing'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    state: {
      tableData: [],
      show: false,
      operateLoading: false,
      rowData: {},
    },
    filterConfig: {
      // 事件类型（1自定义事件，2预定义事件,3虚拟事件）
      eventType: '',
      key: '',
      page: 1, // 当前页码
      size: -1, // 每页数量
    },
  }
}

const columns = [
  {
    prop: 'eventName',
    label: t('dataManagement.eventName'),
    sortable: true,
    sortMethod: alphabetSort,
  },
  {
    prop: 'eventNameZh',
    label: t('dataManagement.displayName'),
  },
  {
    prop: 'eventType',
    header: true,
    filterKey: 'eventType',
    list: eventTypeList,
    label: t('dataManagement.eventType'),
  },
]
let requested = false

const emit = defineEmits(['getData'])
const state = reactive(initVal().state)
const filterConfig = reactive(initVal().filterConfig)
const tableRef = ref(null)

const filtetData = computed(() => {
  return state.tableData.filter((item) => {
    const search = (item.eventName + item.eventNameZh)
      .toLocaleLowerCase()
      .includes(filterConfig.key.toLocaleLowerCase())

    let eventType =
      !filterConfig.eventType || item.eventType === filterConfig.eventType

    return search && eventType
  })
})

const getData = async () => {
  const {
    data: { list },
  } = await asyncGetAttrCorrelationEvent({
    fId: state.rowData.fId,
    ...delNullProperty(filterConfig),
  })
  state.tableData = list
}

const close = () => {
  Object.assign(state, initVal().state)
  Object.assign(filterConfig, initVal().filterConfig)
  requested && emit('getData')
  requested = false
}

const open = (val) => {
  state.rowData = markRaw(val)
  state.show = true
  getData()
}

defineExpose({
  open,
})
defineOptions({
  name: 'ViewEvent',
})
</script>

<style scoped lang="scss"></style>
