<script setup>
import { nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import useOperate from '@/components/PropsFilter/useOperate'
import useAanlysisUtils from '@/views/analysis/hooks/useAanlysisUtils.js'
import { cloneDeep, isEqual } from 'lodash-es'
import { ActionBtn } from '@/views/analysis/components/AnalysisSideBar'
import {
  earlyWarnAdd,
  earlyWarnDeleteAddress,
  earlyWarnEdit,
  earlyWarnQueryAddress,
  getEarlyWarnSelectAppProjectUser,
  testSend,
  validationEarlyWarn,
} from '@/api/modules/data-management/early'
import { useTipModal } from '@/components/TipDialog'
import operateWebhook from './operateWebhook.vue'
import { tableKeysArr } from '@/enumeration'
import { t } from '@/locales/i18n'

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
})

const {
  handleAddConditionData,
  handleDelConditionData,
  parseFilterData,
  parseFiltersFromRes,
  omitFiltersHandler,
} = useOperate()
const {
  reportId,
  currentEventList,
  getFirstEvent,
  fetchEventFieldsData,
  setInitEventField,
  fetchFieldList,
  getFirstField,
  initBeforeGetEvents,
  getFormulaRequestParams, // 请求所需参数
  setIndexDisplay,
  getIndexItem, // 指标数据回选处理
  getFormulaIndexItem, // 自定义公式组件数据回选处理
  setGlobalFiltersDisplay,
  setGroupByDisplay,
  omitGroupsHandler,
} = useAanlysisUtils()

const limit = tableKeysArr

const formDataInit = {
  warnName: '',
  timeZone: '8',
  timeParticle: 'hour',
  cycle: 2,
  compare: 1,
  value: 0,
  fixedVal: 0,
  before: 0,
  after: 0,
  compareType: 1,
  sendSet: [
    {
      sendType: 4,
      emailUserId: [],
      sendAddress: '',
    },
  ],
}

const initVal = () => {
  return {
    id: null,
    formData: cloneDeep(formDataInit),
    code: [],
    event: {},
    emailList: [],
    compareHourList: [
      {
        label: t('dataManagement.earlyWarn.comparedHour'),
        value: 2,
      },
      {
        label: t('dataManagement.earlyWarn.comparedFixed'),
        value: 3,
      },
      {
        label: t('dataManagement.earlyWarn.notInInterval'),
        value: 4,
      },
    ],
    compareDayList: [
      {
        label: t('dataManagement.earlyWarn.comparedPreviousDay'),
        value: 1,
      },
      {
        label: t('dataManagement.earlyWarn.yearOnYear'),
        value: 5,
      },
      {
        label: t('dataManagement.earlyWarn.comparedFixed'),
        value: 3,
      },
      {
        label: t('dataManagement.earlyWarn.notInInterval'),
        value: 4,
      },
    ],
    sendTypeList: [1, 3, 4], // 类型汇总
    // 是否校验过
    verify: false,
    loading: false,
    testSend: false,
    addressddList: [],
    addressfsList: [],
    oldForm: {},
    oldParam: [],
  }
}
const state = reactive(initVal())

let analysisIndicators = null

const formRef = ref()

/**
 * @description 获取用户邮箱信息
 */
const getProjectUser = async (bool) => {
  if (bool) {
    const res = await getEarlyWarnSelectAppProjectUser()
    if (res && res.code === 200) {
      state.emailList = res.data
    }
  }
}

/**
 * @description 获取webhook地址列表
 */
const sendAddressVisibleChange = (bool, sendType) => {
  if (bool) {
    if (sendType === 1) {
      state.addressfsList = []
    } else {
      state.addressddList = []
    }
    earlyWarnQueryAddress({ type: sendType }).then((res) => {
      if (res && res.code === 200) {
        if (sendType === 1) {
          state.addressfsList = res.data
        } else {
          state.addressddList = res.data
        }
      }
    })
  }
}

/**
 * @description 删除webhook地址
 */
