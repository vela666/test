<template>
  <CommonDrawer
    :loading="state.loading"
    :title="$t('system.apps.subscriptionConfig')"
    size="750"
    @close="close"
    @submit="submit"
    v-model="state.show">
    <OperateTip class="mb20">
      {{ $t('system.apps.subscriptionConfigMsg') }}
      <a
        target="_blank"
        href="https://yifants.feishu.cn/wiki/ABYbwxlnWi12A3kAhTVc9OusnWe"
        class="c5473e8">
        {{ $t('system.apps.viewIntegrationDoc') }}
      </a>
    </OperateTip>
    <div class="nd-app-associated">
      <div class="w100-percentage nd-app-associated-t">
        <div class="flex-column w100-percentage">
          <!-- 事件 -->
          <div>
            <div class="flex-column gap10 w100-percentage">
              <div
                class="nd-app-associated-list"
                v-for="(item, index) of state.qp"
                :key="index">
                <div class="nd-app-associated-item flex-column gap10">
                  <div class="flex-center nd-serial-number-container">
                    <div class="nd-event-serial-number mr10">
                      {{ index + 1 }}
                    </div>
                    {{ $t('system.apps.associatePackageName') }}
                    <div
                      class="nd-filter-operation ml8"
                      v-if="state.qp.length > 1">
                      <Tooltip>
                        <el-button
                          class="nd-operate-btn-active fz28 m0"
                          text
                          @click="handleDelRow(index)">
                          <SvgIcon class="c86919d" name="delete" />
                        </el-button>
                        <template #content>{{ $t('btn.delete') }}</template>
                      </Tooltip>
                    </div>
                  </div>
                  <div class="nd-app-associated-content gap10">
                    <PropsFilter
                      class="is-compound"
                      :limit="['userField']"
                      lineNum="2"
                      :appId="state.appId"
                      :operation="false"
                      :showTemplate="false"
                      :data="state.associatedFieldData"
                      v-model="item.associatedApp" />

                    <div class="flex-column gap10">
                      <span>{{ $t('system.apps.attributeMapping') }}</span>
                      <el-select
                        popper-class="nd-event-list-select"
                        :style="`width:${
                          getActualWidthOfChars(item.event.eventNameZh) + 60
                        }px`"
                        filterable
                        @visible-change="() => (state.hoverEvent = {})"
                        value-key="eventId"
                        v-model="item.event"
                        @change="(val) => indexSelectChange(item, val)"
                        :placeholder="$t('common.pleaseSelect')">
                        <el-option
                          @mouseenter="showDesc($event, e, index)"
                          v-for="(e, index) of state.eventList"
                          :key="e.eventId"
                          :label="e.eventNameZh"
                          :value="e">
                          <div class="flex-center">
                            <span>{{ e.eventNameZh }}</span>
                            <span class="c86919d"
                              >（{{ eventTypeListMap[e.eventType] }}）</span
                            >
                          </div>
                        </el-option>
                        <div
                          ref="eventDetailsRef"
                          v-show="!isEmpty(state.hoverEvent)"
                          class="nd-event-details">
                          <div class="popver-info-item">
                            <div class="popver-info-item__left">
                              {{ state.hoverEvent.eventNameZh }}
                            </div>
                          </div>
                          <div class="attribute-en-name">
                            {{ state.hoverEvent.eventName }}
                          </div>
                          <div class="attribute-other">
                            <div class="attribute-category">
                              {{ eventTypeListMap[state.hoverEvent.eventType] }}
                            </div>
                          </div>
                          <div class="attribute-remark">
                            {{ $t('common.remark') }}：{{
                              state.hoverEvent.eventDesc || '--'
                            }}
                          </div>
                        </div>
                      </el-select>

                      <div class="flex-column gap10 nd-attr-mapping">
                        <div
                          class="flex-center flex-warp gap10"
                          v-for="(property, index) of item.propertyMappingList"
                          :key="index">
                          <PropSelect
                            @clear="
                              propSelectClear(
                                item.propertyMappingList[index],
                                property.matchPropertyName
                              )
                            "
                            reserveValue
                            clearable
                            :desc="$t('system.apps.selectProperties')"
                            className="m0"
                            :list="item.filedData"
                            v-model="item.propertyMappingList[index]"
                            :limit="attrLimit" />
                          <span class="c86919d">
                            {{ $t('system.apps.associateTo') }}
                          </span>
                          <span>{{
                            mapFields[property.matchPropertyName]
                          }}</span>
                        </div>
                      </div>
                    </div>
                    <div>{{ $t('common.filterConditions') }}</div>
                    <AnalysisGlobalFilter
                      v-if="item.condition.filters.length"
                      :isAnalyze="false"
                      title=""
                      :limit="attrLimit"
                      :appId="state.appId"
                      v-model="item.condition"
                      :data="item.filedData"
                      @add="
                        (filterIndex, filterSubIndex) =>
                          addSubEventFilter(item, filterIndex)
                      "
                      @remove="
                        (filterIndex, filterSubIndex) =>
                          handleDelRow(index, filterIndex, filterSubIndex)
                      " />
                    <span
                      v-show="!item.condition.filters.length"
                      @click="addSubEventFilter(item)"
                      class="inline-flex-center c-pointer c5473e8">
                      <el-button class="fz28" text type="primary">
                        <SvgIcon name="funnel" />
                      </el-button>
                      {{ $t('common.addConditions') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer-l>
      <div class="flex-center">
        <el-button @click="addMapping(false)" type="primary" text>
          <SvgIcon name="add1" class="mr3 fz16" />
          {{ $t('system.apps.addAssociations') }}
        </el-button>
        <el-button @click="viewResult" class="ml20" type="primary" text>
          {{ $t('system.apps.viewResults')
          }}<span class="c86919d">({{ $t('common.onlyNumData', [10]) }})</span>
        </el-button>
      </div>
    </template>
  </CommonDrawer>
  <CommonDialog
    :loading="state.tableLoading"
    v-model="state.dialogShow"
    :closeOnClickModal="!state.tableLoading"
    :title="`${$t('system.apps.exampleResults')}(${$t('common.onlyNumData', [10])})`"
    :showBtn="false"
    width="700px">
    <vxe-table
      border
      ref="vxeTableRef"
      class="nd-vxe-table-custom nd-vxe-column-center"
      max-height="660px"
      auto-resize
      show-overflow
      show-header-overflow
      :row-config="{ isHover: true }"
      :column-config="{ resizable: true }"
      :data="state.exampleResults"
      :scroll-x="{ enabled: true, gt: 10 }"
      :scroll-y="{ enabled: true, gt: 100 }">
      <vxe-column
        :title="item.title"
        v-for="item of columns"
        :field="item.prop"
        :key="item.prop">
        <template #default="{ row }">
          {{ row[item.prop] || '--' }}
        </template>
      </vxe-column>
    </vxe-table>
  </CommonDialog>
</template>

<script setup>
import { ref, reactive, nextTick, markRaw, computed } from 'vue'
import { cloneDeep, isEmpty } from 'lodash-es'
import useOperate from '@/components/PropsFilter/useOperate'
import { isBoolean } from '@/utils/types'
import { ElMessage } from 'element-plus'
import { getFieldList } from '@/api/modules/analysis/common'
import {
  filterArraySpecifiedKey,
  getTableType,
} from '@/utils/dataProcessing.js'

import {
  asyncGetSubscribeData,
  asyncGetSubscribeSetting,
  asyncSaveSubscribeSetting,
} from '@/api/modules/app'
import { asyncGetEventList } from '@/api/modules/data-management/event'
import { getActualWidthOfChars } from '@/utils/index.js'
import { eventTypeListMap } from '@/enumeration/data-management/event.js'
import { createPopper } from '@popperjs/core'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const mapFields = {
  eas_original_orderid: t('system.apps.originalOrderId'),
  // eas_sku: '商品id',
  adjust_id: 'adjust_id',
  appsflyer_id: 'appsflyer_id',
}
const initVal = () => {
  return {
    tableLoading: false,
    loading: false,
    show: false,
    dialogShow: false,
    qp: [],
    hoverEvent: {},
    appId: '',
    eventList: [],
    associatedFieldData: {},
    condition: {
      // filterType 的意义 0是没嵌套 1是嵌套
      /*    {
  relation: 1,
  filters: [
    {
      filterType: 1,
      relation: 0,
      filters: [],
    },
    {
      filterType: 0,
      ...
    },
  ],
  }*/
      relation: 0,
      filters: [],
    },
    propertyMappingList: Object.keys(mapFields).reduce((p, c) => {
      p.push({
        matchPropertyName: c,
        /*fId: 670,
        fEn: 'ABTest',
        tableType: 0,*/
      })
      return p
    }, []),
    exampleResults: [],
  }
}
const {
  parseFilterData,
  omitFiltersHandler,
  parseFiltersFromRes,
  handleDelConditionData,
  handleAddConditionData,
} = useOperate()
const state = reactive(initVal())
const attrLimit = ['eventField', 'userField']
const columns = [
  {
    prop: 'fid',
    title: 'fid',
  },
  {
    prop: 'bid',
    title: 'bid',
  },
  {
    prop: 'easOriginalOrderid',
    title: t('system.apps.originalOrderId'),
  },
  {
    prop: 'adjustId',
    title: 'adjust_id',
  },
  {
    prop: 'appsflyerId',
    title: 'appsflyer_id',
  },
]
const firstEvnet = computed(() => {
  return state.eventList[0]
})
const eventDetailsRef = ref(null)
const showDesc = (e, item, i) => {
  state.hoverEvent = item
  createPopper(e.target, eventDetailsRef.value[0], {
    placement: 'right',
    modifiers: [
      {
        name: 'flip',
        options: {
          fallbackPlacements: ['top', 'right'],
        },
      },
      {
        name: 'offset',
        options: {
          offset: [0, 10],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          padding: 8,
        },
      },
    ],
  })
}

const close = () => {
  Object.assign(state, initVal())
}

const propSelectClear = (item, matchPropertyName) => {
  item.matchPropertyName = matchPropertyName
}

const asyncGetAssociatedField = async () => {
  const { data } = await getFieldList({
    appId: state.appId,
  })
  state.associatedFieldData = {
    ...data,
    config: Object.keys(data.config).reduce((p, k) => {
      if (k === 'string') {
        p[k] = filterArraySpecifiedKey(data.config.string, ['C07'])
      } else {
        p[k] = data.config[k]
      }
      return p
    }, {}),
    userField: data.userField.filter((item) => item.fEn === '__pkg_name'),
  }
}

const asyncGetFieldList = async (eventId, key = 'eventIds') => {
  const { data } = await getFieldList({
    [key]: eventId ?? firstEvnet.value.eventId,
    appId: state.appId,
  })

  //保留预置/自定义属性
  return Object.entries(data).reduce((result, [key, items]) => {
    result[key] = attrLimit.includes(key)
      ? items.filter((item) => [1, 2].includes(+item.filedType))
      : items
    return result
  }, {})
}

const addMapping = async (init = true) => {
  state.loading = true
  const filedData = await asyncGetFieldList().finally((_) => {
    state.loading = false
  })
  const data = [
    {
      associatedApp: handleAddConditionData({
        condition: initVal().condition,
        noLimit: ['userField'],
        conditionList: state.associatedFieldData,
      }),
      condition: initVal().condition,
      event: firstEvnet.value,
      propertyMappingList: initVal().propertyMappingList,
      filedData,
    },
  ]
  if (init) {
    state.qp = cloneDeep(data)
  } else {
    state.qp.push(cloneDeep(...data))
    nextTick(() => {
      document.querySelector('.n-drawer-tab-c-t').scrollTop = 99999999
    })
  }
}

const getSubscribeSetting = async (exec = true) => {
  state.loading = true
  try {
    const {
      data: {
        pageInfo: { list },
      },
    } = await asyncGetEventList({
      appId: state.appId,
      size: -1,
    })
    //只保留自定义和预置事件
    state.eventList = list.filter((item) => +item.eventType !== 3)
    const { data } = await asyncGetSubscribeSetting({
      appId: state.appId,
    })
    await asyncGetAssociatedField()
    if (data.qp.length) {
      await mapData(data.qp.map((item) => JSON.parse(item)))
    } else {
      await addMapping(true)
    }
  } catch (e) {
    console.log(e)
  }
  state.loading = false
}

// 添加事件子项筛选 addScreen
const addSubEventFilter = async (item, filterIndex) => {
  item.condition = handleAddConditionData({
    condition: item.condition,
    conditionList: item.filedData,
    index: filterIndex,
    noLimit: attrLimit,
  })
}

// 删除行 handleDelete
const handleDelRow = (i, index, subIndex) => {
  if (!Number.isInteger(index)) {
    state.qp.splice(i, 1)
  } else {
    state.qp[i].condition = handleDelConditionData({
      condition: state.qp[i].condition,
      index,
      subIndex,
    })
  }
}

// 处理分群规则数据
const mapData = async (newValue) => {
  // 事件
  const temp = []
  for (let i = 0; i < newValue.length; i++) {
    const item = newValue[i]
    const newItem = {
      propertyMappingList: item.propertyMappingList.map((item) => {
        return {
          matchPropertyName: item.matchPropertyName,
          fEn: item.propertyName,
          fType: item.propertyType,
          fZh: item.propertyNameDisplay,
          tableType: item.tableType,
        }
      }),
      associatedApp: initVal().condition,
      event: filterArraySpecifiedKey(item.event, ['filts', 'relation'], true),
      condition: initVal().condition,
    }
    newItem.filedData = await asyncGetFieldList(item.event.eventId)

    if (item.associatedApp.filts?.length) {
      newItem.associatedApp = parseFiltersFromRes(item.associatedApp)
    }

    if (item.event.filts?.length) {
      newItem.condition = parseFiltersFromRes(item.event)
    }
    temp.push(newItem)
  }
  state.qp = temp
}

const getResult = () => {
  return new Promise((resolve, reject) => {
    const result = []
    let checkMessage = ''
    // 事件
    for (let i = 0; i < state.qp.length; i++) {
      const item = state.qp[i]
      const data = {
        appId: state.appId,
        calculationSymbol: '',
        event: {
          ...item.event,
          eventNameDisplay: item.event.eventNameZh,
          // condition: initVal().condition,
        },
        fieldName: '',
        packageName: '',
        propertyMappingList: item.propertyMappingList.map((item) => {
          const obj = {
            matchPropertyName: item.matchPropertyName,
          }
          if (item.fEn) {
            Object.assign(obj, {
              propertyName: item.fEn,
              propertyType: item.fType,
              propertyNameDisplay: item.fZh,
              tableType: item.tableType,
            })
          }
          return obj
        }),
        tableType: 0,
        associatedApp: {},
      }

      if (item.associatedApp.filters.length) {
        const app = parseFilterData(item.associatedApp)
        if (isBoolean(app)) {
          checkMessage = t('system.apps.associatedErr')
          break
        } else {
          const temp = app.filts[0]
          data.calculationSymbol = temp.calcuSymbol
          data.fieldName = temp.propertyName
          // data.fieldName = temp.propertyNameDisplay
          data.packageName = temp.ftv[0]
          data.tableType = temp.tableType
          data.associatedApp = app
        }
      }

      if (item.condition.filters.length) {
        const event = parseFilterData(item.condition)
        if (isBoolean(event)) {
          checkMessage = t('common.filterConditionErr')
          break
        } else {
          Object.assign(data.event, event)
        }
      }

      result.push(data)
    }

    if (checkMessage) {
      reject(checkMessage)
      return
    }
    resolve(result)
  })
}

// 处理筛选列表中在数据源中不存在的筛选属性
const omitFilters = (data) => {
  let temp = data.condition.filters
  data.condition.filters = omitFiltersHandler(data.filedData, temp)
}

// 选择事件
const isMatch = (key, fieldList, data) => {
  return fieldList.some(
    (s) => s.fEn === data.fEn && getTableType(key, s) === data.tableType
  )
}
const indexSelectChange = async (item, changeVal) => {
  item.filedData = await asyncGetFieldList(changeVal.eventId)
  omitFilters(item)
  item.propertyMappingList = item.propertyMappingList.map((v) => {
    const { filedData } = item
    if (
      isMatch('eventField', filedData.eventField, v) ||
      isMatch('userField', filedData.userField, v)
    ) {
      return v
    }

    return {
      matchPropertyName: v.matchPropertyName,
    }
  })
}

const submit = async () => {
  try {
    const val = await getResult()
    state.loading = true
    const { code } = await asyncSaveSubscribeSetting({
      qp: val.map((item) => {
        return JSON.stringify(item)
      }),
    })
      .finally((_) => {
        state.loading = false
      })
      .catch((e) => e)
    if (code === 200) {
      ElMessage.success(t('common.operationSuccessfully'))
      close()
    }
  } catch (err) {
    ElMessage.warning(err)
  }
}

const viewResult = async () => {
  try {
    const val = await getResult()
    state.dialogShow = true
    state.tableLoading = true
    const { code, data } = await asyncGetSubscribeData({
      qp: val.map((item) => {
        return JSON.stringify(item)
      }),
    })
      .finally((_) => {
        state.tableLoading = false
      })
      .catch((e) => e)
    if (code === 200) {
      state.exampleResults = markRaw(data)
    }
  } catch (err) {
    ElMessage.warning(err)
  }
}

const open = async (appId) => {
  state.appId = appId
  state.show = true
  getSubscribeSetting()
}

defineExpose({
  open,
})
defineOptions({
  name: 'SubscribeConfig',
})
</script>

<style lang="scss">
// 事件和属性管理 数据类型下拉框对应自定义样式---
.nd-event-list-select {
  .el-scrollbar {
    position: static !important;
  }
}
</style>

<style lang="scss" scoped>
.nd-event-details {
  //display: none;
  display: flex;
  flex-direction: column;
  position: absolute;
  padding: 10px;
  width: 169px;
  //height: 112px;
  background: #ffffff;
  box-shadow: 0 3px 6px rgba(28, 39, 80, 0.16);
}

.nd-event-serial-number {
  width: 24px;
  height: 24px;
  border-radius: 2px;
  background-color: var(--eas-color-primary);
  font-size: 12px;
  color: #fff;
  text-align: center;
  line-height: 24px;
}

.nd-serial-number-container {
  .nd-filter-operation {
    visibility: hidden;
  }
  &:hover {
    .nd-filter-operation {
      visibility: visible;
    }
  }
}

.nd-app-associated-content {
  display: flex;
  flex-direction: column;
  padding-left: 34px;
}

.nd-attr-mapping {
  margin-left: 10px;
  padding-left: 10px;
  border-left: 1px solid var(--eas-border-color-2);
}
</style>
