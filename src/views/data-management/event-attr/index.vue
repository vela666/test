<template>
  <CommonLayout>
    <template #hl>
      <CommonInput
        v-model="filterConfig.key"
        :desc="$t('dataManagement.searchAttributeAndDisplay')"
        class="w240"
        notTrimSpace
        @input="getEventList('search')" />
      <el-checkbox class="mr2" v-model="filterConfig.bindEvent">
        {{ $t('dataManagement.eventAttr.filterPublicAttr') }}
      </el-checkbox>
      <el-checkbox v-model="filterConfig.relevance">
        {{ $t('dataManagement.eventAttr.filterAutoAssociated') }}
      </el-checkbox>
    </template>
    <template #hr>
      <div class="flex-center">
        <div class="c545e6e fz14 mr20">
          {{ $t('dataManagement.attrPublishedNum')
          }}{{ state.otherParam.attributeNum }}
        </div>
        <Auth :value="authEnum.release">
          <template #default>
            <el-button @click="publish()" class="mr10">
              <SvgIcon name="publish1" class="fz16 mr3" />
              {{ $t('btn.publish') }}
            </el-button>
          </template>
        </Auth>

        <Auth :value="authEnum.reuseTo">
          <ReuseToButton
            type="2"
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
                <template v-for="item of attrTypeList" :key="item.type">
                  <el-dropdown-item
                    v-if="!item.notDisplay"
                    @click="buttonMethods[item.mark]">
                    {{ item.label }}
                  </el-dropdown-item>
                </template>
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
      row-key="fId"
      @selection-change="selectionChange"
      @sort-change="tableSortChange">
      <el-table-column type="selection" width="55" />
      <el-table-column
        v-for="(column, index) of columns"
        :prop="column.prop"
        :key="index"
        :label="column.label"
        min-width="130"
        :show-overflow-tooltip="!column.notShowTip"
        :sortable="column.sortable"
        :fixed="column.fixed">
        <!--   :sort-method="(a, b) => column.sortMethod(a, b, column.prop)"      -->
        <template #header v-if="column.header && column.prop === 'eventTotal'">
          <FilterDropdown
            v-model="filterConfig[column.filterKey]"
            :list="column.list"
            :name="column.label" />
        </template>
        <template #header v-else-if="column.header">
          <FilterDropdown
            v-model="filterConfig[column.filterKey]"
            :list="column.list"
            :name="column.label" />
        </template>
        <template #default="{ row }">
          <template v-if="column.prop === 'fEn'">
            <span
              v-showTips
              class="c-pointer mr5 c5473e8"
              @click="viewEventFn(row)">
              {{ row[column.prop] }}
            </span>
          </template>
          <template v-else-if="column.prop === 'hidden'">
            <Tooltip :showTips="parentAttrClose(row).disabled">
              <template #content> {{ parentAttrClose(row).tips }}</template>
              <el-switch
                :active-value="0"
                :inactive-value="1"
                v-model="row.hidden"
                :disabled="parentAttrClose(row).disabled"
                @change="switchChange($event, row)" />
            </Tooltip>
          </template>

          <template v-else-if="column.prop === 'fType'">
            {{ dataTypeListMap[row.newFtype] }}
          </template>

          <template v-else-if="column.prop === 'type'">
            {{ attrTypeListMap[row[column.prop]] }}
          </template>

          <template v-else-if="column.prop === 'fSync'">
            <el-button
              @click="publish(row)"
              v-if="row.fSync === 0"
              type="primary">
              {{ $t('btn.publish') }}
            </el-button>
            <span v-else>{{ $t('dataManagement.published') }}</span>
          </template>

          <div class="flex-center" v-else-if="column.prop === 'eventTotal'">
            <Tooltip :showTips="[3].includes(row.type)">
              <template #content>
                <span> {{ eventTypeDesc[row.type] }} </span>
              </template>
              <el-button
                @click="viewConfigEventFn(row)"
                class="p0 nd-operate-btn-active fz28"
                text
                :disabled="type1Or3.includes(row.type)">
                <SvgIcon
                  :class="{ c5473e8: !type1Or3.includes(row.type) }"
                  name="config1" />
              </el-button>
            </Tooltip>
            <span
              v-if="!type1Or3.includes(row.type)"
              :class="[row.eventTotal === 0 && 'cff9f24', 'ml5 ']">
              {{
                row.eventTotal === 0
                  ? $t('dataManagement.notConfigured')
                  : row.eventTotal
              }}
            </span>
          </div>

          <template
            v-else-if="column.label === $t('dataManagement.dimensionTable')">
            <Tooltip
              v-if="
                [3, 4].includes(row.type) ||
                ['array', 'boolean', 'datetime', 'timestamp'].includes(
                  row.fType
                ) ||
                row.fSync === 0
              ">
              <template #content>
                <div
                  v-html="
                    $t('dataManagement.dimensinTableTolltip').replace(
                      /\n/g,
                      '<br />'
                    )
                  "></div>
                <!-- 为什么属性无法上传维度表？<br />
                  1.该属性为维度表属性<br />
                  2.仅支持数据类型为文本和数值<br />
                  3.该属性为虚拟属性，且生成规则中使<br />用了维度表属性<br />
                  4.该属性为虚拟属性，且生成规则<br />中使用了用户属性或者用户维度表属性<br />
                  5.该属性未发布<br /> -->
              </template>
              <SvgIcon class="c86919d ml5 fz16" name="help2" />
            </Tooltip>
            <div class="flex-center" v-else>
              <el-button
                @click="configDimension(row)"
                class="p0 nd-operate-btn-active fz28 mr5"
                text>
                <SvgIcon class="c5473e8" name="config1" />
              </el-button>
              <span>{{
                row.hasDimension === 0
                  ? $t('dataManagement.no')
                  : $t('dataManagement.yes')
              }}</span>
            </div>
          </template>

          <template
            v-else-if="
              column.label === $t('dataManagement.eventAttr.presetValue')
            ">
            <Tooltip
              v-if="
                !['int', 'double', 'string'].includes(row.fType) ||
                row.type === 3
              ">
              <template #content>
                <div
                  v-html="
                    $t('dataManagement.eventAttr.presetValueTooltip').replace(
                      /\n/g,
                      '<br />'
                    )
                  "></div>
                <!-- 为什么属性无法添加预设值？<br />
                  1.该属性为维度属性<br />
                  2.该属性的数据类型不是数值或文本<br /> -->
              </template>
              <SvgIcon class="c86919d ml5 fz16" name="help2" />
            </Tooltip>

            <template v-else>
              <el-button
                @click="configPresetValue(row)"
                class="p0 nd-operate-btn-active fz28 mr5"
                text>
                <SvgIcon class="c5473e8" name="config1" />
              </el-button>
              <span>{{
                row.presetValue
                  ? $t('dataManagement.yes')
                  : $t('dataManagement.no')
              }}</span>
            </template>
          </template>

          <div class="flex-center" v-else-if="column.operate">
            <Tooltip
              v-if="authEnum.upd && row.type !== 3"
              :showTips="row.type === 1">
              <template #content>
                <span>
                  {{ $t('dataManagement.presetAttrEdited') }}
                </span>
              </template>
              <el-button
                :disabled="row.type === 1"
                @click="editRow(row)"
                type="primary"
                text
                class="p0">
                {{ $t('btn.edit') }}
              </el-button>
            </Tooltip>
            <Tooltip
              v-if="authEnum.del && row.type !== 3"
              :showTips="!!getTip(row, 'operate')">
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

  <CustomAttr ref="customAttrRef" @getData="getEventList" />
  <EditCustomAttr ref="editCustomAttrRef" @getData="getEventList" />
  <VirtualAttr ref="virtualAttrRef" @getData="getEventList" />
  <Paste @getData="getEventList" ref="pasteRef" />
  <ViewEvent @getData="getEventList" ref="ViewEventRef" />
  <ViewConfigEvent @getData="getEventList" ref="viewConfigEventRef" />
  <PublishAttr @getData="getEventList" ref="publishAttrRef" />
  <ConfigDimension @getData="getEventList" ref="configDimensionRef" />
  <PresetValue @getData="getEventList" ref="presetValueRef" />
