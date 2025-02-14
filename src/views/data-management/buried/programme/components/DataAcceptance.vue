<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.show"
    :title="$t('dataManagement.buried.dataAcceptance')"
    size="600px">
    <div class="flex gap20">
      <div
        v-for="(item, index) of wayList"
        :key="index"
        :class="[
          index === state.way && 'nd-data-acceptance-way-acitve',
          'w210 nd-data-acceptance-way',
        ]"
        @click="changeWay(index)">
        <div class="txt-bold">{{ item.label }}</div>
        <div class="fz12 c8a8a8a">{{ item.tip }}</div>
      </div>
    </div>
    <el-form
      label-position="top"
      ref="formRef"
      class="mt20"
      :model="state.formData">
      <el-form-item
        :label="$t('dataManagement.buried.timeRange') + '：'"
        prop="date"
        class="nd-data-acceptance-time-range">
        <div class="ccbd0d6">
          {{ $t('dataManagement.buried.dataAcceptanceTooltip') }}
        </div>
        <el-date-picker
          v-model="state.formData.date"
          type="datetimerange"
          :range-separator="$t('common.to')"
          :clearable="false"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          :editable="false" />
      </el-form-item>
      <el-form-item
        v-if="state.way === 0"
        :label="$t('dataManagement.buried.acceptanceCriteria') + '：'"
        prop="conditionInfo">
        <div class="ccbd0d6">
          {{ $t('dataManagement.buried.eventAcceptAll') }}
        </div>
        <el-select
          v-model="state.formData.conditionInfo"
          multiple
          filterable
          clearable
          collapse-tags
          value-key="id"
          collapse-tags-tooltip
          :max-collapse-tags="1">
          <el-option
            v-for="item of state.eventList"
            :key="item"
            :label="item.name"
            :value="item" />
        </el-select>
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { markRaw, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

import dayjs from 'dayjs'
import { recordBehavior } from '@/utils/record-behavior.js'
import { asyncSearchEventList } from '@/api/modules/programme/event.js'
import { asyncProgrammeInspection } from '@/api/modules/programme/data-check.js'
import { t } from '@/locales/i18n'

const wayList = [
  {
    label: t('dataManagement.buried.acceptanceEventData'),
    tip: t('dataManagement.buried.acceptanceEventDataTips'),
  },
  {
    label: t('dataManagement.buried.acceptanceUserData'),
    tip: t('dataManagement.buried.acceptanceUserDataTips'),
  },
]

const initVal = () => {
  return {
    // 0 事件数据、1 用户数据
    way: 0,
    operateLoading: false,
    show: false,
    eventList: [],
    formData: {
      date: [
        `${dayjs().subtract(2, 'days').format('YYYY-MM-DD')} 00:00:00`,
        dayjs().format('YYYY-MM-DD HH:mm:ss'),
      ],
      conditionInfo: [],
    },
  }
}

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const commonUploadRef = ref(null)

const close = () => {
  Object.assign(state, initVal())
}

const changeWay = (val) => {
  state.way = val
}
const submit = async () => {
  recordBehavior({
    moduleName: '数据管理',
    submoduleName: '埋点方案',
    operate: '开始验收',
  })
  state.operateLoading = true
  await asyncProgrammeInspection({
    conditionInfo: state.formData.conditionInfo,
    endTime: state.formData.date[1],
    startTime: state.formData.date[0],
    type: state.way,
  }).finally((_) => {
    state.operateLoading = false
  })
  state.show = false
  emit('getData')
  ElMessage.success(t('common.operationSuccessfully'))
}

const getEventList = async () => {
  const {
    data: { list },
  } = await asyncSearchEventList({
    size: -1,
  })
  state.eventList = markRaw(
    list.map((item) => {
      return {
        id: item.eventName,
        name: item.eventNameZh,
      }
    })
  )
}

const open = () => {
  state.show = true
  getEventList()
}

defineExpose({
  open,
})
defineOptions({
  name: 'DataAcceptance',
})
</script>

<style scoped lang="scss">
.nd-data-acceptance-way {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--eas-text-color-light-1);
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
}
.nd-data-acceptance-way-acitve {
  border-color: var(--eas-color-primary);
}
.nd-data-acceptance-time-range {
  :deep(.el-form-item__content) {
    width: 360px;
  }
}
</style>
