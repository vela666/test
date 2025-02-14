<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterConfig.fuzzySearchKey"
        :desc="$t('user.userGroup.searchGroupDisplayRemark')"
        class="w320 mr10"
        notTrimSpace
        @input="getList('search')" />
      <el-checkbox v-model="filterConfig.viewOnlyMyCreate">
        {{ $t('user.onlyViewCreated') }}
      </el-checkbox>
      <div v-show="state.defaultGroup.displayName" class="ml20 flex-center">
        {{ $t('user.userGroup.defaultUserGroup') }} "<el-button
          text
          type="primary"
          @click="searchDefault"
          >{{ state.defaultGroup.displayName }}</el-button
        >"
      </div>
    </template>
    <template #hr>
      <Auth :value="authEnum.add">
        <DropDownItemSelection trigger="hover">
          <el-button type="primary">
            <SvgIcon name="add1" class="fz16 mr3" />
            {{ $t('btn.add') }}
          </el-button>
          <template #content>
            <template
              v-for="item of groupTypeList.filter((item) => !item.notDisplay)"
              :key="item.type">
              <el-dropdown-item @click="buttonMethods[item.type]()">
                {{ item.label }}
              </el-dropdown-item>
            </template>
          </template>
        </DropDownItemSelection>
      </Auth>
    </template>
    <el-table
      v-loading="state.exhibitLoading"
      class="nd-table-custom"
      :data="state.pagedData"
      border
      ref="tableRef"
      row-key="fId"
      @sort-change="tableSortChange">
      <el-table-column
        v-for="(column, index) of columns"
        :prop="column.prop"
        :key="index"
        :label="column.label"
        :min-width="column.width"
        :show-overflow-tooltip="!column.notShowTip"
        :sortable="column.sortable"
        :fixed="column.fixed">
        <template #header v-if="column.header">
          <FilterDropdown
            v-model="filterConfig[column.filterKey]"
            :list="column.list"
            :name="column.label" />
        </template>
        <template #default="{ row }">
          <template v-if="column.prop === 'fEn'">
            <span v-showTips class="mr5">
              {{ row[column.prop] }}
            </span>
          </template>
          <template v-else-if="column.prop === 'createType'">
            {{ groupTypeListMap[row[column.prop]] }}
          </template>
          <div class="flex-center" v-else-if="column.prop === 'refreshType'">
            {{ dataUpdTypeListtMap[row[column.prop]] }}
            <span class="ml5" v-if="row[column.prop] === 1">
              ({{
                row.accumulation === 0
                  ? $t('user.cover')
                  : $t('user.increment')
              }})
            </span>
          </div>
          <span
            v-else-if="['name', 'displayName'].includes(column.prop)"
            @click="goRoute(row)"
            class="c-pointer c5473e8">
            {{ row[column.prop] }}
          </span>
          <span v-else-if="column.prop === 'usersNum'">
            <span class="flex-center">
              <span class="c-pointer c5473e8" @click="goRoute(row)">
                {{ thousandQuantileProcessing(row[column.prop]) }}
              </span>
              <Tooltip v-if="row.status === 2">
                <template #content>
                  {{ row.clusterTaskFailLimitDesc }}
                </template>
                <el-icon class="cf56c6c ml5"><Warning /></el-icon>
              </Tooltip>
            </span>
          </span>
          <!--          <div v-else-if="column.prop === 'reportNum'">
            <span v-if="!row[column.prop]">{{ row[column.prop] }}</span>
            <ReportNum :row="row" v-else>
              {{ row[column.prop] }}
            </ReportNum>
          </div>-->
          <MoreChoices
            @click="(type) => buttonMethods[type](row, row.createType)"
            v-else-if="column.operate"
            :row="row" />
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
  <IdGroup ref="idGroupRef" @getData="getList" />
  <SqlGroup ref="sqlGroupRef" @getData="getList" />
  <ConditionGroup ref="conditionGroupRef" @getData="getList" />
  <ResultClusterDialog showName ref="resultClusterRef" @getData="getList" />
</template>

<script setup>
import useState from './hooks/useState'
import useEvent from './hooks/useEvent'
import {
  groupTypeList,
  dataUpdTypeList,
  groupTypeListMap,
  dataUpdTypeListtMap,
} from '@/enumeration/user/common'
import { thousandQuantileProcessing } from '@/utils/dataProcessing'
// import ReportNum from '@/views/user/components/ReportNum.vue'
import MoreChoices from './components/MoreChoices.vue'
import IdGroup from './components/IdGroup.vue'
import SqlGroup from './components/SqlGroup.vue'
import ConditionGroup from './components/ConditionGroup.vue'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'
import { authEnum, operateAuth } from './enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { Warning } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const columns = [
  {
    label: t('user.userGroup.groupName'),
    prop: 'name',
    // sortMethod: (a, b, key) => alphabetSort(a, b, key),
  },
  {
    label: t('user.displayName'),
    prop: 'displayName',
  },
  {
    label: t('user.numberPeople'),
    prop: 'usersNum',
    sortable: 'custom',
  },
  {
    label: t('user.userGroup.groupType'),
    prop: 'createType',
    header: true,
    list: groupTypeList,
    filterKey: 'createType',
  },
  {
    label: t('user.updateMethod'),
    prop: 'refreshType',
    header: true,
    list: dataUpdTypeList,
    filterKey: 'refreshType',
  },
  /*  {
    label: '应用报表数',
    prop: 'reportNum',
    sortable: 'custom',
  },*/
  {
    label: t('common.remark'),
    prop: 'remark',
  },
  {
    label: t('common.createBy'),
    prop: 'creator',
  },
  {
    label: t('user.dataUpdateTime'),
    prop: 'refreshTime',
    sortable: 'custom',
  },
  {
    notShowTip: true,
    label: t('common.operate'),
    operate: true,
    width: 140,
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
  state,
  filterConfig,
  goRoute,
  getList,
  searchDefault,
  tableSortChange,
} = useState()

recordBehavior({
  moduleName: '用户',
  submoduleName: '用户分群',
  operate: '进入页面',
})

const {
  idGroupRef,
  sqlGroupRef,
  conditionGroupRef,
  resultClusterRef,
  buttonMethods,
} = useEvent(getList)

defineOptions({
  name: 'UserGroup',
})
</script>

<style scoped lang="scss"></style>
