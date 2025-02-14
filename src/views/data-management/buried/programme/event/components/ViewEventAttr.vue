<template>
  <CommonDrawer
    v-model="state.show"
    :title="$t('dataManagement.viewAssociatedAttr')"
    @close="close"
    :showBtn="false"
    :loading="state.operateLoading">
    <div class="mb20 flex flex-between">
      <CommonInput
        v-model="filterConfig.key"
        :desc="$t('dataManagement.searchAttributeAndDisplay')"
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
          <template v-if="column.prop === 'fType'">
            {{ eventDataTypeListMap[row[column.prop]] }}
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
import { computed, markRaw, reactive, ref } from 'vue'
import { alphabetSort } from '@/utils'
import {
  eventDataTypeList,
  eventDataTypeListMap,
} from '@/enumeration/data-management/event'
import { asyncGetFieldByEvent } from '@/api/modules/programme/event.js'
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
      key: '',
      dataType: '',
    },
  }
}

const columns = [
  {
    prop: 'fEn',
    label: t('dataManagement.attributeName'),
    sortable: true,
    sortMethod: alphabetSort,
  },
  {
    prop: 'fZh',
    label: t('dataManagement.displayName'),
  },
  {
    prop: 'fType',
    header: true,
    filterKey: 'dataType',
    list: eventDataTypeList,
    label: t('dataManagement.attributeType'),
  },
]

const emit = defineEmits(['getData'])
const state = reactive(initVal().state)
const filterConfig = reactive(initVal().filterConfig)
const tableRef = ref(null)

const filtetData = computed(() => {
  return state.tableData.filter((item) => {
    const search = (item.fEn + item.fZh)
      .toLocaleLowerCase()
      .includes(filterConfig.key.toLocaleLowerCase())

    let dataType = !filterConfig.dataType
    if (!dataType) {
      if (filterConfig.dataType === 'double') {
        dataType = item.fType === 'double' || item.fType === 'int'
      } else {
        dataType = item.fType === filterConfig.dataType
      }
    }
    return search && dataType
  })
})

const getData = async () => {
  const { data } = await asyncGetFieldByEvent(state.rowData.eventId)
  state.tableData = data
}

const close = () => {
  Object.assign(state, initVal().state)
  Object.assign(filterConfig, initVal().filterConfig)
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
  name: 'ViewEventAttr',
})
</script>

<style scoped lang="scss"></style>
