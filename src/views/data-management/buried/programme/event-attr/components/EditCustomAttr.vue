<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    size="600px"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('btn.edit')">
    <el-form
      :rules="formRules"
      label-position="top"
      ref="formRef"
      :model="state.formData">
      <el-form-item :label="$t('dataManagement.attributeName')" prop="fEn">
        <CommonInput
          :prefixSlot="false"
          show-word-limit
          maxlength="50"
          trimAllSpace
          v-model="state.formData.fEn" />
      </el-form-item>
      <el-form-item prop="fZh" :label="$t('dataManagement.displayName')">
        <CommonInput
          :prefixSlot="false"
          show-word-limit
          :desc="$t('common.pleaseEnter')"
          maxlength="50"
          v-model="state.formData.fZh" />
      </el-form-item>
      <div class="flex-center flex-between gap20">
        <el-form-item
          :label="$t('dataManagement.dataType')"
          prop="newFtype"
          class="w100-percentage">
          <el-select v-model="state.formData.newFtype">
            <el-option
              v-for="(label, value) of filteNotDisplayrDataTypeMap"
              :key="value"
              :value="value"
              :label="label">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item
          :label="$t('dataManagement.unit')"
          class="w100-percentage">
          <CommonInput
            :prefixSlot="false"
            maxlength="20"
            show-word-limit
            :desc="$t('common.pleaseEnter')"
            v-model="state.formData.fUnit" />
        </el-form-item>
      </div>

      <el-form-item :label="$t('common.description')">
        <CommonInput
          :prefixSlot="false"
          maxlength="200"
          show-word-limit
          :desc="$t('common.pleaseEnter')"
          :rows="7"
          type="textarea"
          resize="none"
          v-model="state.formData.fDesc" />
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { filteNotDisplayrDataTypeMap } from '@/enumeration/data-management/event-attr'
import { asyncUpdateField } from '@/api/modules/programme/common.js'
import { validIdentifierRegex1 } from '@/utils/validate'
import { t } from '@/locales/i18n'

const props = defineProps({
  // 1是事件属性 2是用户属性
  type: {
    type: String,
    default: '1',
  },
})

const initVal = () => {
  return {
    columns: [],
    operateLoading: false,
    showOperate: false,
    formData: {
      fId: '',
      // fType: '',
      fEn: '',
      fZh: '',
      fDesc: '',
      newFtype: '',
      // fLen: '',
      // fType: '',
      fUnit: '',
    },
  }
}
const trigger = ['blur', 'change']
const formRules = {
  fZh: [
    {
      required: true,
      message: t('common.pleaseEnter'),
      trigger,
    },
  ],
  fEn: [
    {
      required: true,
      message: t('dataManagement.attrNameRules'),
      trigger,
    },
    {
      validator: (rule, value, callback) => {
        const val = value + ''
        if (val.length > 50) {
          callback(new Error(t('dataManagement.upToCharacters', [50])))
          return
        }
        if (!validIdentifierRegex1(val)) {
          callback(new Error(t('dataManagement.attrNameRules')))
          return
        }

        callback()
      },
      trigger,
    },
  ],
  newFtype: [
    {
      required: true,
      message: t('common.pleaseSelect'),
      trigger,
    },
  ],
}

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const formRef = ref(null)

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const [fType, fLen = ''] = state.formData.newFtype.split('_')
    state.operateLoading = true
    await asyncUpdateField({
      ...state.formData,
      fType,
      fLen,
    }).finally((_) => {
      state.showOperate = false
    })
    ElMessage.success(t('common.editedSuccessfully'))
    emit('getData')
  })
}

const open = (data) => {
  state.showOperate = true
  Object.keys(state.formData).forEach((k) => {
    state.formData[k] = data[k]
  })
  // 没发布 且 没有该类型 移除老数据不存在的类型
  if (data.fSync === 0 && !filteNotDisplayrDataTypeMap[data.newFtype]) {
    state.formData.newFtype = ''
  }
}

defineExpose({
  open,
})
defineOptions({
  name: 'EditCustomAttr',
})
</script>
