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
      row-key="eventId"
      @selection-change="selectionChange"
      @sort-change="tableSortChange">
      <el-table-column type="selection" width="55" />
      <el-table-column
        v-for="(column, index) of columns"
        :prop="column.prop"
        :key="index"
        :label="column.label"
        :show-overflow-tooltip="!column.notshowTip"
        :sortable="column.sortable"
        :fixed="column.fixed">
        <template #header v-if="column.filterKey">
          <FilterDropdown
            v-model="filterConfig[column.filterKey]"
            :list="column.list"
            :name="column.label" />
        </template>
        <template #default="{ row }">
          <div
            class="c-pointer mr5 c5473e8"
            v-if="column.prop === 'eventName'"
            @click="viewEventAttrFn(row)">
            {{ row.eventName }}
          </div>

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
          <div class="flex-center" v-else-if="column.prop === 'configCount'">
            <el-button
              @click="viewConfigAttrFn(row)"
              class="p0 nd-operate-btn-active fz28"
              text>
              <SvgIcon class="c5473e8" name="config1" />
            </el-button>
            <span :class="[row.configCount === 0 && 'cff9f24', 'ml5 ']">
              {{ row.configCount === 0 ? '未配置' : row.configCount }}
            </span>
          </div>
          <template v-else>
            {{
              thousandQuantileProcessing(
                row[column.prop],
                column.prop === 'eventCount'
              )
            }}
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
  <CustomEvent ref="customEventRef" @getData="getData" />
  <EditCustomEvent ref="editCustomEventRef" @getData="getData" />
  <ViewEventAttr @getData="getData" ref="viewEventAttrRef" />
  <ViewConfigAttr @getData="getData" ref="viewConfigAttrRef" />
</template>

<script setup>
import useState from './hooks/useState'
import CustomEvent from './components/CustomEvent.vue'
import EditCustomEvent from './components/EditCustomEvent.vue'
import ViewEventAttr from './components/ViewEventAttr.vue'
import ViewConfigAttr from './components/ViewConfigAttr.vue'
import { thousandQuantileProcessing } from '@/utils/dataProcessing'
import { authEnum, operateAuth } from '../enum.js'
import { configAttrTypeList } from '@/enumeration/data-management/common.js'
import { t } from '@/locales/i18n'

const columns = [
  {
    label: t('dataManagement.eventName'),
    prop: 'eventName',
    // sortable: 'custom',
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'eventNameZh',
  },
  {
    label: t('dataManagement.eventDescription'),
    prop: 'eventDesc',
  },
  {
    label: t('dataManagement.configureProperties'),
    list: configAttrTypeList,
    // filterKey: 'configAttribute',
    notshowTip: true,
    prop: 'configCount',
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
    notshowTip: true,
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
  customEventRef,
  viewEventAttrRef,
  viewConfigAttrRef,
  editCustomEventRef,
  state,
  filterConfig,
  editRow,
  deleteRow,
  getData,
  viewEventAttrFn,
  tableSortChange,
  viewConfigAttrFn,
  selectionChange,
} = useState()

defineExpose({
  state,
  addFn() {
    customEventRef.value.open()
  },
  getData,
  deleteRow,
})

defineOptions({
  name: 'Event',
})
</script>

<style scoped lang="scss"></style>
