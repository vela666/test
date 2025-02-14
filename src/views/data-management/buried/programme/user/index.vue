<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterConfig.searchVal"
        :desc="$t('dataManagement.searchAttributeAndDisplay')"
        class="w240"
        notTrimSpace
        @input="getData('search')" />
    </template>
    <template #hr>
      <slot></slot>
    </template>
    <el-table
      v-loading="state.exhibitLoading"
      class="nd-table-custom"
      :data="state.pagedData"
      border
      ref="tableRef"
      row-key="fId"
      @selection-change="selectionChange"
      @sort-change="tableSortChange">
      <el-table-column type="selection" width="55" />
      <el-table-column
        v-for="(column, index) of columns"
        :prop="column.prop"
        :key="index"
        :label="column.label"
        :show-overflow-tooltip="!column.notShowTip"
        :sortable="column.sortable"
        :fixed="column.fixed">
        <template #header v-if="column.filterKey">
          <FilterDropdown
            v-model="filterConfig[column.filterKey]"
            :list="column.list"
            :name="column.label" />
        </template>
        <template #default="{ row }">
          <template v-if="column.prop === 'fType'">
            {{ dataTypeListMap[row.newFtype] }}
          </template>

          <div class="flex-center" v-else-if="column.operate">
            <Auth :value="authEnum.upd">
              <el-button @click="editRow(row)" type="primary" text class="p0">
                {{ $t('btn.edit') }}
              </el-button>
            </Auth>
            <Auth :value="authEnum.del">
              <el-button class="p0" @click="deleteRow(row)" type="primary" text>
                {{ $t('btn.delete') }}
              </el-button>
            </Auth>
          </div>
          <template v-else>
            {{ row[column.prop] }}
          </template>
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <Pagination
        v-model:limit="filterConfig.size"
        v-model:page="filterConfig.page"
        :total="state.pageTotal" />
    </template>
  </CommonLayout>

  <CustomAttr type="2" ref="customAttrRef" @getData="getData" />
  <EditCustomAttr type="2" ref="editCustomAttrRef" @getData="getData" />
</template>

<script setup>
import useState from './hooks/useState'
import { dataTypeListMap } from '@/enumeration/data-management/event-attr'

import CustomAttr from '../event-attr/components/CustomAttr.vue'
import EditCustomAttr from '../event-attr/components/EditCustomAttr.vue'
import { authEnum, operateAuth } from '../enum.js'
import { t } from '@/locales/i18n'

const columns = [
  {
    label: t('dataManagement.attributeName'),
    prop: 'fEn',
    // sortable: 'custom',
    // sortMethod: (a, b, key) => alphabetSort(a, b, key),
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'fZh',
  },
  {
    label: t('dataManagement.dataType'),
    prop: 'fType',
    /* list: dataTypeList,
    filterKey: 'fType',*/
  },
  {
    label: t('dataManagement.unit'),
    prop: 'fUnit',
  },
  {
    label: t('common.description'),
    prop: 'fDesc',
  },
  {
    label: t('common.createBy'),
    prop: 'createByName',
  },
  {
    label: t('common.updateBy'),
    prop: 'updateByName',
  },
  {
    label: t('common.updateTime'),
    prop: 'updateTime',
  },
  {
    notShowTip: true,
    label: t('common.operate'),
    operate: true,
    fixed: 'right',
  },
].filter((item) => {
  if (operateAuth && item.operate) {
    return false
  }
  return true
})

const {
  tableRef,
  customAttrRef,
  editCustomAttrRef,
  state,
  filterConfig,
  editRow,
  deleteRow,
  getData,
  selectionChange,
  tableSortChange,
} = useState()

defineExpose({
  state,
  addFn() {
    customAttrRef.value.open()
  },
  getData,
  deleteRow,
})

defineOptions({
  name: 'User',
})
</script>

<style scoped lang="scss"></style>
