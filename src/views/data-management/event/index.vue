<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterConfig.key"
        :desc="$t('dataManagement.searchEventPlaceholder')"
        class="w240"
        notTrimSpace
        @input="getEventList('search')" />
    </template>
    <template #hr>
      <div class="flex-center">
        <Auth :value="authEnum.reuseTo">
          <ReuseToButton
            @paste="showPaste"
            class="mr10"
            :list="state.tableSelectedData" />
        </Auth>

        <Auth :value="authEnum.add">
          <template #default>
            <DropDownItemSelection trigger="hover">
              <el-button type="primary">
                <SvgIcon name="add1" class="fz16 mr3" />
                {{ $t('btn.add') }}
              </el-button>
              <template #content>
                <template v-for="item of eventTypeList" :key="item.type">
                  <el-dropdown-item
                    v-if="!item.notDisplay"
                    @click="buttonMethods[item.mark]()">
                    {{ item.label }}
                  </el-dropdown-item>
                </template>

                <el-dropdown-item
                  v-if="state.otherParam.iapButton"
                  @click="() => buttonMethods['InsourcingAndAd'](1)">
                  {{ $t('dataManagement.event.internalPurchaseEvent') }}
                </el-dropdown-item>

                <el-dropdown-item
                  v-if="state.otherParam.adButton"
                  @click="() => buttonMethods['InsourcingAndAd'](2)">
                  {{ $t('dataManagement.event.advertisingEvent') }}
                </el-dropdown-item>
              </template>
            </DropDownItemSelection>
          </template>
        </Auth>
      </div>
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
        <!--   :sort-method="(a, b) => column.sortMethod(a, b, column.prop)"      -->
        <template #header v-if="column.header">
          <FilterDropdown
            v-model="filterConfig[column.filterKey]"
            :list="column.list"
            :name="column.label" />
        </template>
        <template #default="{ row }">
          <template v-if="column.prop === 'eventState'">
            <el-switch
              :active-value="0"
              :inactive-value="1"
              v-model="row.eventState"
              @change="switchChange(row)">
            </el-switch>
          </template>

          <template v-else-if="column.prop === 'eventName'">
            <div
              v-showTips
              :class="['c-pointer', 'mr5', setClass(row)]"
              @click="viewEventAttrFn(row)">
              {{ row.eventName }}
              <span class="cf56c6c">{{
                row.eventEnable === 2 ? $t('dataManagement.event.disabled') : ''
              }}</span>
            </div>
            <Tooltip v-if="getTip(row)">
              <template #content>
                {{ getTip(row) }}
                <!--                <span class="cf56c6c">{{
                  row.eventEnable === 2 ? '（已禁用）' : ''
                }}</span>-->
              </template>
              <SvgIcon name="warning1" class="cff9f24" />
            </Tooltip>
          </template>

          <template v-else-if="column.prop === 'eventType'">
            {{ eventTypeListMap[row[column.prop]] }}
          </template>

          <div class="flex-center" v-else-if="column.prop === 'fieldCount'">
            <Tooltip :showTips="eventType2Or3.includes(row.eventType)">
              <template #content>
                <span>
                  {{ eventTypeDesc[row.eventType] }}
                </span>
              </template>
              <el-button
                @click="viewConfigAttrFn(row)"
                class="p0 nd-operate-btn-active fz28"
                text
                :disabled="eventType2Or3.includes(row.eventType)">
                <SvgIcon
                  :class="[eventType2Or3.includes(row.eventType) || 'c5473e8 ']"
                  name="config1" />
              </el-button>
            </Tooltip>
            <span
              v-show="!eventType2Or3.includes(row.eventType)"
              :class="[row.fieldCount === 0 && 'cff9f24', 'ml5 ']">
              {{
                row.fieldCount === 0
                  ? $t('dataManagement.notConfigured')
                  : row.fieldCount
              }}
            </span>
          </div>

          <div class="flex-center" v-else-if="column.operate">
            <Auth :value="authEnum.upd">
              <Tooltip :showTips="row.eventType === 2">
                <template #content>
                  <span>
                    {{ $t('dataManagement.event.presetEventEdited') }}
                  </span>
                </template>
                <el-button
                  :disabled="row.eventType === 2"
                  @click="editRow(row)"
                  type="primary"
                  text
                  class="p0">
                  {{ $t('btn.edit') }}
                </el-button>
              </Tooltip>
            </Auth>
            <Auth :value="authEnum.del">
              <Tooltip :showTips="!!getTip(row, 'operate')">
                <template #content>
                  <span>
                    {{ getTip(row, 'operate') }}
                  </span>
                </template>
                <el-button
                  :disabled="!!getTip(row, 'operate')"
                  class="p0"
                  @click="deleteRow(row)"
                  type="primary"
                  text>
                  {{ $t('btn.delete') }}
                </el-button>
              </Tooltip>
            </Auth>
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
  <CustomEvent ref="customEventRef" @getData="fectchEventData" />
  <EditCustomEvent ref="editCustomEventRef" @getData="fectchEventData" />
  <VirtualEvent ref="virtualEventRef" @getData="fectchEventData" />
  <InsourcingAndAd ref="insourcingAndAdRef" @getData="fectchEventData" />
  <Paste @getData="getEventList" ref="pasteRef" />
  <ViewEventAttr @getData="getEventList" ref="viewEventAttrRef" />
  <ViewConfigAttr @getData="getEventList" ref="viewConfigAttrRef" />
