<script setup>
import { cloneDeep } from 'lodash-es'
import { ref, reactive } from 'vue'
import { t } from '@/locales/i18n'

const props = defineProps({
  list: {
    type: Array,
    default: () => [],
  },
  index: {
    type: Number,
    default: null,
  },
})

const config = {
  form: {
    displayName: '',
    code: '',
    codeNum: null,
    remark: '',
  },
}

const state = reactive(config)

const validateCodeNum = (rule, value, callback) => {
  console.log(props.list, `${state.form.code}${value}`)
  if (value === '') {
    callback(new Error(t('analysis.sqlquery.checkParameterName')))
  } else if (
    props.list.some(
      (item, index) =>
        index !== props.index && item.name === `${state.form.code}${value}`
    )
  ) {
    callback(
      new Error(
        t('analysis.sqlquery.checkParameterNameExists', [
          `${state.form.code}${value}`,
        ])
      )
    )
  } else {
    callback()
  }
}

const rules = reactive({
  displayName: [
    {
      required: true,
      message: t('analysis.sqlquery.checkDisplayName'),
      trigger: 'blur',
    },
  ],
  codeNum: [
    {
      required: true,
      message: t('analysis.sqlquery.checkParameterName'),
      trigger: 'blur',
    },
    { validator: validateCodeNum, trigger: 'blur' },
  ],
})

const commonDropdown = ref(null)
const form = ref(null)

/**
 * @description 打开
 */
const handleOpen = () => {
  commonDropdown.value.handleOpen()
  if (
    props.index !== null &&
    props.index !== undefined &&
    props.list.length &&
    props.list[props.index]
  ) {
    state.form.displayName = props.list[props.index].displayName
    if (props.list[props.index].type !== 'AppId') {
      state.form.code = props.list[props.index].name.split('_')[0] + '_'
      state.form.codeNum = props.list[props.index].name.replace(
        state.form.code,
        ''
      )
    }
    state.form.remark = props.list[props.index].remark
  }
}

/**
 * @description 取消
 */
const handleCancle = () => {
  form.value.resetFields()
  commonDropdown.value.handleClose()
}

const emit = defineEmits(['getParamDate'])

/**
 * @description 提交
 */
const handleSubmit = () => {
  form.value.validate((valid) => {
    if (valid) {
      const list = cloneDeep(state.form)
      emit('getParamDate', list, props.index)
      handleCancle()
    }
  })
}

defineOptions({
  name: 'EditParamDropdown',
})
</script>
<template>
  <CommonDropdown ref="commonDropdown">
    <template #content>
      <el-button
        class="p0 m0 nd-operate-btn-active fz28 svg86919d"
        text
        @click="handleOpen">
        <Tooltip>
          <SvgIcon class="fz14" name="edit" />
          <template #content>
            {{ $t('analysis.sqlquery.editParameter') }}
          </template>
        </Tooltip>
      </el-button>
    </template>
    <template #title>
      <div>{{ $t('analysis.sqlquery.editParameter') }}</div>
    </template>
    <template #container>
      <div>
        <el-form
          label-position="top"
          ref="form"
          :model="state.form"
          :rules="rules">
          <el-form-item
            :label="$t('analysis.sqlquery.displayName')"
            prop="displayName">
            <CommonInput
              v-model="state.form.displayName"
              :prefixSlot="false"
              :maxlength="20"
              show-word-limit
              :placeholder="$t('analysis.sqlquery.enterDisplayName')" />
          </el-form-item>
          <el-form-item v-if="list[index].type !== 'AppId'" prop="codeNum">
            <template #label>
              <span>{{ $t('analysis.sqlquery.parameterName') }}</span>
              <Tooltip>
                <SvgIcon class="fz14 ml3" name="help2" />
                <template #content>
                  {{ $t('analysis.sqlquery.editParameterTips') }}
                </template>
              </Tooltip>
            </template>
            <div class="flex w100-percentage">
              <CommonInput
                class="mr10"
                style="width: 100px"
                v-model="state.form.code"
                :prefixSlot="false"
                disabled />
              <el-input
                v-model="state.form.codeNum"
                :maxlength="20"
                show-word-limit
                :placeholder="$t('analysis.sqlquery.parameterNameSuffix')"
                style="flex: 1" />
            </div>
          </el-form-item>
          <el-form-item :label="$t('common.remark')" prop="remark">
            <CommonInput
              v-model="state.form.remark"
              :prefixSlot="false"
              :rows="3"
              type="textarea"
              :maxlength="50"
              show-word-limit />
          </el-form-item>
        </el-form>
      </div>
    </template>
    <template #buttom>
      <div>
        <el-button text class="skip mr10" @click="handleCancle">
          {{ $t('btn.cancel') }}
        </el-button>
        <el-button type="primary" class="m0" @click="handleSubmit">
          {{ $t('btn.confirm') }}
        </el-button>
      </div>
    </template>
  </CommonDropdown>
</template>
<style lang="scss" scoped></style>