const handledelAddressUrl = async (addressName, addressId) => {
  const content = t('dataManagement.earlyWarn.confrimDeleteWebhook', [
    addressName,
  ])
  await useTipModal({
    content,
    iconType: 3,
    needLoading: false,
    btnSwap: true,
    title: t('common.tip'),
  })
  const res = await earlyWarnDeleteAddress({ id: addressId })
  if (res && res.code === 200) {
    ElMessage.success(t('common.deleteSuccessfully'))
  }
}

const formRules = {
  warnName: [
    {
      required: true,
      max: 50,
      message: t('dataManagement.earlyWarn.enterTaskName'),
      trigger: 'blur',
    },
  ],
}

/**
 * @description 计算周期改变
 */
const timeParticleChange = (val) => {
  if ([3, 4].includes(state.formData.cycle)) return
  if (val === 'hour') {
    state.formData.cycle = state.compareHourList[0].value
  } else {
    state.formData.cycle = state.compareDayList[0].value
  }
  resetVerify()
}

const emit = defineEmits(['close'])

const resetVerify = () => {
  state.verify = false
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return

    const params = getParams()
    if (!params) return

    // 发送设置验证
    for (const item of state.formData.sendSet) {
      if (!item.sendAddress && !item.emailUserId.length) {
        ElMessage.warning(t('dataManagement.earlyWarn.confirmSend'))
        return
      }
    }
    if (params.id && !handleContrast(params)) {
      await useTipModal({
        content: t('dataManagement.earlyWarn.confirmEditTask'),
        iconType: 3,
        needLoading: false,
        btnSwap: true,
        title: t('common.tip'),
      })
      // handleAxios(params)
      // return
    }

    if (
      !state.verify ||
      !analysisIndicators ||
      !isEqual(analysisIndicators, params.param)
    ) {
      state.loading = true
      await validationEarlyWarn(params).finally(() => {
        state.loading = false
      })
    }

    analysisIndicators = params.param
    handleAxios(params)
  })
}

// 获取参数
const getParams = () => {
  let analysisData = null
  try {
    const filts = parseFilterData(state.event?.eventFilters)
    if (filts === false) {
      ElMessage.warning(t('common.filterConditionErr'))
      return
    }
    if (currentEventList.value.length === 0) {
      ElMessage.warning(t('analysis.path.eventEmpty'))
      return
    }
    if (!state.event.customizable) {
      // 非自定义公式
      analysisData = JSON.stringify({
        eventId: state.event?.events?.eventId ?? null,
        eventName: state.event?.events?.eventName ?? '',
        eventNameDisplay: state.event?.events?.eventNameZh ?? '',
        parentId: state.event?.eventFields?.parentId ?? null,
        propertyName: state.event?.eventFields?.propertyName ?? '',
        propertyNameDisplay:
          state.event?.eventFields?.propertyNameDisplay ?? '',
        analysis: state.event?.eventFields?.analysis ?? '',
        analysisDesc: state.event?.eventFields?.analysisDesc ?? '',
        ...filts,
      })
    } else {
      //自定义公式
      const customParam = getFormulaRequestParams(state.code)
      if (!customParam) {
        return
      }
      analysisData = JSON.stringify({
        ...customParam,
        ...filts,
      })
    }
  } catch (errMsg) {
    ElMessage.warning(errMsg)
    return
  }
  const params = cloneDeep(state.formData)
  params.value = Number(params.value)
  if (params.cycle === 3) {
    params.value = Number(params.fixedVal)
  } else if (params.cycle === 4) {
    params.compare = 3
    params.value = Number(params.before)
    params['value2'] = Number(params.after)
    if (params['value2'] < params.value || params['value2'] === params.value) {
      ElMessage.warning(t('dataManagement.earlyWarn.intervalWarnError'))
      return
    }
  }
  delete params.fixedVal
  delete params.before
  delete params.after

  const earlyWarnSendSetList = []
  params.sendSet.forEach((item) => {
    if (item.sendType === 4) {
      if (Array.isArray(item.emailUserId)) {
        item.emailUserId.forEach((id) => {
          earlyWarnSendSetList.push({
            sendType: item.sendType,
            sendValue: id,
          })
        })
      }
    } else {
      earlyWarnSendSetList.push({
        sendType: item.sendType,
        sendValue: item.sendAddress,
      })
    }
  })
  params.earlyWarnSendSetList = earlyWarnSendSetList
  delete params.sendSet
  params.param = analysisData
  if (state.id) {
    params.id = state.id
  }
  return params
}

