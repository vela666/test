<template>
  <CommonDrawer
    v-model="state.show"
    :title="$t('dataManagement.configureProperties')"
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
      row-key="fId"
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
import { markRaw, reactive, computed, ref, nextTick } from 'vue'
import { alphabetSort } from '@/utils'
import {
  eventDataTypeList,
  eventDataTypeListMap,
} from '@/enumeration/data-management/event.js'
import {
  asyncBindEventField,
  asyncGetFieldByEvent,
} from '@/api/modules/programme/event.js'
import { asyncSearchEventFieldList } from '@/api/modules/programme/event-attr.js'
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
      .includes(filterConfig.searchVal.toLocaleLowerCase())

    let isSelected = !Number.isInteger(filterConfig.isSelected)
    if (!isSelected) {
      if (filterConfig.isSelected === 1) {
        isSelected = state.tableSelectedData.some(
          (selectedItem) => selectedItem.fId === item.fId
        )
      }
      if (filterConfig.isSelected === 2) {
        isSelected = state.tableSelectedData.every((selectedItem) => {
          return selectedItem.fId !== item.fId
        })
      }
    }

    let dataType = !filterConfig.dataType
    if (!dataType) {
      if (filterConfig.dataType === 'double') {
        dataType = item.fType === 'double' || item.fType === 'int'
      } else {
        dataType = item.fType === filterConfig.dataType
      }
    }

    return search && isSelected && dataType
  })
})

const getData = async () => {
  try {
    state.operateLoading = true
    const {
      data: { list },
    } = await asyncSearchEventFieldList({
      size: -1,
    })
    const { data } = await asyncGetFieldByEvent(state.rowData.eventId)

    state.tableData = list
    nextTick(() => {
      state.tableData.forEach((item) => {
        data.forEach((v) => {
          if (v.fId === item.fId) {
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
  await asyncBindEventField({
    eventId: state.rowData.eventId,
    fieldIds: state.tableSelectedData.map((item) => item.fId),
  }).finally((_) => {
    state.operateLoading = false
  })
  state.show = false
  emit('getData')
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
  name: 'ViewConfigAttr',
})
</script>

<style scoped lang="scss"></style>
