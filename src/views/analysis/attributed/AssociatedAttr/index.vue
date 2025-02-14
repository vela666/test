<template>
  <DefineTemplate v-slot="{ operation = true }">
    <div
      :class="{ 'nd-condition-disabled c-default': !operation }"
      class="nd-popover-associated-content"
      v-loading="state.operateLoading1 || state.operateLoading2">
      <template v-if="operation">
        <div class="txt-bold">
          {{ t('analysis.attributed.setAssociatedAttributes') }}
        </div>
        <div class="flex-center gap5">
          {{ t('analysis.attributed.enableAssociatedAttributes') }}
          <el-switch v-model="state.propSelectData.associatedAttributeStatus" />
        </div>
      </template>
      <i18n-t
        keypath="analysis.attributed.attributeRelation"
        tag="div"
        class="c545e6e flex-center flex-warp gap5">
        <template #attributedName>
          <span class="mr3">{{ state.propSelectData.eventNameZh }} </span>
        </template>
        <template #attributedData>
          <PropSelect
            className="ml3"
            :list="state.attributedPropSelectData"
            v-model="state.attributedData"
            :limit="attrLimit" />
        </template>
        <template #targetData>
          <PropSelect
            className="ml3"
            :list="state.targetPropSelectData"
            v-model="state.targetData"
            :limit="attrLimit" />
        </template>
      </i18n-t>
      <div v-if="operation" class="text-align-right mt5">
        <el-button text class="skip" @click="close">
          {{ t('btn.cancel') }}
        </el-button>
        <el-button @click="submit" type="primary">
          {{ t('btn.confirm') }}
        </el-button>
      </div>
    </div>
  </DefineTemplate>

  <el-popover
    v-if="state.visible || !selectData.associatedAttributeStatus"
    :visible="state.visible"
    @before-enter="show"
    :show-arrow="false"
    width="600"
    :hide-after="0"
    :show-after="0"
    placement="top-end"
    popper-class="nd-popover-associated-attr"
    trigger="click"
    :offset="4">
    <template #reference>
      <span>
        <Tooltip :showTips="!state.visible">
          <div
            @click="state.visible = true"
            :class="['analysis-icon__btn analysis-item-btn fz18', setCls()]">
            <SvgIcon name="link1" />
          </div>
          <template #content>{{
            t('analysis.attributed.setAssociatedAttributes')
          }}</template>
        </Tooltip>
      </span>
    </template>
    <ReuseTemplate />
  </el-popover>

  <el-popover
    v-else
    :show-arrow="false"
    width="600"
    :hide-after="0"
    :show-after="0"
    placement="top-end"
    popper-class="nd-popover-associated-attr"
    trigger="hover"
    :offset="4">
    <template #reference>
      <div
        @click="state.visible = true"
        :class="['analysis-icon__btn analysis-item-btn fz18', setCls()]">
        <SvgIcon name="link1" />
      </div>
    </template>
    <ReuseTemplate :operation="false" />
  </el-popover>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { cloneDeep, isEmpty, uniqBy } from 'lodash-es'
import { getFieldList } from '@/api/modules/analysis/common'
import { useI18n } from 'vue-i18n'
import { getTableType } from '@/utils/dataProcessing.js'
import { createReusableTemplate } from '@vueuse/core'

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

const attrLimit = ['eventField']

const props = defineProps({
  targetEventId: {
    type: [Number, String],
    default: '',
  },
})
const emit = defineEmits(['getData'])
const selectData = defineModel()

const { t } = useI18n()
let appDom = document.getElementById('app')

const initVal = () => {
  return {
    visible: false,
    operateLoading1: false,
    operateLoading2: false,
    attributedData: {},
    attributedPropSelectData: {
      eventField: [],
    },
    targetPropSelectData: {
      eventField: [],
    },
    targetData: {},
    propSelectData: {
      associatedAttributeStatus: false,
    },
  }
}
const state = reactive(initVal())

const isError = computed(() => {
  return (
    state.attributedData?.permissionStatus === false ||
    state.targetData?.permissionStatus === false
  )
})

// 处理分群规则数据
const mapData = (key, valKey) => {
  const [attributed, target] = cloneDeep(
    selectData.value.associatedAttributeData
  )
  if (attributed && target) {
    state.attributedData = {
      ...attributed,
      permissionStatus: state.attributedPropSelectData.eventField.some(
        (v) => v.fEn === attributed.fEn
      ),
    }
    state.targetData = {
      ...target,
      permissionStatus: state.targetPropSelectData.eventField.some(
        (v) => v.fEn === target.fEn
      ),
    }
  } else if (key) {
    const tmp = state[key]?.eventField?.[0] || {}
    state[valKey] = {
      ...tmp,
      tableType: getTableType('eventField', tmp),
    }
  }
}