/**
 * @description 参数对比
 */
const handleContrast = (params) => {
  const contrastData = cloneDeep(params)
  const newobjStr = JSON.stringify(contrastData.param, function (k, v) {
    if (k === 'parentId' && !v) {
      return undefined
    }
    return v
  })
  const newObj = JSON.parse(newobjStr)
  if (!isEqual(state.oldParam, newObj)) {
    return false
  }

  delete state.oldForm.warnName
  delete state.oldForm.sendSet
  delete state.oldForm.timeZone
  delete contrastData.warnName
  delete contrastData.earlyWarnSendSetList
  delete contrastData.timeZone
  delete contrastData.param
  delete contrastData.appId
  delete contrastData.id

  const oldFormCopy = cloneDeep(state.oldForm)
  if (oldFormCopy.cycle === 3) {
    oldFormCopy.value = Number(oldFormCopy.fixedVal)
  } else if (oldFormCopy.cycle === 4) {
    oldFormCopy.value = Number(oldFormCopy.before)
    oldFormCopy['value2'] = Number(oldFormCopy.after)
  }
  delete oldFormCopy.fixedVal
  delete oldFormCopy.before
  delete oldFormCopy.after

  if (!isEqual(oldFormCopy, contrastData)) {
    return false
  }
  return true
}

const handleAxios = (params) => {
  state.loading = true
  let axiosName = earlyWarnAdd
  if (params.id) {
    axiosName = earlyWarnEdit
  }
  axiosName(params)
    .then((res) => {
      if (res.code === 200) {
        ElMessage.success(t('dataManagement.earlyWarn.successfullySaved'))
        close('save')
      }
    })
    .finally(() => {
      state.loading = false
    })
}

const testSendSetting = (item) => {
  const data = {
    webHookUrl: item.sendAddress,
    sendType: item.sendType === 1 ? 2 : 3,
  }
  state.testSend = true
  testSend(data)
    .then((res) => {
      if (res.code === 200) {
        ElMessage.success(t('dataManagement.earlyWarn.sentSuccessfully'))
      }
    })
    .finally(() => {
      state.testSend = false
    })
}

const setData = async (data) => {
  if (data) {
    state.id = data.id
    const newForm = {
      warnName: data.warnName,
      timeZone: data.timeZone,
      timeParticle: data.timeParticle,
      cycle: data.cycle,
      compare: data.compare,
      value: [3, 4].includes(data.cycle) ? 0 : data.value,
      fixedVal: data.cycle === 3 ? data.value : 0,
      before: data.cycle === 4 ? data.value : 0,
      after: data.cycle === 4 ? data.value2 : 0,
      compareType: data.compareType,
      sendSet: [],
    }

    // 发送配置组合
    let emailFalg = true
    data.earlyWarnSendSetList.forEach((item) => {
      let newSendSet
      if (item.sendType === 4) {
        if (emailFalg) {
          emailFalg = false
          newSendSet = {
            sendType: item.sendType,
            emailUserId: data.earlyWarnSendSetList
              .filter((i) => i.sendType === 4)
              .map((m) => m.sendValue),
            sendAddress: '',
          }
          newForm.sendSet.push(newSendSet)
        }
      } else {
        newSendSet = {
          sendType: item.sendType,
          emailUserId: [],
          sendAddress: item.sendValue,
        }
        newForm.sendSet.push(newSendSet)
      }
    })
    analysisIndicators = cloneDeep(data.param)
    state.verify = true
    const param = JSON.parse(data.param)
    state.event.customizable = Array.isArray(param.customIndex) ? true : false

    if (!state.event.customizable) {
      state.event = await getIndexItem(param, {}, {})
    } else {
      const IndexItem = await getFormulaIndexItem(param)
      state.code = IndexItem.code
      state.event.fieldsList = IndexItem.fieldsList
      state.event.eventFilters = IndexItem.eventFilters
    }

    await getProjectUser(true)
    state.formData = Object.assign(state.formData, newForm)

    state.oldForm = cloneDeep(newForm)
    state.oldParam = data.param
  } else {
    state.event = await getAnalysisItem()
  }
}

