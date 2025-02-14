<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue'
import { useTipModal } from '@/components/TipDialog'
import { ElMessage } from 'element-plus'
import {
  getEarlyWarnList,
  getEarlyWarnDelaySet,
  updateEarlyWarnDelaySet,
  earlyWarnDelete,
  earlyWarnUpdateStatus,
} from '@/api/modules/data-management/early'
import { slicePagingData } from '@/utils/dataProcessing'
import operateEarlyWarn from './operateEarlyWarn.vue'
import { cloneDeep } from 'lodash-es'
import { useRouter } from 'vue-router'
import { authEnum, operateAuth } from './enum.js'
import { recordBehavior } from '@/utils/record-behavior.js'
import TestData from './TestData.vue'
import ErroData from './ErroData.vue'
import { t } from '@/locales/i18n'

recordBehavior({
  moduleName: '数据管理',
  submoduleName: '预警管理',
  operate: '进入页面',
})

const router = useRouter()

const state = reactive({
  columns: [
    { label: t('common.name'), prop: 'warnName' },
    {
      label: t('dataManagement.earlyWarn.earlyWarningRules'),
      prop: 'cycle',
      width: 300,
    },
    { label: t('dataManagement.earlyWarn.timeZone'), prop: 'timeZone' },
    { label: t('common.createBy'), prop: 'createBy' },
    { label: t('common.updateBy'), prop: 'updateBy' },
    { label: t('common.updateTime'), prop: 'updateTime' },
    { label: t('common.status'), switch: true, prop: 'status' },
    { label: t('common.operate'), operate: true, prop: 'operate' },
  ].filter((item) => {
    if (!authEnum.status && item.switch) {
      return false
    }
    if (operateAuth && item.operate) {
      return false
    }
    return true
  }),
  cycleObj: {
    1: t('dataManagement.earlyWarn.comparedPreviousDay'),
    2: t('dataManagement.earlyWarn.comparedHour'),
    3: t('dataManagement.earlyWarn.comparedFixed'),
    4: t('dataManagement.earlyWarn.notInInterval'),
    5: t('dataManagement.earlyWarn.yearOnYear'),
  },
  timeZoneObj: {
    0: 'UTC+0',
    8: 'UTC+8',
  },
  id: null,
  delayDay: 0,
  delayHour: 0,
  tableData: [],
  pageData: [],
  pageConfig: {
    // 分页器配置
    page: 1, // 当前页码
    size: 20, // 每页数量
    total: 0, // 总数
  },
  num: 0,
  countNum: 5,
  type: 'add',
  visible: false,
  loading: false,
  delayLoading: false,
})

onMounted(() => {
  const appId = sessionStorage.getItem('appId')
  if (!appId) return
  getEarlyWarn()
  getEarlyWarnDelay()
})

const operateEarlyWarnRef = ref()
const testDataRef = ref()
const errorDataRef = ref()

const getList = () => {
  getEarlyWarn('page')
}

/**
 * @description 列表查询
 */
const getEarlyWarn = (type) => {
  state.tableData.splice(0, state.tableData.length)
  state.pageConfig.total = 0
  if (!type) {
    state.pageConfig.page = 1
  }
  const params = {
    page: state.pageConfig.page,
    size: state.pageConfig.size,
  }
  state.loading = true
  getEarlyWarnList(params)
    .then((res) => {
      if (res && res.code === 200) {
        state.num = res.data.earlyWarnNum.split('/')[0]
        state.countNum = res.data.earlyWarnNum.split('/')[1]
        state.tableData = res.data?.pageInfo?.list || []
        state.pageData = slicePagingData(
          state.tableData,
          state.pageConfig.page,
          state.pageConfig.size
        )
        state.pageConfig.total = res.page?.pageInfo?.totalCount || 0
      }
    })
    .finally(() => {
      state.loading = false
    })
}

/**
 * @description 预警设置查询
 */