</template>

<script setup>
import useState from './hooks/useState'
import {
  displayStateTypeList,
  releaseStatusList,
  configAttrTypeList,
  withOrWithoutTypeList,
} from '@/enumeration/data-management/common'
import {
  attrTypeList,
  attrTypeListMap,
  dataTypeList,
  dataTypeListMap,
} from '@/enumeration/data-management/event-attr'

import ReuseToButton from '../components/ReuseToButton/index.vue'
import CustomAttr from './components/CustomAttr.vue'
import EditCustomAttr from './components/EditCustomAttr.vue'
import VirtualAttr from './components/VirtualAttr.vue'
import ViewEvent from './components/ViewEvent.vue'
import ViewConfigEvent from './components/ViewConfigEvent.vue'
import PublishAttr from './components/PublishAttr.vue'
import Paste from './components/Paste/index.vue'
import ConfigDimension from './components/ConfigDimension.vue'
import PresetValue from './components/PresetValue.vue'
import { authEnum, operateAuth } from './enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const columns = [
  {
    label: t('dataManagement.attributeName'),
    prop: 'fEn',
    notShowTip: true,
    sortable: 'custom',
    // sortMethod: (a, b, key) => alphabetSort(a, b, key),
  },
  {
    label: t('dataManagement.displayName'),
    prop: 'fZh',
  },
  {
    label: t('dataManagement.dataType'),
    prop: 'fType',
    list: dataTypeList,
    header: true,
    filterKey: 'fType',
  },
  {
    label: t('dataManagement.unit'),
    prop: 'fUnit',
  },
  {
    label: t('dataManagement.attributeType'),
    prop: 'type',
    list: attrTypeList,
    header: true,
    filterKey: 'type',
    // notShowTip: true,
  },
  {
    label: t('common.description'),
    prop: 'fDesc',
  },
  {
    label: t('dataManagement.displayStatus'),
    prop: 'hidden',
    list: displayStateTypeList,
    header: true,
    filterKey: 'hidden',
    notShowTip: true,
  },
  {
    label: t('dataManagement.publishStatus'),
    prop: 'fSync',
    list: releaseStatusList,
    header: true,
    filterKey: 'fSync',
    notShowTip: true,
  },
  {
    label: t('dataManagement.eventAttr.configureEvents'),
    header: true,
    list: configAttrTypeList,
    filterKey: 'hasConfigEvent',
    notShowTip: true,
    prop: 'eventTotal',
  },
  {
    label: t('dataManagement.dimensionTable'),
    header: true,
    list: withOrWithoutTypeList,
    filterKey: 'hasDimension',
    notShowTip: true,
  },
  {
    label: t('dataManagement.eventAttr.presetValue'),
    header: true,
    list: withOrWithoutTypeList,
    notShowTip: true,
    filterKey: 'hasPresetValue',
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
    notShowTip: true,
    label: t('common.operate'),
    operate: true,
    fixed: 'right',
  },
].filter((item) => {
  if (operateAuth && item.operate) {
    return false
  }

  if (!authEnum.release && item.prop === 'fSync') {
    return false
  }

  if (
    !authEnum.configDimension &&
    item.label === t('dataManagement.dimensionTable')
  ) {
    return false
  }

  if (
    !authEnum.configPreset &&
    item.label === t('dataManagement.eventAttr.presetValue')
  ) {
    return false
  }

  if (!authEnum.status && item.prop === 'hidden') {
    return false
  }

  if (!authEnum.configEvent && item.prop === 'eventTotal') {
    return false
  }

  return true
})