</template>

<script setup>
import useState from './hooks/useState'
import {
  eventTypeList,
  eventTypeListMap,
} from '@/enumeration/data-management/event'
import {
  displayStateTypeList,
  configAttrTypeList,
} from '@/enumeration/data-management/common'
import ReuseToButton from '../components/ReuseToButton/index.vue'
import CustomEvent from './components/CustomEvent.vue'
import EditCustomEvent from './components/EditCustomEvent.vue'
import VirtualEvent from './components/VirtualEvent.vue'
import InsourcingAndAd from './components/InsourcingAndAd.vue'
import ViewEventAttr from './components/ViewEventAttr.vue'
import ViewConfigAttr from './components/ViewConfigAttr.vue'
import Paste from './components/Paste/index.vue'
import { thousandQuantileProcessing } from '@/utils/dataProcessing'
import { authEnum, operateAuth } from './enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

recordBehavior({
  moduleName: '数据管理',
  submoduleName: '事件管理',
  operate: '进入页面',
})

const columns = [
  {
    label: t('dataManagement.eventName'),
    prop: 'eventName',
    notshowTip: true,
    sortable: 'custom',
    // sortMethod: (a, b, key) => alphabetSort(a, b, key),
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
    label: t('dataManagement.eventType'),
    prop: 'eventType',
    list: eventTypeList,
    header: true,
    filterKey: 'eventType',
  },
  {
    label: t('dataManagement.event.yesterdayEventVolume'),
    prop: 'eventCount',
  },
  {
    label: t('dataManagement.displayStatus'),
    prop: 'eventState',
    list: displayStateTypeList,
    header: true,
    filterKey: 'eventState',
    notshowTip: true,
  },
  {
    label: t('dataManagement.configureProperties'),
    header: true,
    list: configAttrTypeList,
    filterKey: 'configAttribute',
    notshowTip: true,
    prop: 'fieldCount',
  },
  {
    label: t('common.createBy'),
    prop: 'creator',
  },
  {
    label: t('common.updateBy'),
    prop: 'updater',
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

  if (!authEnum.status && item.prop === 'eventState') {
    return false
  }

  if (!authEnum.configAttr && item.prop === 'fieldCount') {
    return false
  }

  return true
})

const eventType2Or3 = [2, 3]
const eventTypeDesc = {
  2: t('dataManagement.event.presetEventEdited'),
  3: t('dataManagement.event.virtualEventTips'),
}

const getTip = (row, type = 'eventName') => {
  let txt = ''
  switch (type) {
    case 'eventName':
      if (row.eventType === 1 && row.hasUnpublished) {
        txt = t('dataManagement.event.unpublishedAttr')
      }
      break
    case 'operate':
      if (row.eventType === 2 || (row.eventType === 1 && !!row.fieldCount)) {
        txt =
          row.eventType === 2
            ? t('dataManagement.event.presetEventDeleted')
            : t('dataManagement.event.configAttrDeleted')
      }
      break
  }

  return txt
}

const setClass = (row) => {
  if (eventType2Or3.includes(row.eventType)) {
    return 'c5473e8'
  }
  if (!row.hasUnpublished) {
    return 'c5473e8'
  }
  return 'cff9f24'
}

const {
  pasteRef,
  tableRef,
  customEventRef,
  virtualEventRef,
  viewEventAttrRef,
  viewConfigAttrRef,
  insourcingAndAdRef,
  editCustomEventRef,
  state,
  filterConfig,
  buttonMethods,
  editRow,
  showPaste,
  deleteRow,
  switchChange,
  getEventList,
  viewEventAttrFn,
  // handleTableData,
  selectionChange,
  tableSortChange,
  viewConfigAttrFn,
  fectchEventData,
} = useState()

defineOptions({
  name: 'Event',
})
</script>

<style scoped lang="scss"></style>
