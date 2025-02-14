<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTipModal } from '@/components/TipDialog'

import TableField from './TableField.vue'
import {
  getTableList,
  getTableParse,
  getDimensionParse,
  getEventPropertyList,
  getEventEventPropertyList,
  getUserPropertyList,
  getClusterList,
  getClusterPropertyList,
  getDimensionPropertyList,
  getCustomPropertyList,
  getEventParse,
  getClusterParse,
} from '@/api/modules/analysis/sql'
import { t } from '@/locales/i18n'

import copyText from '@/utils/clipboard'
defineOptions({
  name: 'TableStructure',
})

const props = defineProps({
  isSql: {
    type: Boolean,
    default: false,
  },
})

const config = {
  propsTitle: [],
  tableTypes: Object.freeze({
    user_: t('analysis.sqlquery.userTable'),
    event_: t('analysis.sqlquery.eventTable'),
    dim: t('analysis.sqlquery.dimensionTable'),
    cluster_: t('analysis.sqlquery.userLabelTable'),
    'custom.tp_': t('analysis.sqlquery.customTable'),
    other: t('analysis.sqlquery.otherDataTable'),
  }),
  curTableType: 'user_',
  tableList: [],
  sortTableList: [],
  eventList: [],
  fieldList: [],
  checkEvent: {},
  isSelect: false,
  isEvent: false,
  iscluster: false,
  active_row_name: '',
  loading: false,
}

const state = reactive(config)

const emit = defineEmits(['parseTable'])

onMounted(() => {
  getTables()
})

/**
 *  @description 获取所有表数据
 */