const close = (type) => {
  formRef.value.resetFields()
  Object.assign(state, initVal())
  emit('close', type)
}

/**
 * @description 只能输入整数跟小数
 */
const handleInput = (val, key) => {
  let value = val
    .replace(/[^\d{1,}.\d{1,}|\d{1,}]/g, '')
    .replace(/\.+/g, '.')
    .replace(/^0+/g, '0')
    .replace(/(^0)(\d{1,})/g, '$2')
    .replace(/(\d{1,})(\.)(\d{1,})(\.)/g, '$1$2$3')
  value = value
    .replace(/^(\d{12})\d{1,}$/, '$1')
    .replace(/^(\d{1,12})(\.)(\d{6})\d{1,}$/, '$1$2$3')
  nextTick(() => {
    if (!value) {
      value = 0
    }
    state.formData[key] = value
  })
}

/**
 * @description 生成普通指标
 */
async function getAnalysisItem() {
  let temp = {
    events: {},
    eventFilters: {
      relation: 0,
      filters: [],
    },
    fieldsList: {},
    customizable: false,
    eventFields: {},
    eventFieldsData: {},
  }
  temp.events = getFirstEvent()
  if (temp?.events?.eventId) {
    temp.eventFieldsData = await fetchEventFieldsData(temp?.events?.eventId)
    temp.eventFields = setInitEventField(temp.eventFieldsData)
    // 获取筛选条件的数据源
    temp.fieldsList = await fetchFieldList(temp.events.eventId)
  }
  return cloneDeep(temp)
}

/**
 * @description 切换自定义指标
 */
const changeCustom = (key) => {
  state[key].customizable = !state[key].customizable
  nextTick(() => {
    if (!state.event.customizable) {
      //非自定义公式
      eventChange('event', state.event.events)
    } else {
      //自定义公式
      const ids = state.code
        .filter((item) => item.type === 2)
        .map((i) => i.value.events.eventId)
      customEventChange('event', [...new Set(ids)])
    }
  })
}

/**
 * @description 指标事件切换
 */
const eventChange = async (index, val) => {
  if (val?.eventId) {
    const resData = await fetchEventFieldsData(val?.eventId)
    state[index].eventFieldsData = resData
    state[index].eventFields = setInitEventField(resData)
    const fieldsListData = await fetchFieldList(val?.eventId)
    state[index].fieldsList = cloneDeep(fieldsListData)
    omitFilters(fieldsListData, index)
  }
}

/**
 * @description 自定义指标事件改变监听
 */
const customEventChange = async (index, events) => {
  if (Array.isArray(events)) {
    state[index].fieldsList = await fetchFieldList(events.join(','))
    omitFilters(state[index].fieldsList, index)
  }
}

/**
 * @description 处理筛选列表中在数据源中不存在的筛选属性
 */
const omitFilters = (data, index) => {
  let temp = state[index]?.eventFilters?.filters
  if (!Array.isArray(temp) || temp.length === 0) return
  const newFilters = omitFiltersHandler(data, temp)

  state[index].eventFilters.filters = newFilters
}

/**
 * @description 添加筛选条件: 有index则是添加子筛选项
 */
const addFilter = (key, index) => {
  state[key].eventFilters = handleAddConditionData({
    condition: state[key].eventFilters,
    noLimit: limit,
    conditionList: state[key].fieldsList,
    index,
  })
}

/**
 * @description 删除筛选项:有subfIndex则是删除子筛选项
 */
const deleteFilter = (key, fIndex, subfIndex) => {
  state[key].eventFilters = handleDelConditionData({
    condition: state[key].eventFilters,
    index: fIndex,
    subIndex: subfIndex,
  })
}

/**
 * @description 打开设置文档
 */
const handleOpen = (sendType) => {
  let url
  if (sendType === 1) {
    url = `https://open.feishu.cn/document/ukTMukTMukTM/ucTM5YjL3ETO24yNxkjN`
  } else if (sendType === 3) {
    url = `https://help.aliyun.com/document_detail/112831.html`
  }
  window.open(url, '_blank')
}

const operateWebhookRef = ref()

/**
 * @description 新建webhook地址
 */
