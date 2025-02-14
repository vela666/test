<template>
  <DefineTemplate v-slot="{ exhibit }">
    <AnalysisGlobalFilter
      :isAnalyze="false"
      title=""
      disabled
      :appId="appId"
      :limit="conditionLimit"
      :queryType="queryType"
      :showTemplate="!!appId"
      :exhibit="exhibit"
      :data="state.filedsData" />
  </DefineTemplate>

  <el-badge :value="conditionLen" :hidden="!conditionLen">
    <DropDownPopoverSelection hide-after="0" :showPopover="!!conditionLen">
      <span>
        <Tooltip>
          <el-button @click="open" class="fz18 w32 m0">
            <SvgIcon class="c545e6e" name="funnel-filter" />
          </el-button>
          <template #content>{{ t('common.filterConditions') }}</template>
        </Tooltip>
      </span>
      <template #custom>
        <div class="p20 flex-column">
          <ReuseTemplate :exhibit="condition" />
          <div class="flex-center mt10 flex-between w100-percentage">
            <div class="mr20">
              <span v-show="!state.isConditionChange">{{
                state.collectName
              }}</span>
            </div>
            <el-button text @click="resetConditions(true)"
              >{{ t('btn.clearAction') }}
            </el-button>
          </div>
        </div>
      </template>
    </DropDownPopoverSelection>
  </el-badge>

  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.visible"
    :title="t('common.filterConditions')"
    size="700px"
    :subTxt="t('btn.calculate')">
    <div class="current-filter" v-show="state.condition.filters.length">
      <div class="flex-center flex-between mb15">
        <div class="w100-percentage flex overflow-hidden mr20">
          <span v-showTips v-show="!state.isConditionChange">{{
            state.collectName
          }}</span>
        </div>
        <div class="no-wrap">
          <el-button @click="resetConditions(false)">
            {{ t('btn.clearAction') }}</el-button
          >
        </div>
      </div>
      <AnalysisGlobalFilter
        :isAnalyze="false"
        title=""
        :appId="appId"
        :limit="conditionLimit"
        :queryType="queryType"
        :showTemplate="!!appId"
        @change="conditionChange"
        v-model="state.condition"
        :data="state.filedsData"
        @add="addCondition"
        @remove="deleteCondition" />
    </div>
    <div
      class="h100-percentage flex-center flex-level-center"
      v-show="!state.condition.filters.length">
      <div class="flex-column flex-vertical-center">
        <Empty :desc="t('dashboard.noFilter')" />
        <el-button @click="addCondition()" type="primary" class="mt20">
          {{ t('dashboard.addFilter') }}
        </el-button>
      </div>
    </div>
  </CommonDrawer>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { createReusableTemplate } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import useOperate from '@/components/PropsFilter/useOperate'
import { conditionInItVal } from '@/views/see-plate/enum.js'

import { getFieldList } from '@/api/modules/analysis/common'
import { tableKeysArr } from '@/enumeration/index.js'
import { useI18n } from 'vue-i18n'

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

const emit = defineEmits(['getData'])
const props = defineProps({
  appId: {
    type: [String, Number],
    default: null,
  },
})

const condition = defineModel({
  type: Object,
  default() {
    return conditionInItVal()
  },
})
const reqConditionParam = defineModel('reqConditionParam', {
  type: Object,
  default() {
    return {}
  },
})

const { t } = useI18n()
const route = useRoute()

const { handleDelConditionData, handleAddConditionData, getConditionResult } =
  useOperate()

const initVal = () => {
  return {
    operateLoading: false,
    isConditionChange: false,
    visible: false,
    collectName: '',
    condition: conditionInItVal(),
  }
}

const state = reactive(initVal())

const queryType = computed(() => {
  return props.appId ? 1 : 2
})

const conditionLimit = computed(() => {
  return props.appId ? tableKeysArr : ['eventField', 'userField']
})

const conditionLen = computed(() => {
  return condition.value.filters.reduce((p, c) => {
    p += c.filters?.length || 1
    return p
  }, 0)
})

const conditionChange = () => {
  state.isConditionChange = true
}

// 添加全局筛选项
const addCondition = (index) => {
  state.isConditionChange = true
  state.condition = handleAddConditionData({
    condition: state.condition,
    noLimit: conditionLimit.value,
    conditionList: state.filedsData,
    index,
  })
}

// 全局筛选删除一项
const deleteCondition = (index, subIndex) => {
  state.condition = handleDelConditionData({
    condition: state.condition,
    index,
    subIndex,
  })
}

const resetConditions = async (exec = false) => {
  state.condition = initVal().condition
  if (exec) {
    condition.value = cloneDeep(state.condition)
    reqConditionParam.value = {}
    emit('getData')
  }
}

const close = () => {
  Object.assign(state, initVal())
}

const handleConditionResult = async (val) => {
  try {
    const result = await getConditionResult({
      condition: val || state.condition,
    })
    condition.value = cloneDeep(val || state.condition)
    reqConditionParam.value = result
  } catch (e) {
    ElMessage.warning(e)
    await Promise.reject('')
  }
}

const open = async () => {
  state.condition = cloneDeep(condition.value)
  state.visible = true
  getAllData()
}

const submit = async () => {
  await handleConditionResult(state.condition)
  state.visible = false
  emit('getData')
}

// 获取对应事件的事件属性和用户属性、用户分群、用户标签
const asyncGetFieldList = async (parmas = {}) => {
  state.operateLoading = true
  const { data } = await getFieldList({
    ...(props.appId && {
      appId: props.appId,
    }),
    queryType: queryType.value,
  }).finally((_) => {
    state.operateLoading = false
  })
  state.filedsData = data
}

const handleDefaultCondition = () => {
  condition.value = conditionInItVal()
  reqConditionParam.value = {}
}

const getAllData = async (exec = false) => {
  if (!route.query.kanBanId) return
  await asyncGetFieldList()
  exec && handleDefaultCondition()
}

defineExpose({
  getAllData,
})
defineOptions({
  name: 'FilterCondition',
})
</script>

<style scoped lang="scss">
.current-filter {
  display: flex;
  flex-direction: column;
  height: 100%;

  .nd-kanban-condition-filter {
    overflow: hidden;
    display: flex;
    flex-direction: column;
    padding: 0;
  }

  :deep(.global-filter-container) {
    height: 100%;
    overflow: auto;
    padding: 10px;
    &::-webkit-scrollbar-track-piece {
      background-color: var(--eas-hover-color);
    }
  }
  :deep(.add-conditions) {
    padding: 10px;
  }
}
</style>