const getTables = (status) => {
  state.curTableType = 'user_'
  state.isSelect = false
  state.isEvent = false
  state.iscluster = false
  state.active_row_name = ''
  state.loading = true
  getTableList({ status: status })
    .then((res) => {
      if (res && res.code === 200) {
        state.tableList = res.data
        // 根据表类型提取数据
        const data = Array.from({ length: 6 }, () => new Array())
        state.tableList.forEach((item) => {
          if (/^user_/.test(item.name)) {
            data[0].push(item)
          } else if (
            /^fg_event_/.test(item.name) ||
            /^event_/.test(item.name)
          ) {
            data[1].push(item)
          } else if (/^dim1_|^dim2_/.test(item.name)) {
            data[2].push(item)
          } else if (/^cluster_/.test(item.name)) {
            data[3].push(item)
          } else if (/^custom.tp_/.test(item.name)) {
            data[4].push(item)
          } else {
            data[5].push(item)
          }
        })
        state.sortTableList = data
      }
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 *  @description 根据表名正则匹配名称
 */
const tableTypeTips = (item) => {
  let tips = t('analysis.sqlquery.dataTable')
  const name = item.name
  switch (true) {
    case /^cluster_/.test(name):
      tips = t('analysis.sqlquery.userLabelTable')
      break
    case /^fg_event_/.test(name):
      tips = t('analysis.sqlquery.appearanceEventData')
      break
    case /^user_/.test(name):
      tips = t('analysis.sqlquery.userDataTable')
      break
    case /^event_/.test(name):
      tips = t('analysis.sqlquery.eventDataTable')
      break
    case /^test_view_/.test(name):
      tips = t('analysis.sqlquery.testDataVisualization')
      break
    case /^custom.tp_/.test(name):
      tips = t('analysis.sqlquery.customTable')
      break
    case /^dim1_|^dim2_/.test(name):
      tips = item.fieldAttribute
      break
  }
  return tips
}

/**
 * @description 获取表事件及字段
 */
const handleTableEvent = (name) => {
  state.active_row_name = name
  state.checkEvent = {}
  state.isSelect = true
  if (/^event_/.test(name) || /^fg_event_/.test(name)) {
    getEventList(name)
    state.isEvent = true
    state.iscluster = false
  }
  if (/^user_/.test(name)) {
    getUserPropList()
    state.isEvent = false
    state.iscluster = false
  }
  if (/^cluster_/.test(name)) {
    getClusterAndPropList()
    state.iscluster = true
    state.isEvent = false
  }
  if (/^dim1_/.test(name) || /^dim2_/.test(name) || /^dim_/.test(name)) {
    getDimList(name)
    state.iscluster = false
    state.isEvent = false
  }
  if (/^test_view/.test(name)) {
    getTestViewList()
    state.iscluster = false
    state.isEvent = false
  }
  if (/^custom.tp_/.test(name)) {
    getCustomList(name)
    state.iscluster = false
    state.isEvent = false
  }
}

/**
 * @description 获取事件表事件列表及字段列表
 */
const getEventList = async (name) => {
  state.loading = true
  state.eventList.splice(0, state.eventList.length)
  state.fieldList.splice(0, state.fieldList.length)
  try {
    if (
      !/^dim1_[0-9a-zA-Z]+$/.test(name) &&
      !/^dim2_[0-9a-zA-Z]+$/.test(name)
    ) {
      const eventRes = await getEventEventPropertyList()
      if (eventRes && eventRes.code === 200) {
        state.eventList = eventRes.data
      }
    }
    const propRes = await getEventPropertyList()
    if (propRes && propRes.code === 200) {
      state.fieldList = propRes.data
    }
  } finally {
    state.loading = false
  }
}

/**
 * @description 获取用户表字段
 */
const getUserPropList = () => {
  state.loading = true
  state.fieldList.splice(0, state.fieldList.length)
  getUserPropertyList()
    .then((res) => {
      if (res && res.code === 200) {
        state.fieldList = res.data
      }
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description 获取分群标签表分群标签列表及字段列表
 */
const getClusterAndPropList = async () => {
  state.loading = true
  state.eventList.splice(0, state.eventList.length)
  state.fieldList.splice(0, state.fieldList.length)
  try {
    const clusterRes = await getClusterList()
    if (clusterRes && clusterRes.code === 200) {
      state.eventList = clusterRes.data
    }
    const propRes = await getClusterPropertyList()
    if (propRes && propRes.code === 200) {
      state.fieldList = propRes.data
    }
  } finally {
    state.loading = false
  }
}

/**
 * @description 获取维度表字段列表
 */
const getDimList = (tableName) => {
  state.loading = true
  state.fieldList.splice(0, state.fieldList.length)
  getDimensionPropertyList({ tableName })
    .then((res) => {
      state.fieldList = res.data
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description 获取测试表字段列表
 */
const getTestViewList = () => {
  state.fieldList = [
    {
      name: '__app_id',
      displayName: t('analysis.sqlquery.appId'),
      type: 'string',
    },
    {
      name: '__time',
      displayName: t('analysis.sqlquery.receivingTime'),
      type: 'string',
    },
    {
      name: '__ip',
      displayName: t('analysis.sqlquery.uploadIP'),
      type: 'string',
    },
    {
      name: '__json',
      displayName: t('analysis.sqlquery.dataDetails'),
      type: 'string',
    },
    {
      name: '__event_name',
      displayName: t('analysis.sqlquery.eventName'),
      type: 'string',
    },
  ]
}

const getCustomList = (tableName) => {
  state.loading = true
  state.fieldList.splice(0, state.fieldList.length)
  getCustomPropertyList({ tableName })
    .then((res) => {
      state.fieldList = res.data
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 *  @description 点击筛选修改当前表筛选类型
 */
const handleTableType = (type) => {
  const ele = document.getElementById(type)
  ele.scrollIntoView({ behavior: 'smooth' })
  if (!type || type === state.curTableType) return
  state.curTableType = type
}

/**
 * @description 表解析
 */
const handleParseTable = async (name) => {
  if (props.isSql) {
    const content = t('analysis.sqlquery.confirmFill')
    await useTipModal({
      content,
      iconType: 3,
      needLoading: false,
      btnSwap: true,
      title: t('analysis.fill'),
    })
  }
  let res = null
  if (/^dim1_/.test(name) || /^dim2_/.test(name) || /^dim_/.test(name)) {
    res = await getDimensionParse({ tableName: name })
  } else if (/^test_view/.test(name)) {
    res = {
      code: 200,
      data: `SELECT __app_id,__time,__ip,__json,__event_name FROM test_view_${sessionStorage.getItem(
        'appId'
      )}`,
      message: t('common.successful'),
    }
  } else {
    res = await getTableParse({ tableName: name })
  }
  if (res.code === 200) {
    ElMessage({
      type: 'success',
      message: t('analysis.sqlquery.parsingSuccessful'),
    })
    emit('parseTable', res.data)
  }
}

/**
 * @description 清除操作
 */
const clearList = () => {
  state.iscluster = false
  state.isEvent = false
  state.eventList = []
  state.propertyList = []
  state.isSelect = false
}

/**
 * @description 复制表名
 */
const handleClipTable = (data, event) => {
  data = data.replace(sessionStorage.getItem('appId'), '{AppId:appId}')
  copyText(data, event)
}

/**
 * @description 复制事件名
 */
const handleClipEvent = (data, event) => {
  copyText(data, event)
}

/**
 * @description 事件解析
 */
const handleParseEvent = async (scope) => {
  const appId = sessionStorage.getItem('appId')
  const service = state.iscluster ? getClusterParse : getEventParse
  const params = {}
  if (state.iscluster) {
    params.id = scope.id
  } else {
    params.eventName = scope.name
    params.tableName = state.active_row_name
  }

  const res = await service({ ...params, appId })
  if (res.code === 200) {
    ElMessage({
      type: 'success',
      message: t('analysis.sqlquery.parsingSuccessful'),
    })
    emit('parseTable', res.data)
  }
}

/**
 * @description 获取事件属性
 */
const handleViewField = (data) => {
  state.checkEvent = data
}
/**
 * @description 取消事件属性
 */
const handleBackEvent = () => {
  state.checkEvent = {}
}

/**
 * @description 更新表结构
 */
const handleRefreshTable = () => {
  getTables(1)
}
</script>
<template>
  <div v-loading="state.loading" class="table-structure flex">
    <div class="t-l">
      <div class="t-l-tab table-body">
        <div
          class="pl10"
          style="
            height: 45px;
            line-height: 45px;
            border-bottom: 1px solid #e7e7ea;
          ">
          <el-button class="m0 p0" text @click="handleRefreshTable">
            <SvgIcon class="fz14 ml3" name="refresh1" />
            <span class="ml5">{{
              $t('analysis.sqlquery.updateTableStructure')
            }}</span>
          </el-button>
        </div>
        <div
          v-for="(key, index) in Object.keys(state.tableTypes)"
          :key="key"
          class="t-l-pane">
          <div
            @click="handleTableType(key)"
            :class="{ active: key === state.curTableType }">
            <div class="t-l-pane-body flex-center flex-between">
              <div class="pane-body-content">
                {{ state.tableTypes[key] }}
              </div>
              <div class="pane-body-number">
                {{
                  state.sortTableList.length
                    ? state.sortTableList[index].length
                    : 0
                }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="t-r flex fz14">
      <div class="t-r-table table-body">
        <div v-for="(item, index) in state.sortTableList" :key="index">
          <div :id="Object.keys(state.tableTypes)[index]" class="table-name">
            <span class="t-r-name table-name-text">{{
              Object.values(state.tableTypes)[index]
            }}</span>
          </div>
          <div
            v-for="items in item"
            :key="items.name"
            class="t-r-table-content flex-center flex-between">
            <div class="t-r-table-content-text">
              <div
                class="table-text table-text-title mb6"
                :title="items.name"
                @click="handleTableEvent(items.name)">
                {{ items.name }}
              </div>
              <div class="table-text mb6" :title="tableTypeTips(items)">
                {{ tableTypeTips(items) }}
              </div>
            </div>
            <div class="flex-center flex-between gap14 w46">
              <!-- 表解析 -->
              <Tooltip>
                <el-button
                  class="p0 m0 nd-operate-btn-active fz28"
                  text
                  @click.stop="handleParseTable(items.name)">
                  <SvgIcon class="fz14" name="sql-parse" />
                </el-button>
                <template #content>{{
                  $t('analysis.sqlquery.tableParsing')
                }}</template>
              </Tooltip>
              <!-- 复制参数表名 -->
              <Tooltip>
                <el-button
                  class="p0 m0 nd-operate-btn-active fz28"
                  text
                  @click.stop="handleClipTable(items.name, $event)">
                  <SvgIcon class="fz16 prevent-no" name="copy2" />
                </el-button>
                <template #content>{{
                  $t('analysis.sqlquery.copyTableName')
                }}</template>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
      <div
        v-show="(state.isSelect && state.isEvent) || state.iscluster"
        class="t-r-event table-body">
        <!-- 分群标签列表 -->
        <div v-show="state.iscluster">
          <div class="table-name">
            <span class="t-r-name table-name-text">{{
              $t('analysis.sqlquery.groupLabelTable.groupLabelList')
            }}</span>
          </div>
          <div class="ml10 mr10">
            <el-table
              :data="state.eventList"
              class="nd-table-custom"
              show-overflow-tooltip
              border
              ref="eventTableRef"
              height="490px">
              <el-table-column
                prop="name"
                :label="$t('analysis.sqlquery.groupLabelTable.groupTagName')"
                show-overflow-tooltip />
              <el-table-column
                prop="type"
                :label="$t('analysis.sqlquery.type')"
                show-overflow-tooltip />
              <el-table-column
                prop="displayName"
                :label="$t('analysis.sqlquery.groupLabelTable.displayName')"
                show-overflow-tooltip />
              <el-table-column :label="$t('common.operate')">
                <template #default="scope">
                  <div class="flex gap14 h28">
                    <!-- 分群标签解析 -->
                    <Tooltip>
                      <el-button
                        class="p0 m0 nd-operate-btn-active fz28"
                        text
                        @click.stop="handleParseEvent(scope.row)">
                        <SvgIcon class="fz16" name="sql-parse" />
                      </el-button>
                      <template #content>{{
                        $t(
                          'analysis.sqlquery.groupLabelTable.groupLabelParsing'
                        )
                      }}</template>
                    </Tooltip>
                    <!-- 复制分群标签名 -->
                    <Tooltip>
                      <el-button
                        class="p0 m0 nd-operate-btn-active fz28"
                        text
                        @click.stop="handleClipEvent(scope.row.name, $event)">
                        <SvgIcon class="fz16 prevent-no" name="copy2" />
                      </el-button>
                      <template #content>{{
                        $t(
                          'analysis.sqlquery.groupLabelTable.copyGroupLabelName'
                        )
                      }}</template>
                    </Tooltip>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <!-- 事件列表 -->
        <div
          v-show="
            state.isSelect &&
            state.isEvent &&
            JSON.stringify(state.checkEvent) === '{}'
          ">
          <div class="table-name">
            <span class="t-r-name table-name-text">
              {{ $t('analysis.sqlquery.eventList') }}
            </span>
          </div>
          <div class="ml10 mr10">
            <el-table
              :data="state.eventList"
              class="nd-table-custom"
              show-overflow-tooltip
              border
              ref="eventTableRef"
              height="490px">
              <el-table-column
                prop="name"
                :label="$t('analysis.sqlquery.eventName')"
                show-overflow-tooltip />
              <el-table-column
                prop="displayName"
                :label="$t('analysis.sqlquery.displayName')"
                show-overflow-tooltip />
              <el-table-column :label="$t('common.operate')">
                <template #default="scope">
                  <div class="flex gap14 h28">
                    <!-- 事件解析 -->
                    <Tooltip>
                      <el-button
                        class="p0 m0 nd-operate-btn-active fz28"
                        text
                        @click.stop="handleParseEvent(scope.row)">
                        <SvgIcon class="fz14" name="sql-parse" />
                      </el-button>
                      <template #content>
                        {{ $t('analysis.sqlquery.eventParsing') }}
                      </template>
                    </Tooltip>
                    <!-- 复制事件名 -->
                    <Tooltip>
                      <el-button
                        class="p0 m0 nd-operate-btn-active fz28"
                        text
                        @click.stop="handleClipEvent(scope.row.name, $event)">
                        <SvgIcon class="fz16 prevent-no" name="copy2" />
                      </el-button>
                      <template #content>
                        {{ $t('analysis.sqlquery.copyEventName') }}
                      </template>
                    </Tooltip>
                    <!-- 查看属性 -->
                    <Tooltip>
                      <el-button
                        class="p0 m0 nd-operate-btn-active fz28"
                        text
                        @click.stop="handleViewField(scope.row)">
                        <SvgIcon class="fz16" name="view-field" />
                      </el-button>
                      <template #content>
                        {{ $t('analysis.sqlquery.viewProperties') }}
                      </template>
                    </Tooltip>
                  </div>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
        <div
          v-show="
            state.isSelect &&
            state.isEvent &&
            JSON.stringify(state.checkEvent) !== '{}'
          ">
          <!-- 字段列表 -->
          <TableField
            :fieldList="state.checkEvent.properties"
            :title="`${state.checkEvent.name}(${state.checkEvent.displayName})`"
            @back="handleBackEvent" />
        </div>
      </div>
      <div v-show="state.isSelect" class="table-body flex1">
        <!-- 字段列表 -->
        <TableField :fieldList="state.fieldList" />
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.table-structure {
  width: 100%;
  overflow: hidden;
  color: var(--eas-text-color-primary);
  .table-body {
    height: 540px;
    overflow: auto;
  }
  .t-l {
    width: 160px;
    border-right: 1px solid var(--eas-split-line-color);
    .t-l-tab {
      .t-l-pane {
        cursor: pointer;
        &:hover {
          background: var(--eas-color-primary-light-1);
          color: var(--eas-color-primary);
        }
        position: relative;
        .t-l-pane-body {
          padding: 10px 8px 10px 10px;
          .pane-body-content {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .pane-body-number {
            width: 20px;
            height: 16px;
            border-radius: 1px;
            line-height: 16px;
            text-align: center;
            background: var(--eas-hover-color-1);
            color: var(--eas-text-color-primary);
          }
        }
      }
      .active {
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          display: block;
          width: 4px;
          height: 100%;
          border-radius: 2px;
          background-color: var(--el-color-primary);
        }
        color: var(--eas-color-primary);
        background: var(--eas-color-primary-light-1);
      }
    }
  }
  .t-r {
    width: calc(100% - 160px);
    .table-name {
      padding: 10px 20px;
      &-text {
        font-weight: bold;
        position: relative;
      }
    }
    &-table {
      width: 30%;
      border-right: 1px solid var(--eas-split-line-color);
      .t-r-name {
        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: -10px;
          display: block;
          width: 4px;
          height: 100%;
          border-radius: 2px;
          background-color: var(--el-color-primary);
        }
      }
      &-content {
        margin: 0 20px 4px 10px;
        padding: 8px 12px 8px 10px;
        &:hover {
          background: var(--eas-color-primary-light-1);
        }
        &-text {
          margin-right: 10px;
          flex: 1;
          overflow: hidden;
          .mb6 {
            margin-bottom: 6px;
          }
          .table-text {
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .table-text-title {
            cursor: pointer;
            &:hover {
              color: var(--eas-color-primary);
            }
          }
        }
        .w46 {
          width: 46px;
        }
      }
    }
    &-event {
      width: 35%;
      border-right: 1px solid var(--eas-split-line-color);
      overflow: hidden;
    }
    .flex1 {
      flex: 1;
    }
  }
}
</style>
