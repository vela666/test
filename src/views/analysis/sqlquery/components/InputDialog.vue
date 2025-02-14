<script setup>
import { cloneDeep } from 'lodash-es'
import { ref, reactive, computed, watch } from 'vue'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: t('analysis.sqlquery.favoriteStatements'),
  },
  inputName: {
    type: String,
    default: t('analysis.sqlquery.favoriteName'),
  },
  name: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: true,
  },
  // 新建异步
  addAsync: {
    type: Boolean,
    default: false,
  },
})

const state = reactive({
  formData: {
    name: '',
  },
})

const dialogVisible = computed({
  get: () => {
    return props.modelValue
  },
  set: (val) => {
    emit('update:modelValue', val)
  },
})

watch(
  () => props.name,
  (newVal) => {
    if (newVal) {
      state.formData.name = newVal
    } else {
      state.formData.name = ''
    }
  }
)

const rules = reactive({
  name: [
    {
      required: props.required,
      message: t('analysis.sqlquery.inputNotEmpty', [props.inputName]),
      trigger: 'blur',
    },
  ],
})

const emit = defineEmits(['update:modelValue', 'getName'])

const form = ref()

/**
 * @description 关闭弹框
 */
const handleDialogClose = () => {
  form.value.resetFields()
  dialogVisible.value = false
}

/**
 * @description 确定
 */
const handleDialogSubmit = () => {
  form.value.validate((valid) => {
    if (valid) {
      if (props.addAsync) {
        recordBehavior({
          moduleName: '分析',
          submoduleName: 'SQL查询',
          operate: '异步查询',
        })
      }
      const list = cloneDeep(state.formData)
      emit('getName', list.name)
      handleDialogClose()
    }
  })
}

defineOptions({
  name: 'InputDialog',
})
</script>
<template>
  <CommonDialog
    v-model="dialogVisible"
    :width="550"
    :title="props.title"
    :show-close="true"
    :need-footer="true"
    @submit="handleDialogSubmit"
    @close="handleDialogClose">
    <template #default>
      <el-form
        label-position="top"
        ref="form"
        :model="state.formData"
        :rules="rules">
        <el-form-item :label="props.inputName" prop="name">
          <CommonInput
            v-model="state.formData.name"
            :prefixSlot="false"
            :maxlength="50"
            show-word-limit
            :placeholder="
              $t('analysis.sqlquery.enterDynamicName', [props.inputName])
            " />
        </el-form-item>
      </el-form>
    </template>
  </CommonDialog>
</template>
<style lang="scss" scoped></style>
