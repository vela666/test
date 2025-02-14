<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterConfig.fuzzySearchKey"
        :desc="$t('user.userTag.searchTagDisplayNotes')"
        class="w300 mr10"
        notTrimSpace
        @input="getList('search')" />
      <el-checkbox v-model="filterConfig.viewOnlyMyCreate">
        {{ $t('user.onlyViewCreated') }}
      </el-checkbox>
    </template>
    <template #hr>
      <Auth :value="authEnum.add">
        <el-button type="primary" @click="showAddTag">
          <SvgIcon name="add1" class="fz16 mr3" />{{ $t('btn.add') }}
        </el-button>
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
            {{ tagTypeListMap[row[column.prop]] }}
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
  <FirstLastFeature ref="firstLastFeatureRef" @getData="getList" />
  <SqlTag ref="sqlTagRef" @getData="getList" />
  <ConditionTag ref="conditionTagpRef" @getData="getList" />
  <Indicator ref="indicatorRef" @getData="getList" />
  <CommonDialog
    width="556px"
    :showBtn="false"
    v-model="state.addTagVisible"
    :title="$t('user.userTag.addMethod')">
    <div class="flex flex-warp gap20">
      <div
        class="nd-add-tag-type"
        v-for="item of tagTypeList"
        @click="
          () => {
            buttonMethods[item.type]()
            state.addTagVisible = false
          }
        "
        :key="item.label">
        <span class="nd-add-tag-type-label fz16 txt-bold">
          {{ item.label }}
        </span>
        <span>
          {{ item.desc }}
        </span>
      </div>
    </div>
  </CommonDialog>
</template>

<script setup>
import useState from './hooks/useState'
import useEvent from './hooks/useEvent'
import {
  tagTypeList,
  dataUpdTypeList,
  dataUpdTypeListtMap,
  tagTypeListMap,
} from '@/enumeration/user/common'
import { thousandQuantileProcessing } from '@/utils/dataProcessing'
// import ReportNum from '@/views/user/components/ReportNum.vue'
import MoreChoices from './components/MoreChoices.vue'
import FirstLastFeature from './components/FirstLastFeature/index.vue'
import SqlTag from './components/SqlTag.vue'
import ConditionTag from './components/ConditionTag/index.vue'
import Indicator from './components/Indicator/index.vue'
import { authEnum, operateAuth } from './enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { Warning } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const columns = [
  {
    label: t('user.userTag.tagName'),
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
    label: t('user.userTag.tagType'),
    prop: 'createType',
    header: true,
    list: tagTypeList,
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

recordBehavior({
  moduleName: '用户',
  submoduleName: '用户标签',
  operate: '进入页面',
})

const {
  tableRef,
  state,
  filterConfig,
  goRoute,
  getList,
  tableSortChange,
  showAddTag,
} = useState()

const {
  sqlTagRef,
  conditionTagpRef,
  indicatorRef,
  firstLastFeatureRef,
  buttonMethods,
} = useEvent(getList)

defineOptions({
  name: 'UserTag',
})
</script>

<style scoped lang="scss">
.nd-add-tag-type {
  display: flex;
  flex-direction: column;
  padding: 16px;
  width: 236px;
  background-color: var(--eas-hover-color-1);
  border-radius: 4px;
  cursor: pointer;
  color: var(--eas-text-color-primary);
  &:hover {
    .nd-add-tag-type-label {
      color: var(--eas-color-primary);
    }
  }
}
</style>