const getEarlyWarnDelay = () => {
  getEarlyWarnDelaySet().then((res) => {
    if (res && res.code === 200) {
      state.id = res.data.id
      state.delayDay = res.data.delayDay
      state.delayHour = res.data.delayHour
    }
  })
}

/**
 * @description 状态开关
 */
const switchChange = async (row) => {
  try {
    if (row.status === 0) {
      const content = t('dataManagement.earlyWarn.confirmDisableWarn', [
        row.warnName,
      ])
      await useTipModal({
        content,
        iconType: 3,
        needLoading: false,
        btnSwap: true,
        title: t('btn.disable'),
      })
    }
    await earlyWarnUpdateStatus({
      id: row.id,
      status: row.status,
    })
    ElMessage.success(
      `${row.status === 1 ? t('common.successfullyEnabled') : t('dataManagement.disabledSuccessfully')}`
    )
  } catch (e) {
    row.status = row.status === 0 ? 1 : 0
  }
}

const dropdownSettings = ref()

/**
 * @description 新增预警任务
 */
const handleAdd = () => {
  state.visible = true
  state.type = 'add'
  nextTick(() => {
    operateEarlyWarnRef.value.setData()
  })
}

/**
 * @description 打开
 */
const handleOpen = () => {
  dropdownSettings.value.handleOpen()
}

/**
 * @description 取消
 */
const handleCancle = () => {
  dropdownSettings.value.handleClose()
}

/**
 * @description 预警设置修改
 */
const handleSubmit = () => {
  recordBehavior({
    moduleName: '数据管理',
    submoduleName: '预警管理',
    operate: '设置预警延迟',
  })
  const params = {
    id: state.id,
    delayDay: state.delayDay,
    delayHour: state.delayHour,
  }
  state.delayLoading = true
  updateEarlyWarnDelaySet(params)
    .then((res) => {
      if (res && res.code === 200) {
        ElMessage.success(t('dataManagement.earlyWarn.successSetWarn'))
        handleCancle()
      }
    })
    .finally(() => {
      state.delayLoading = false
    })
}

// 只能输入整数
const handleInput = (name) => {
  const value = state[name]
    .replace(/[^\d{1,}\d{1,}|\d{1,}]/g, '')
    .replace(/^0+/g, '0')
    .replace(/(^0)(\d{1,})/g, '$2')
  nextTick(() => {
    if (!value || value === '0') {
      state[name] = 1
    } else {
      state[name] = value
    }
  })
}

/**
 * @description 新增/编辑提交
 */
const handleDrawerSubmit = () => {
  operateEarlyWarnRef.value.submit()
}

/**
 * @description 保存/编辑操作完成调用
 */
const handleDrawerClose = () => {
  operateEarlyWarnRef.value.close()
  state.visible = false
}

/**
 * @description 保存/编辑操作完成调用
 */
const handleOperateClose = (type) => {
  state.visible = false
  if (type === 'save') {
    getEarlyWarn()
  }
}

/**
 * @description 删除预警
 */
const deleteRow = async (row) => {
  const content = t('dataManagement.earlyWarn.confirmDeleteWarn', [
    row.earlyName,
  ])
  await useTipModal({
    content,
    iconType: 3,
    needLoading: false,
    btnSwap: true,
    title: t('dataManagement.earlyWarn.deleteEarlyWarning'),
  })
  const res = await earlyWarnDelete({ earlyWarnIdList: [row.id] })
  if (res && res.code === 200) {
    ElMessage.success(t('common.deleteSuccessfully'))
    getEarlyWarn()
  }
}

/**
 * @description 编辑预警
 */
const editRow = (row) => {
  if (row.type === 2) {
    testDataRef.value.open(row)
  } else if (row.type === 3) {
    errorDataRef.value.open(row)
  } else {
    state.visible = true
    state.type = 'edit'
    nextTick(() => {
      operateEarlyWarnRef.value.setData(cloneDeep(row))
    })
  }
}

/**
 * @description 跳转预警详情界面
 */
const goRoute = (row) => {
  if (row.type !== 1) return
  router.push(`/data-management/early-warn-detail?id=${row.id}`)
}

