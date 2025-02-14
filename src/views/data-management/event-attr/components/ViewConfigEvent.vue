<template>
  <CommonDrawer
    v-model="state.show"
    :title="$t('dataManagement.eventAttr.configureEvents')"
    @submit="submit"
    @close="close"
    :loading="state.operateLoading">
    <OperateTip class="mb20">
      {{ $t('dataManagement.eventAttr.cancelAssociation') }}
    </OperateTip>
    <div class="mb20 flex-center flex-between">
      <div>
        <CommonInput
          v-model="filterConfig.searchVal"
          :desc="$t('dataManagement.searchEventPlaceholder')"
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
        {{ state.tableData.length }} {{ $t('common.pcs') }}
      </span>
    </div>
    <el-table
      v-loading="state.exhibitLoading"
      class="nd-table-custom h-auto"
      :data="filtetData"
      border
      row-key="eventId"
      ref="tableRef"
      @select="select"
      @select-all="select"
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
    <template #footer-l>
      <div class="flex-center gap20">
        <label class="flex-center">
          <el-switch
            @change="publicAttributesChange"
            v-model="state.publicAttributes"
            :active-value="1"
            :inactive-value="2" />
          <span class="fz14 ml10 c545e6e">
            {{ $t('dataManagement.eventAttr.publicAttribute') }}
          </span>

          <Tooltip>
            <template #content>
              {{ $t('dataManagement.eventAttr.publicAttributeTips') }}
            </template>
            <SvgIcon name="help2" class="c545e6e ml5" />
          </Tooltip>
        </label>
        <label class="flex-center">
          <el-switch
            :disabled="state.publicAttributes === 1"
            v-model="state.autoConfig"
            :active-value="1"
            :inactive-value="2" />
          <span class="fz14 ml10 c545e6e">
            {{ $t('dataManagement.eventAttr.autoAttributeForEvents') }}
          </span>
        </label>
      </div>
    </template>
  </CommonDrawer>
</template>

<script setup>
import { markRaw, reactive, computed, ref, nextTick } from 'vue'
import { alphabetSort } from '@/utils'

import {
  asyncSaveConfigEvent,
  asyncGetConfigEvent,
} from '@/api/modules/data-management/event-attr'
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
      // (新增事件关联自动关联此属性/新增事件是否绑定此虚拟属性) 1 是 2 否
      autoConfig: 2,
      // 作为公共属性  1 是  2否
      publicAttributes: 2,
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
  state.operateLoading = true
  const { data } = await asyncGetConfigEvent({
    fId: state.rowData.fId,
    type: state.rowData.type,
  }).finally((_) => {
    state.operateLoading = false
  })
  state.tableData = data
  nextTick(() => {
    state.tableData.forEach((item) => {
      // 已配置
      if (item.configStatus === 1) {
        tableRef.value.toggleRowSelection(item, true)
      }
    })
  })
}

const publicAttributesChange = (val) => {
  if (val === 1) {
    state.tableData.forEach((item) => {
      tableRef.value.toggleRowSelection(item, true)
    })
    state.autoConfig = 1
  }
}

const select = () => {
  state.publicAttributes = 2
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
  await asyncSaveConfigEvent({
    fId: state.rowData.fId,
    autoConfig: state.autoConfig,
    publicAttributes: state.publicAttributes,
    eventIdList: state.tableSelectedData.map((item) => item.eventId),
  }).finally((_) => {
    state.operateLoading = false
  })
  state.show = false
  emit('getData')
}

const open = (data) => {
  state.autoConfig = data.autoConfig
  state.publicAttributes = data.publicAttributes || 2
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
