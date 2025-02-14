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
      <Tooltip
        placement="left"
        v-if="state.rowData.eventType === 1 && state.tableData.length">
        <el-button @click="release" type="primary">
          {{ $t('btn.publish') }}
        </el-button>
        <template #content>
          {{ $t('dataManagement.publishTips') }}
        </template>
      </Tooltip>
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
          <template v-if="column.prop === 'fSync'">
            {{
              row[column.prop] !== 0
                ? $t('dataManagement.published')
                : $t('dataManagement.unpublished')
            }}
          </template>
          <template v-else-if="column.prop === 'fType'">
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
import { reactive, ref, markRaw, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { alphabetSort } from '@/utils'
import {
  eventDataTypeList,
  eventDataTypeListMap,
} from '@/enumeration/data-management/event'

import { releaseStatusList } from '@/enumeration/data-management/common'
import {
  asyncGetEventCorrelationAttr,
  asyncPublishEventAttr,
} from '@/api/modules/data-management/event'
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
      publishStatus: '',
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
    label: t('dataManagement.dataType'),
  },
  {
    prop: 'fSync',
    header: true,
    filterKey: 'publishStatus',
    list: releaseStatusList,
    label: t('dataManagement.publishStatus'),
  },
]
let requested = false

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
    let fSync = !Number.isInteger(filterConfig.publishStatus)

    if (!fSync) {
      if (filterConfig.publishStatus === 1) {
        fSync = item.fSync !== 0
      } else {
        fSync = item.fSync === filterConfig.publishStatus
      }
    }

    return search && dataType && fSync
  })
})

const getData = async () => {
  const {
    data: { list },
  } = await asyncGetEventCorrelationAttr({
    eventId: state.rowData.eventId,
    size: -1,
  })
  state.tableData = list
}

const release = async () => {
  state.operateLoading = true
  const {
    data: { list },
  } = await asyncPublishEventAttr({
    eventId: state.rowData.eventId,
  }).finally((_) => {
    state.operateLoading = false
  })
  getData()
  ElMessage.success(t('dataManagement.publishedSuccessfully'))
  requested = true
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
  name: 'ViewEventAttr',
})
</script>

<style scoped lang="scss"></style>