// 预置和维度
const type1Or3 = [1, 3]
const eventTypeDesc = {
  1: t('dataManagement.presetAttrEdited'),
  3: t('dataManagement.eventAttr.dimenAttrTips'),
}

recordBehavior({
  moduleName: '数据管理',
  submoduleName: '事件属性',
  operate: '进入页面',
})
const {
  pasteRef,
  tableRef,
  ViewEventRef,
  customAttrRef,
  publishAttrRef,
  presetValueRef,
  virtualAttrRef,
  editCustomAttrRef,
  configDimensionRef,
  viewConfigEventRef,
  state,
  filterConfig,
  buttonMethods,
  editRow,
  publish,
  showPaste,
  deleteRow,
  viewEventFn,
  switchChange,
  getEventList,
  configDimension,
  selectionChange,
  // handleTableData,
  tableSortChange,
  configPresetValue,
  viewConfigEventFn,
} = useState()

const getTip = (row, type) => {
  let txt = ''
  switch (type) {
    case 'operate':
      if (row.fSync !== 0 && row.type !== 4) {
        txt = t('dataManagement.publishedAttributesDeleted')
      }
      break
  }
  return txt
}

// 映射维度属性父级关闭后 子属性的hover提示
const parentAttrClose = (row) => {
  // 遍历整个table数据
  let tips = ''
  let disabled = false
  // 如果有父id
  if (row.parentId) {
    const val = state.pagedData.find((item) => item.fId === row.parentId)
    if (val.hidden === 1) {
      tips = t('dataManagement.parentAttrTips')
      disabled = true
    }
  }
  return {
    tips,
    disabled,
  }
}

defineOptions({
  name: 'EventAttr',
})
</script>

<style scoped lang="scss"></style>