const handleoperate = (sendType, sendAddress) => {
  operateWebhookRef.value.open({ sendType, sendAddress })
}

/**
 * @description 添加发送设置
 */
const addSendSetting = () => {
  const sendSetTypeList = state.formData.sendSet.map((item) => item.sendType)
  const filterList = state.sendTypeList.filter(
    (v) => !sendSetTypeList.includes(v)
  )
  state.formData.sendSet.push({
    sendType: filterList[0],
    emailUserId: [],
    sendAddress: '',
  })
}

/**
 * @description 删除发送设置
 */
const delSendSetting = (i) => {
  state.formData.sendSet.splice(i, 1)
}

defineExpose({ state, setData, close, submit })

defineOptions({
  name: 'operateEarlyWarn',
})
</script>
<template>
  <el-form
    :rules="formRules"
    label-position="top"
    ref="formRef"
    :model="state.formData"
    @submit.prevent>
    <el-form-item
      :label="t('dataManagement.earlyWarn.taskName')"
      prop="warnName">
      <CommonInput
        v-model="state.formData.warnName"
        :desc="t('common.pleaseEnter')"
        trimAllSpace
        :prefixSlot="false"
        notTrimSpace
        maxlength="50"
        show-word-limit
        :disabled="disabled" />
    </el-form-item>
    <el-form-item
      :label="t('dataManagement.earlyWarn.timeZone')"
      prop="timeZone"
      required>
      <el-select
        v-model="state.formData.timeZone"
        class="w180"
        @change="resetVerify"
        placeholder="Select"
        :disabled="disabled">
        <el-option label="UTC+8" value="8" />
      </el-select>
    </el-form-item>
    <el-form-item :label="t('analysis.analysisIndicators')" required>
      <AnalysisIndexItem
        index="event"
        :class="[
          'analysis_item',
          'nd-condition',
          'p10',
          disabled ? 'nd-condition-disabled' : '',
        ]"
        v-model:formula="state.code"
        v-model:event-data="state.event.events"
        v-model:event-fields="state.event.eventFields"
        v-model:event-filters="state.event.eventFilters"
        :eventFieldsList="state.event.eventFieldsData"
        :fieldsList="state.event.fieldsList"
        :customizable="state.event.customizable"
        @addFilter="addFilter"
        @deleteFilter="deleteFilter"
        @eventChange="eventChange"
        @customEventChange="customEventChange"
        :disabled="disabled">
        <ActionBtn
          v-if="!disabled"
          icon="funnel-filter"
          :label="t('common.addConditions')"
          class="ltv-btn"
          @click="addFilter('event')" />
        <ActionBtn
          v-if="!disabled"
          icon="custom-index"
          :label="t('analysis.switchCustomIndicators')"
          class="ltv-btn"
          @click="changeCustom('event')" />
      </AnalysisIndexItem>
    </el-form-item>
    <el-form-item
      :label="t('dataManagement.earlyWarn.calculationCycle')"
      prop="timeParticle"
      :required="true">
      <el-radio-group
        v-model="state.formData.timeParticle"
        @change="timeParticleChange"
        :disabled="disabled">
        <el-radio-button
          label="hour"
          value="hour"
          v-if="
            (disabled && state.formData.timeParticle === 'hour') || !disabled
          ">
          {{ t('common.byHour') }}
        </el-radio-button>
        <el-radio-button
          label="day"
          value="day"
          v-if="
            (disabled && state.formData.timeParticle === 'day') || !disabled
          "
          >{{ t('common.byDay') }}
        </el-radio-button>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      :label="t('dataManagement.earlyWarn.earlyWarningRules')"
      prop="cycle"
      :required="true">
      <div class="flex-center gap10">
        <el-select
          v-if="state.formData.timeParticle === 'hour'"
          v-model="state.formData.cycle"
          style="width: 146px"
          @change="resetVerify"
          placeholder="Select"
          :disabled="disabled">
          <el-option
            v-for="item in state.compareHourList"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
        <el-select
          v-else
          @change="resetVerify"
          v-model="state.formData.cycle"
          style="width: 146px"
          placeholder="Select"
          :disabled="disabled">
          <el-option
            v-for="item in state.compareDayList"
            :key="item.value"
            :label="item.label"
            :value="item.value" />
        </el-select>
        <CommonInput
          v-if="[3].includes(state.formData.cycle)"
          v-model="state.formData.fixedVal"
          :desc="t('common.pleaseEnter')"
          trimAllSpace
          @change="resetVerify"
          :prefixSlot="false"
          notTrimSpace
          style="width: 146px"
          @input="(val) => handleInput(val, 'fixedVal')"
          :disabled="disabled" />
        <el-select
          v-if="[1, 2, 3, 5].includes(state.formData.cycle)"
          v-model="state.formData.compare"
          style="width: 74px"
          @change="resetVerify"
          placeholder="Select"
          :disabled="disabled">
          <el-option :label="t('dataManagement.earlyWarn.high')" :value="1" />
          <el-option :label="t('dataManagement.earlyWarn.low')" :value="2" />
        </el-select>
        <template v-if="[1, 2, 5].includes(state.formData.cycle)">
          <CommonInput
            v-model="state.formData.value"
            :desc="t('common.pleaseEnter')"
            trimAllSpace
            :prefixSlot="false"
            notTrimSpace
            style="width: 146px"
            @change="resetVerify"
            @input="(val) => handleInput(val, 'value')"
            :disabled="disabled">
            <template #suffix>
              <i v-show="state.formData.compareType === 2">%</i>
            </template>
          </CommonInput>
          <el-select
            v-model="state.formData.compareType"
            style="width: 140px"
            @change="resetVerify"
            placeholder="Select"
            :disabled="disabled">
            <el-option :label="t('dataManagement.numeral')" :value="1" />
            <el-option
              v-if="state.formData.cycle !== 3"
              :label="t('dataManagement.percentage')"
              :value="2" />
          </el-select>
        </template>
        <template v-if="[4].includes(state.formData.cycle)">
          <CommonInput
            v-model="state.formData.before"
            :desc="t('common.pleaseEnter')"
            trimAllSpace
            :prefixSlot="false"
            notTrimSpace
            style="width: 146px"
            @change="resetVerify"
            @input="(val) => handleInput(val, 'before')"
            :disabled="disabled" />
          <span>{{ t('common.to') }}</span>
          <CommonInput
            v-model="state.formData.after"
            :desc="t('common.pleaseEnter')"
            trimAllSpace
            :prefixSlot="false"
            notTrimSpace
            @change="resetVerify"
            style="width: 146px"
            @input="(val) => handleInput(val, 'after')"
            :disabled="disabled" />
        </template>
      </div>
    </el-form-item>
    <el-form-item
      :label="t('dataManagement.earlyWarn.sendSettings')"
      prop="sendSet"
      required>
      <div
        v-for="(item, index) in state.formData.sendSet"
        :key="index"
        class="w100-percentage">
        <div class="mb10">
          <div class="flex gap10">
            <el-select
              v-model="item.sendType"
              :placeholder="t('common.pleaseSelect')"
              style="width: 146px"
              :disabled="disabled">
              <el-option
                :label="t('dataManagement.earlyWarn.lark')"
                :value="1"
                :disabled="
                  state.formData.sendSet.some((v) => v.sendType === 1)
                " />
              <el-option
                :label="t('dataManagement.earlyWarn.dingTalk')"
                :value="3"
                :disabled="
                  state.formData.sendSet.some((v) => v.sendType === 3)
                " />
              <el-option
                :label="t('dataManagement.earlyWarn.email')"
                :value="4"
                :disabled="
                  state.formData.sendSet.some((v) => v.sendType === 4)
                " />
            </el-select>
            <el-select
              v-if="[1, 3].includes(item.sendType)"
              v-model="item.sendAddress"
              style="flex: 1"
              :placeholder="
                t('dataManagement.earlyWarn.enterDynamicWebhook', {
                  type:
                    item.sendType === 1
                      ? t('dataManagement.earlyWarn.lark')
                      : t('dataManagement.earlyWarn.dingTalk'),
                })
              "
              filterable
              allow-create
              default-first-option
              clearable
              @visible-change="
                (bool) => sendAddressVisibleChange(bool, item.sendType)
              "
              :disabled="disabled">
              <el-option
                v-for="(v, i) in item.sendType === 1
                  ? state.addressfsList
                  : state.addressddList"
                :key="i"
                :label="v.addressUrl"
                :value="v.addressUrl"
                style="height: 42px; padding-right: 10px">
                <div class="w100-percentage">
                  <div class="fz14 line-h-1-dot-5 flex flex-between c545e6e">
                    <div>
                      {{ v.addressName }}
                    </div>
                    <el-button
                      class="p0 m0"
                      text
                      @click.stop="
                        handledelAddressUrl(v.addressName, v.addressId)
                      ">
                      <SvgIcon class="fz12" name="delete1" />
                    </el-button>
                  </div>
                  <div v-showTips class="fz12 line-h-1-dot-5 c86919d w270">
                    {{ v.addressUrl }}
                  </div>
                </div>
              </el-option>
            </el-select>
            <el-select
              v-else
              v-model="item.emailUserId"
              style="flex: 1"
              multiple
              filterable
              :reserve-keyword="false"
              :placeholder="t('dataManagement.earlyWarn.selectMembers')"
              @visible-change="getProjectUser"
              :disabled="disabled">
              <el-option
                v-for="(v, i) in state.emailList"
                :key="i"
                :label="v.userName"
                :value="v.userId"
                :disabled="v.checkEmail === '1' || [1, 4].includes(v.status)"
                style="height: 42px; padding-right: 10px">
                <div class="w100-percentage">
                  <div class="fz14 line-h-1-dot-5 c545e6e">
                    {{ v.userName }}
                  </div>
                  <div class="fz12 line-h-1-dot-5 flex flex-between c86919d">
                    <span>{{
                      v.email || t('dataManagement.earlyWarn.notFilledIn')
                    }}</span
                    ><span>{{
                      v.checkEmail === '1'
                        ? t('dataManagement.earlyWarn.personalSettings')
                        : ''
                    }}</span>
                  </div>
                </div>
              </el-option>
            </el-select>
            <div class="flex gap14">
              <el-button
                v-if="[1, 3].includes(item.sendType) && !disabled"
                class="p0 m0 nd-operate-btn-active fz28 svg86919d"
                text
                @click="testSendSetting(item)"
                :disabled="state.testSend">
                <Tooltip>
                  <SvgIcon class="fz20" name="send-data" />
                  <template #content>
                    {{ t('dataManagement.earlyWarn.sendTestData') }}
                  </template>
                </Tooltip>
              </el-button>
              <el-button
                v-if="!disabled"
                :disabled="!(state.formData.sendSet.length > 1)"
                class="p0 m0 nd-operate-btn-active fz28 svg86919d"
                text
                @click="delSendSetting(index)">
                <Tooltip>
                  <SvgIcon class="fz14" name="delete1" />
                  <template #content>
                    {{ t('dataManagement.earlyWarn.deleteParameters') }}
                  </template>
                </Tooltip>
              </el-button>
            </div>
          </div>
          <div
            v-if="[1, 3].includes(item.sendType) && !disabled"
            class="flex"
            style="margin-left: 160px; flex-wrap: wrap">
            <el-button type="primary" text @click="handleOpen(item.sendType)">
              {{ t('dataManagement.earlyWarn.obtainWebhook') }}
            </el-button>
            <el-button
              type="primary"
              text
              @click="handleoperate(item.sendType, item.sendAddress)">
              {{
                t('dataManagement.earlyWarn.saveWebhookAddress', {
                  type:
                    item.sendType === 1
                      ? t('dataManagement.earlyWarn.lark')
                      : t('dataManagement.earlyWarn.dingTalk'),
                })
              }}
              <!-- 保存{{ item.sendType === 1 ? '飞书' : '钉钉' }}webhook地址 -->
            </el-button>
          </div>
        </div>
      </div>
      <el-button
        v-if="
          state.formData.sendSet.length < state.sendTypeList.length && !disabled
        "
        text
        type="primary"
        @click="addSendSetting()">
        +{{ t('dataManagement.earlyWarn.addNewNotice') }}
      </el-button>
    </el-form-item>
  </el-form>
  <operateWebhook ref="operateWebhookRef"></operateWebhook>
</template>
<style lang="scss" scoped></style>