const show = () => {
  mapData()
  state.propSelectData = cloneDeep(selectData.value)
  appDom?.classList?.add('prevent-no')
}

const close = () => {
  state.visible = false
  appDom?.classList?.remove('prevent-no')
}

const getResult = () => {
  return new Promise((resolve, reject) => {
    const empty = isEmpty(state.attributedData) || isEmpty(state.targetData)
    if (
      state.propSelectData.associatedAttributeStatus &&
      (empty || isError.value)
    ) {
      reject(t('analysis.attributed.selectValidAssociatedAttribute'))
      return
    }
    resolve({
      joinOn: [
        {
          parentId: state.attributedData.fieldId,
          propertyName: state.attributedData.fEn,
          propertyType: state.attributedData.fType,
          propertyNameDisplay: state.attributedData.fZh,
          tableType: state.attributedData.tableType,
        },
        {
          parentId: state.targetData.fieldId,
          propertyName: state.targetData.fEn,
          propertyType: state.targetData.fType,
          propertyNameDisplay: state.targetData.fZh,
          tableType: state.targetData.tableType,
        },
      ],
      raw: [
        {
          fieldId: state.attributedData.fieldId,
          tableType: state.attributedData.tableType,
          fEn: state.attributedData.fEn,
          fType: state.attributedData.fType,
          fZh: state.attributedData.fZh,
          name: state.attributedData.fZh,
        },
        {
          fieldId: state.targetData.fieldId,
          tableType: state.targetData.tableType,
          fEn: state.targetData.fEn,
          fType: state.targetData.fType,
          fZh: state.targetData.fZh,
          name: state.targetData.fZh,
        },
      ],
    })
  })
}

const submit = async () => {
  try {
    const { joinOn, raw } = await getResult()
    selectData.value.joinOn = state.propSelectData.associatedAttributeStatus
      ? joinOn
      : []
    selectData.value.associatedAttributeData = raw
    selectData.value.associatedAttributeStatus =
      state.propSelectData.associatedAttributeStatus
    close()
  } catch (err) {
    ElMessage.warning(err)
  }
}

// 获取对应事件的事件属性和用户属性、用户分群、用户标签
const asyncGetFieldList = async (
  eventIds,
  key = 'attributedPropSelectData'
) => {
  const isAttributed = key === 'attributedPropSelectData'
  const mapKey = {
    loadingKey: isAttributed ? 'operateLoading1' : 'operateLoading2',
    valKey: isAttributed ? 'attributedData' : 'targetData',
  }

  state[mapKey.loadingKey] = true
  const { data } = await getFieldList({
    eventIds,
  }).finally((_) => {
    state[mapKey.loadingKey] = false
  })
  state[key] = data
  mapData(key, mapKey.valKey)
}

const setCls = () => {
  let temp = []
  if (!state.visible) {
    temp.push('alias-edit__icon')
  }

  if (selectData.value.associatedAttributeStatus) {
    temp = temp.filter((item) => item !== 'alias-edit__icon')
    temp.push('analysis-icon__btn-hover')
  }

  if (selectData.value.associatedAttributeStatus && isError.value) {
    temp = temp.filter((item) => item !== 'analysis-icon__btn-hover')
    temp.push('nd-associated-attr-error')
  }

  return uniqBy(temp).join(' ')
}

watch(
  selectData,
  (val) => {
    state.propSelectData = cloneDeep(val)
  },
  {
    immediate: true,
  }
)

watch(
  () => selectData.value.events.eventId,
  (val) => {
    asyncGetFieldList(val, 'attributedPropSelectData')
  },
  {
    immediate: true,
  }
)

watch(
  () => props.targetEventId,
  (val) => {
    asyncGetFieldList(val, 'targetPropSelectData')
  },
  {
    immediate: true,
  }
)
defineOptions({
  name: 'AssociatedAttr',
})
</script>

<style lang="scss">
.el-popper.nd-popover-associated-attr {
  //pointer-events: auto;
  padding: 0;
  border-radius: var(--eas-border-radius-4);
  background: #ffffff;
  border: 1px solid #e7e7ea;
  color: var(--eas-text-color-light);
  box-shadow: 0px 3px 10px 0px rgba(28, 32, 40, 0.18);
}
</style>
<style lang="scss" scoped>
.nd-popover-associated-content {
  padding: 10px;
}
.nd-associated-attr-error {
  border: 1px solid var(--eas-message-error-text-color);
  border-radius: var(--eas-border-radius-4);
}
</style>
