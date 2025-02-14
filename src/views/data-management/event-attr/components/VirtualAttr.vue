<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    size="600px"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="`${state.formData.fId ? $t('dataManagement.eventAttr.editVirtualAttributes') : $t('dataManagement.eventAttr.addVirtualAttributes')}`">
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
          :disabled="!!state.formData.fId"
          v-model="state.formData.fEn" />
      </el-form-item>
      <el-form-item prop="fZh" :label="$t('dataManagement.displayName')">
        <CommonInput
          :prefixSlot="false"
          trimAllSpace
          show-word-limit
          maxlength="50"
          v-model="state.formData.fZh" />
      </el-form-item>
      <div class="flex-center flex-between gap20">
        <el-form-item
          :label="$t('dataManagement.dataType')"
          prop="fType"
          class="w100-percentage">
          <el-select
            v-model="state.formData.fType"
            :disabled="!!state.formData.fId">
            <el-option
              v-for="item of virtualTypeList"
              :key="item.type"
              :value="item.type"
              :label="item.label" />
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
          :rows="3"
          type="textarea"
          resize="none"
          v-model="state.formData.fDesc" />
      </el-form-item>
      <el-form-item :label="$t('common.SqlInputBox')" prop="sql">
        <div
          class="c1c2028 fz12 p10 mb10 w100-percentage line-h-1-dot-5"
          style="background-color: var(--eas-color-primary-light-1)"
          v-html="
            $t('dataManagement.eventAttr.sqlContentTips').replace(
              /\n/g,
              '<br />'
            )
          "></div>
        <!-- <p>SQL表达式中必须以:</p>
          <p>event.xxx 表示事件表，users.xxx表示用户表</p>
          <p>
            dim1_属性名.xxx表示事件属性维度表，dim2_属性名.xxx表示用户属性维度表
          </p> -->
        <AceEditor
          type="2"
          @change="editorChange"
          v-model="state.formData.sql"
          @validateSQL="validateSQL"
          :loading="state.sqlLoading"
          toolbar
          :verifyBtnDisabled="!(state.formData.sql && state.formData.fType)"
          ref="aceEditorRef" />
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { virtualTypeList } from '@/enumeration/data-management/event-attr'
import {
  asyncSaveVirtual,
  asyncVerifySql,
} from '@/api/modules/data-management/common'
import { validIdentifierRegex1 } from '@/utils/validate'
import { recordBehavior } from '@/utils/record-behavior.js'
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
    operateLoading: false,
    showOperate: false,
    sqlLoading: false,
    formData: {
      fId: '',
      fEn: '',
      fZh: '',
      fDesc: '',
      fLen: '',
      fType: '',
      sql: '',
      fUnit: '',
      presetValue: '',
      showPreset: '',
      fSync: '',
      // 验证sql后返回的数据
      referField: '',
      // 新增事件是否绑定此虚拟属性：1 否， 2 是
      applyAll: 1,
      // 虚拟属性表类型 1 事件表 2 用户表
      tableType: +props.type,
    },
  }
}
const trigger = ['blur', 'change']
const formRules = {
  fEn: [
    {
      required: true,
      message: t('dataManagement.attrNameRules'),
      trigger,
    },
    {
      validator: (rule, value, callback) => {
        const val = value + ''
        if (!validIdentifierRegex1(val)) {
          callback(new Error(t('dataManagement.attrNameRules')))
          return
        }
        callback()
      },
      trigger,
    },
  ],
  fZh: [
    {
      required: true,
      message: t('common.pleaseEnter'),
      trigger,
    },
  ],
  sql: [
    {
      required: true,
      message: t('common.pleaseEnter'),
      trigger,
    },
  ],
  fType: [
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

const validateSQL = async () => {
  state.formData.referField = ''
  state.sqlLoading = true
  const { data } = await asyncVerifySql({
    sql: state.formData.sql,
    tableType: +props.type,
    type: state.formData.fType,
  }).finally((_) => {
    state.sqlLoading = false
  })
  ElMessage.success(t('user.SqlVerificationSuccessful'))
  state.formData.referField = data
}

const editorChange = () => {
  state.formData.referField = ''
}

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  if (!state.formData.referField) {
    ElMessage.warning(t('dataManagement.validSql'))
    return
  }
  formRef.value.validate(async (valid) => {
    if (!valid) return
    if (!state.formData.fId) {
      recordBehavior({
        moduleName: '数据管理',
        submoduleName: +props.type === 1 ? '事件属性' : '用户属性',
        operate: '新增虚拟属性',
      })
    }

    state.operateLoading = true
    await asyncSaveVirtual(state.formData).finally((_) => {
      state.operateLoading = false
    })
    state.showOperate = false
    ElMessage.success(
      `${state.formData.fId ? t('common.editedSuccessfully') : t('common.addedSuccessfully')}`
    )
    emit('getData')
  })
}

const open = (data) => {
  state.showOperate = true
  if (data.fId) {
    Object.keys(state.formData).forEach((k) => {
      if (Reflect.has(data, k)) state.formData[k] = data[k]
    })

    try {
      const paramFiled = JSON.parse(data.paramFiled)
      state.formData.referField = paramFiled.table
        ? JSON.stringify(paramFiled.table)
        : ''
    } catch (e) {
      console.log(e)
    }
  }
}

defineExpose({
  open,
})
defineOptions({
  name: 'EditCustomAttr',
})
</script>
