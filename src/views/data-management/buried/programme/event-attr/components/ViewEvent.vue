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
          {{ row[column.prop] }}
        </template>
      </el-table-column>
    </el-table>
  </CommonDrawer>
</template>

<script setup>
import { computed, markRaw, reactive, ref } from 'vue'
import { alphabetSort } from '@/utils'

import { asyncGetEventByField } from '@/api/modules/programme/event-attr.js'
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
]
let requested = false

const emit = defineEmits(['getData'])
const state = reactive(initVal().state)
const filterConfig = reactive(initVal().filterConfig)
const tableRef = ref(null)

const filtetData = computed(() => {
  return state.tableData.filter((item) => {
    return (item.eventName + item.eventNameZh)
      .toLocaleLowerCase()
      .includes(filterConfig.key.toLocaleLowerCase())
  })
})

const getData = async () => {
  state.operateLoading = true
  const { data } = await asyncGetEventByField(state.rowData.fId).finally(
    (_) => {
      state.operateLoading = false
    }
  )
  state.tableData = data
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
