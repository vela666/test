<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('dataManagement.eventAttr.publishAttributes')"
    size="600px">
    <OperateTip class="mb20">
      {{ $t('dataManagement.eventAttr.publishAttributesTips') }}
    </OperateTip>
    <div class="mb5">
      {{ $t('common.selected') }}
      <span class="c5473e8">{{ state.tableSelectedData.length }}</span>
      {{ $t('common.pcs') }}
    </div>
    <el-table
      v-loading="state.exhibitLoading"
      class="nd-table-custom"
      :data="filterPagedData"
      border
      ref="tableRef"
      row-key="fEn"
      @selection-change="selectionChange">
      <el-table-column reserve-selection type="selection" width="55" />
      <el-table-column
        v-for="(column, index) of columns"
        :prop="column.prop"
        :key="index"
        :label="column.label"
        show-overflow-tooltip>
        <template #header v-if="column.header">
          <FilterDropdown
            v-model="state[column.filterKey]"
            :list="column.list"
            :name="column.label" />
        </template>
        <template #default="{ row }">
          <span
            v-if="column.prop === 'total'"
            :class="[row[column.prop] === 0 ? 'cff9f24' : '']">
            {{
              row[column.prop] === 0
                ? $t('dataManagement.notConfigured')
                : row[column.prop]
            }}
          </span>
          <template v-else>
            {{ row[column.prop] }}
          </template>
        </template>
      </el-table-column>
    </el-table>
  </CommonDrawer>
</template>

<script setup>
import { reactive, nextTick, computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  asyncGetUnpublishedEventAttr,
  asyncPublishEventAttr,
} from '@/api/modules/data-management/event-attr'

import {
  asyncGetUnpublishedUserAttr,
  asyncPublishUserAttr,
} from '@/api/modules/data-management/user'

import { configAttrTypeList } from '@/enumeration/data-management/common'
import { filteNotDisplayrDataTypeMap } from '@/enumeration/data-management/event-attr'
import { t } from '@/locales/i18n'

const props = defineProps({
  // 1是事件属性 2是用户属性
  type: {
    type: String,
    default: '1',
  },
})

const columns = [
  {
    label: t('dataManagement.attributeName'),
    prop: 'fEn',
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'fZh',
  },
  {
    label: t('dataManagement.eventAttr.configureEvents'),
    prop: 'total',
    header: true,
    list: configAttrTypeList,
    filterKey: 'hasConfigEvent',
  },
].slice(0, +props.type === 1 ? 3 : 2)

const initVal = () => {
  return {
    columns: [],
    pagedData: [],
    operateLoading: false,
    showOperate: false,
    tableSelectedData: [],
    hasConfigEvent: '',
  }
}

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const tableRef = ref(null)
const filterPagedData = computed(() => {
  if (state.hasConfigEvent !== '') {
    return state.pagedData.filter((item) => {
      if (state.hasConfigEvent === 1 && item.total !== 0) {
        return true
      }
      return state.hasConfigEvent === 2 && item.total === 0
    })
  }
  return state.pagedData
})
const bool = computed(() => +props.type === 1)
const selectionChange = (val) => {
  state.tableSelectedData = val
}

const getList = async () => {
  state.operateLoading = true
  const fn = bool.value
    ? asyncGetUnpublishedEventAttr
    : asyncGetUnpublishedUserAttr
  const { data } = await fn().finally((_) => {
    state.operateLoading = false
  })
  state.pagedData = data.map((item) => {
    return {
      ...item,
      newFtype:
        item.fType === 'double' && item.fLen
          ? `${item.fType}_${item.fLen}`
          : item.fType,
    }
  })
}

const close = () => {
  Object.assign(state, initVal())
}

const submit = async () => {
  if (!state.tableSelectedData.length) {
    ElMessage.warning(t('dataManagement.eventAttr.checkPublishAttributes'))
    return
  }
  const errorList = state.tableSelectedData.reduce((p, c) => {
    if (!filteNotDisplayrDataTypeMap[c.newFtype]) {
      p.push(c.fEn)
    }
    return p
  }, [])
  if (errorList.length) {
    ElMessage.error(
      t('dataManagement.eventAttr.confirmPublishAttributes', [
        errorList.join('、'),
      ])
    )
    return
  }
  state.operateLoading = true
  const fn = bool.value ? asyncPublishEventAttr : asyncPublishUserAttr
  await fn({
    [bool.value
      ? 'unpublishedEventPropertyList'
      : 'unpublishedUserPropertyList']: state.tableSelectedData,
  }).finally((_) => {
    state.operateLoading = false
  })
  emit('getData')
  ElMessage.success(t('dataManagement.publishedSuccessfully'))
  state.showOperate = false
}

const open = async () => {
  await getList()
  if (!state.pagedData.length) {
    ElMessage.info(t('dataManagement.eventAttr.attributesAvailable'))
    return
  }
  state.showOperate = true
  nextTick(() => {
    state.pagedData.forEach((item) => {
      tableRef.value.toggleRowSelection(item)
    })
  })
}

defineExpose({
  open,
})
defineOptions({
  name: 'PublishAttr',
})
</script>
