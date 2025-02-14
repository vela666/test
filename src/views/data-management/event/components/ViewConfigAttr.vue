<template>
  <CommonDrawer
    v-model="state.show"
    :title="$t('dataManagement.configureProperties')"
    @submit="submit"
    @close="close"
    :loading="state.operateLoading">
    <OperateTip class="mb20">
      {{ $t('dataManagement.event.configPropertiesTip') }}
    </OperateTip>
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
  asyncAddConfigAttr,
  asyncGetEventConfigAttr,
} from '@/api/modules/data-management/event'
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
    prop: 'fEn',
    label: t('dataManagement.attributeName'),
    sortable: true,
    sortMethod: alphabetSort,
  },
  {
    prop: 'fZh',
    label: t('dataManagement.displayName'),
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
    return search && isSelected
  })
})

const getData = async () => {
  state.operateLoading = true
  const { data } = await asyncGetEventConfigAttr({
    eventId: state.rowData.eventId,
  }).finally((_) => {
    state.operateLoading = false
  })

  state.tableData = data
  nextTick(() => {
    state.tableData.forEach((item) => {
      if (item.configStatus === 1) {
        tableRef.value.toggleRowSelection(item, true)
      }
    })
  })
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
  await asyncAddConfigAttr({
    eventId: state.rowData.eventId,
    propertyIdList: state.tableSelectedData.map((item) => item.fId),
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