const getErrorTestTxt = (row) => {
  const param = JSON.parse(row?.param || '{}')
  return row.type === 2
    ? t('dataManagement.earlyWarn.errorDataTip1', [
        param?.warnRate,
        param?.warnThreshold,
      ])
    : t('dataManagement.earlyWarn.errorDataTip2', [param?.warnRate])
}

defineOptions({
  name: 'EarlyWarn',
})
</script>
<template>
  <CommonLayout>
    <template #hl>
      <Auth :value="authEnum.add">
        <template #default>
          <el-button
            type="primary"
            @click="handleAdd"
            :disabled="state.num === state.countNum">
            <SvgIcon name="add1" class="fz16 mr3" />
            {{ t('btn.add') }}
          </el-button>
        </template>
      </Auth>
      <Auth :value="authEnum.delay">
        <template #default>
          <CommonDropdown
            trigger="contextmenu"
            ref="dropdownSettings"
            width="300px">
            <template #content>
              <el-button @click="handleOpen">
                <SvgIcon name="warn-delay" class="fz16 mr3" />
                {{ t('dataManagement.earlyWarn.warnDelaySet') }}
              </el-button>
            </template>
            <template #title>
              <span>{{ t('dataManagement.earlyWarn.warnDelaySet') }}</span>
              <Tooltip>
                <SvgIcon class="fz14 ml5" name="help2" />
                <template #content>
                  <div>
                    <p>
                      {{ t('dataManagement.earlyWarn.warnDelaySetTip1') }}
                    </p>
                    <br />
                    <p>
                      {{ t('dataManagement.earlyWarn.warnDelaySetTip2') }}
                    </p>
                    <br />
                    <p>{{ t('dataManagement.earlyWarn.warnDelaySetTip3') }}</p>
                    <br />
                    <p>
                      {{ t('dataManagement.earlyWarn.warnDelaySetTip4') }}
                    </p>
                  </div>
                </template>
              </Tooltip>
            </template>
            <template #container>
              <div class="flex-center fz14 mb20">
                <div>
                  <div class="txt-bold h24">
                    {{ t('dataManagement.earlyWarn.calculateFrequency') }}
                  </div>
                  <div class="mt20 h24">{{ t('dateRangeSelect.day') }}</div>
                  <div class="mt20 h24">{{ t('dateRangeSelect.hour') }}</div>
                </div>
                <div class="ml20">
                  <div class="txt-bold h24">
                    {{ t('dataManagement.earlyWarn.delayTimeTask') }}
                  </div>
                  <div class="mt20 h24">
                    <CommonInput
                      v-model="state.delayDay"
                      class="w100"
                      size="small"
                      :prefixSlot="false"
                      trimAllSpace
                      maxlength="3"
                      @input="handleInput('delayDay')" />
                    <span class="ml10">{{ t('dateRangeSelect.minute') }}</span>
                  </div>
                  <div class="mt20 h24">
                    <CommonInput
                      v-model="state.delayHour"
                      class="w100"
                      size="small"
                      :prefixSlot="false"
                      trimAllSpace
                      maxlength="3"
                      @input="handleInput('delayHour')" />
                    <span class="ml10">{{ t('dateRangeSelect.minute') }}</span>
                  </div>
                </div>
              </div>
            </template>
            <template #buttom>
              <div>
                <el-button text class="skip mr10" @click="handleCancle">
                  {{ t('btn.cancel') }}
                </el-button>
                <el-button
                  :loading="state.delayLoading"
                  type="primary"
                  class="m0"
                  @click="handleSubmit">
                  {{ t('btn.confirm') }}
                </el-button>
              </div>
            </template>
          </CommonDropdown>
        </template>
      </Auth>
    </template>
    <template #hr>
      <div class="c545e6e fz14">
        {{ t('dataManagement.earlyWarn.createdWarnTotal') }}
        <span class="c5473e8">{{ state.num }}</span
        >/{{ state.countNum }}
        {{ t('dataManagement.earlyWarn.earlyWarning') }}
      </div>
    </template>
    <el-table
      v-loading="state.loading"
      class="nd-table-custom"
      :data="state.pageData"
      border
      ref="tableRef"
      row-key="eventId">
      <el-table-column
        v-for="(column, index) of state.columns"
        :prop="column.prop"
        :key="index"
        :label="column.label"
        v-bind="{ ...column }">
        <template #default="{ row }">
          <span
            v-if="['warnName'].includes(column.prop)"
            v-showTips
            @click="goRoute(row)"
            :class="[row.type === 1 && 'c-pointer c5473e8']">
            {{ row[column.prop] }}
          </span>
          <template v-else-if="column.prop === 'cycle'">
            <div class="flex-center">
              <template v-if="row.type === 1">
                <div class="mr5">{{ state.cycleObj[row[column.prop]] }}</div>
                <!--                :class="[scope.row['compare'] === 1 ? 'downColor' : 'upColor']"-->
                <div v-if="[1, 2, 5].includes(row.cycle)">
                  <span>{{
                    row['compare'] === 1
                      ? t('dataManagement.earlyWarn.high')
                      : t('dataManagement.earlyWarn.low')
                  }}</span>
                  <span class="ml5">{{ row.value }}</span>
                  <span>{{ row['compareType'] === 1 ? '' : '%' }}</span>
                </div>
                <div v-else-if="row.cycle === 3">
                  <span class="mr5">{{ row.value }}</span>
                  <span>{{
                    row['compare'] === 1
                      ? t('dataManagement.earlyWarn.high')
                      : t('dataManagement.earlyWarn.low')
                  }}</span>
                </div>
                <div v-else-if="row.cycle === 4">
                  <span class="mr5">{{ row.value }}</span>
                  <span>{{ t('common.to') }}</span>
                  <span class="ml5">{{ row.value2 }}</span>
                </div>
              </template>
              <template v-else>
                {{ getErrorTestTxt(row) }}
              </template>
            </div>
          </template>
          <template v-else-if="column.prop === 'timeZone'">
            {{ state.timeZoneObj[row[column.prop]] }}
          </template>
          <template v-else-if="column.prop === 'status'">
            <el-switch
              :active-value="1"
              :inactive-value="0"
              v-model="row.status"
              @change="switchChange(row)">
            </el-switch>
          </template>
          <div class="flex-center" v-else-if="column.prop === 'operate'">
            <Auth :value="authEnum.upd">
              <template #default>
                <el-button @click="editRow(row)" type="primary" text class="p0">
                  {{ t('btn.edit') }}
                </el-button>
              </template>
            </Auth>
            <Auth :value="authEnum.del">
              <template #default>
                <el-button
                  :disabled="row.type !== 1"
                  class="p0"
                  @click="deleteRow(row)"
                  type="primary"
                  text>
                  {{ t('btn.delete') }}
                  <!-- {{ title }} -->
                </el-button>
              </template>
            </Auth>
          </div>
        </template>
      </el-table-column>
    </el-table>
    <template #footer>
      <Pagination
        v-model:limit="state.pageConfig.size"
        v-model:page="state.pageConfig.page"
        :total="state.pageConfig.total"
        @getData="getList" />
    </template>
  </CommonLayout>
  <CommonDrawer
    @submit="handleDrawerSubmit"
    @close="handleDrawerClose"
    size="600px"
    :loading="operateEarlyWarnRef?.state?.loading"
    v-model="state.visible"
    :title="
      state.type === 'add'
        ? t('dataManagement.earlyWarn.addEarlyWarning')
        : t('dataManagement.earlyWarn.editEarlyWarning')
    ">
    <operateEarlyWarn ref="operateEarlyWarnRef" @close="handleOperateClose" />
  </CommonDrawer>
  <TestData @getList="getList" ref="testDataRef" />
  <ErroData @getList="getList" ref="errorDataRef" />
</template>
<style lang="scss" scoped>
.h24 {
  height: 24px;
  line-height: 24px;
}
</style>
