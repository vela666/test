<template>
  <CommonDrawer
    v-model="state.show"
    :title="$t('dataManagement.eventAttr.configureEvents')"
    @submit="submit"
    @close="close"
    :loading="state.operateLoading">
    <div class="mb20 flex-center flex-between">
      <div>
        <CommonInput
          v-model="filterConfig.searchVal"
          :desc="$t('dataManagement.searchAttributeAndDisplay')"
          class="w240 mr10" />
        <el-select
          :placeholder="$t('dataManagement.selectedPlaceholder')"
          class="w180"
          clearable
          v-model="filterConfig.isSelected">
          <el-option
            :value="1"
            :label="$t('dataManagement.viewSelectedItem')"></el-option>
          <el-option
            :value="2"
            :label="$t('dataManagement.viewUnSelectedItem')"></el-option>
        </el-select>
      </div>
      <span class="fz14 c545e6e"
        >{{ $t('common.selected') }}
        <i class="c5473e8">{{ state.tableSelectedData.length }}</i> /
        {{ state.tableData.length }} {{ $t('common.pcs') }}</span
      >
    </div>
    <el-table
      v-loading="state.exhibitLoading"
      class="nd-table-custom h-auto"
      :data="filtetData"
      border
      row-key="eventId"
      ref="tableRef"
      @selection-change="selectionChange">
      <el-table-column reserve-selection type="selection" width="55" />
      <el-table-column
        v-for="(column, index) of columns"
        :prop="column.prop"
        :key="index"
        :label="column.label"
        show-overflow-tooltip
        :sortable="!!column.sortable"
        :sort-method="(a, b) => column.sortMethod(a, b, column.prop)">
        <template #default="{ row }">
          {{ row[column.prop] }}
        </template>
      </el-table-column>
    </el-table>
  </CommonDrawer>
</template>

<script setup>
import { markRaw, reactive, computed, ref, nextTick } from 'vue'
import { alphabetSort } from '@/utils'

import {
  asyncBindFieldEvent,
  asyncGetEventByField,
} from '@/api/modules/programme/event-attr.js'
import { asyncSearchEventList } from '@/api/modules/programme/event.js'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    state: {
      searchVal: '',
      filterStatus: '',
      tableData: [],
      tableSelectedData: [],
      show: false,
      rowData: {},
      operateLoading: false,
    },
    filterConfig: {
      searchVal: '',
      isSelected: '',
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

const emit = defineEmits(['getData'])
const state = reactive(initVal().state)
const filterConfig = reactive(initVal().filterConfig)
const tableRef = ref(null)

const filtetData = computed(() => {
  return state.tableData.filter((item) => {
    const search = (item.eventName + item.eventNameZh)
      .toLocaleLowerCase()
      .includes(filterConfig.searchVal.toLocaleLowerCase())

    let isSelected = !Number.isInteger(filterConfig.isSelected)
    if (!isSelected) {
      if (filterConfig.isSelected === 1) {
        isSelected = state.tableSelectedData.some(
          (selectedItem) => selectedItem.eventId === item.eventId
        )
      }
      if (filterConfig.isSelected === 2) {
        isSelected = state.tableSelectedData.every((selectedItem) => {
          return selectedItem.eventId !== item.eventId
        })
      }
    }
    return search && isSelected
  })
})

const getData = async () => {
  try {
    state.operateLoading = true
    const {
      data: { list },
    } = await asyncSearchEventList({
      size: -1,
    })

    const { data } = await asyncGetEventByField(state.rowData.fId)

    state.tableData = list
    nextTick(() => {
      state.tableData.forEach((item) => {
        data.forEach((v) => {
          if (v.eventId === item.eventId) {
            tableRef.value.toggleRowSelection(item, true)
          }
        })
      })
    })
  } finally {
    state.operateLoading = false
  }
}

const selectionChange = (val) => {
  state.tableSelectedData = val
}

const close = () => {
  Object.assign(state, initVal().state)
  Object.assign(filterConfig, initVal().filterConfig)
}

const submit = async () => {
  state.operateLoading = true
  await asyncBindFieldEvent({
    fId: state.rowData.fId,
    eventIds: state.tableSelectedData.map((item) => item.eventId),
  }).finally((_) => {
    state.operateLoading = false
  })
  state.show = false
  emit('getData')
}

const open = (data) => {
  state.rowData = markRaw(data)
  state.show = true
  getData()
}

defineExpose({
  open,
})
defineOptions({
  name: 'ViewConfigEvent',
})
</script>

<style scoped lang="scss"></style>
