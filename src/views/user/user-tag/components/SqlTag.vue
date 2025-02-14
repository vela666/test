<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="`${state.formData.id ? $t('user.userTag.editSqlTag') : $t('user.userTag.addSqlTag')}`"
    size="900px">
    <el-form
      label-position="top"
      ref="formRef"
      :rules="rules"
      :model="state.formData">
      <DisplayNameRemark
        :text="$t('user.tag')"
        :id="state.formData.id"
        v-model:name="state.formData.name"
        v-model:displayName="state.formData.displayName"
        v-model:remark="state.formData.remark" />
      <el-form-item :label="$t('user.userTag.tagValueType')" class="w350">
        <el-select
          v-model="state.formData.valueType"
          :placeholder="$t('common.pleaseSelect')"
          @change="state.checkSql = false">
          <el-option
            v-for="item of valueTypeList"
            :key="item.type"
            :label="item.label"
            :value="item.type" />
        </el-select>
      </el-form-item>
      <div
        class="c1c2028 fz12 p10 mb10"
        style="background-color: var(--eas-color-primary-light-1)">
        <p>1、{{ $t('user.userTag.tagAliasMsg') }}</p>
        <p>2、{{ $t('user.userTag.tagMultipleMsg') }}</p>
        <div>
          {{ $t('user.userTag.suggestionMsg') }}
        </div>
      </div>
      <el-form-item prop="tagSql" :label="$t('common.SqlInputBox')">
        <AceEditor
          type="4"
          @change="sqlChange"
          v-model="state.formData.tagSql"
          @validateSQL="validateSQL"
          :loading="state.sqlLoading"
          toolbar
          minLines="7"
          :verifyBtnDisabled="state.checkSql"
          ref="aceEditorRef" />
      </el-form-item>
      <el-table
        v-if="state.checkSql && state.tableData.length"
        class="nd-table-custom mb20"
        :data="state.tableData"
        border
        height="200px">
        <el-table-column
          :label="$t('common.orderNumber')"
          type="index"
          width="60" />
        <el-table-column
          v-for="item of columns"
          :key="item.prop"
          :label="item.label"
          :prop="item.prop"
          :min-width="120">
          <template #default="{ row }">
            {{
              thousandQuantileProcessing(row[item.prop], item.prop !== 'fid')
            }}
          </template>
        </el-table-column>
      </el-table>
      <UpdateWay
        :show="false"
        :text="$t('user.tag')"
        v-model:refreshType="state.formData.refreshType"
        v-model:switch="state.formData.excludeSegmentationToggle"
        v-model:accumulation="state.formData.accumulation"
        v-model:day="state.formData.excludeSegmentationDay" />
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { thousandQuantileProcessing } from '@/utils/dataProcessing'
import DisplayNameRemark from '@/views/user/components/DisplayNameRemark.vue'
import UpdateWay from '@/views/user/components/UpdateWay.vue'
import { valueTypeList } from '@/enumeration/user/user-tag.js'
import { asyncCheckUserGroupAndTagSql } from '@/api/modules/common'

import {
  asyncAddTag,
  asyncEditTag,
  asyncGetByIdTagInfo,
  asyncRefreshTagData,
} from '@/api/modules/user-tag'

import { displayName, groupName } from '@/views/user/enum'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const initVal = () => {
  return {
    operateLoading: false,
    showOperate: false,
    sqlLoading: false,
    tableData: [],
    checkSql: false,
    formData: {
      id: '',
      tagSql: '',
      name: groupName('t'),
      displayName: displayName(t('user.tag')),
      remark: '',
      // qp: {},
      createType: 9,
      valueType: 0,
      // 0 手动更新 1自动更新
      refreshType: 0,
      // 0覆盖 1增量
      accumulation: 0,

      excludeSegmentationToggle: false,
      excludeSegmentationDay: 30,
      type: 1,
    },
  }
}
const trigger = ['blur', 'change']

const rules = {
  tagSql: [
    { required: true, message: t('user.enterSqlAndVerify'), trigger },
    {
      validator: (rule, value, callback) => {
        if (!state.checkSql) {
          return callback(new Error(t('user.verifySql')))
        }
        callback()
      },
    },
  ],
}

const emit = defineEmits(['getData'])
const state = reactive(initVal())
let isSaveAs = false
const formRef = ref(null)
const columns = computed(() => {
  return Object.keys(state.tableData[0] || []).reduce((p, item) => {
    p.push({
      label: item,
      prop: item,
    })
    return p
  }, [])
})
const sqlChange = () => {
  state.tableData = []
  state.checkSql = false
}
const validateSQL = async () => {
  // state.checkSql = false
  state.sqlLoading = true
  const { data } = await asyncCheckUserGroupAndTagSql({
    createType: state.formData.createType,
    sqlExpression: state.formData.tagSql,
    valueType: state.formData.valueType,
  }).finally((_) => {
    state.sqlLoading = false
  })
  state.tableData = data.sqlValidDataList || []
  ElMessage.success(t('user.SqlVerificationSuccessful'))
  state.checkSql = true
  formRef.value.validateField('tagSql')
}

const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const params = {
      ...state.formData,
      qp: JSON.stringify({}),
    }
    const delKey = [
      'excludeSegmentationDay',
      'excludeSegmentationToggle',
      'accumulation',
    ]
    if (params.refreshType === 0) {
      delKey.forEach((k) => {
        Reflect.deleteProperty(params, k)
      })
    }
    if (params.refreshType === 1 && params.accumulation === 0) {
      delKey.slice(0, 2).forEach((k) => {
        Reflect.deleteProperty(params, k)
      })
    }
    if (params.refreshType === 1 && params.accumulation === 1) {
      if (!params.excludeSegmentationToggle) {
        delKey.slice(0, 1).forEach((k) => {
          Reflect.deleteProperty(params, k)
        })
      }
    }
    try {
      state.operateLoading = true
      const bool = Number.isInteger(state.formData.id)
      const fn = bool ? asyncEditTag : asyncAddTag
      const { data } = await fn(params)
      await asyncRefreshTagData(bool ? state.formData.id : data).finally(
        (_) => {
          state.showOperate = false
          emit('getData', isSaveAs)
        }
      )
      ElMessage.success(
        `${bool ? t('common.editedSuccessfully') : t('common.newSuccessfullyAdded')}`
      )
    } catch (e) {
      console.log(e)
    }
    state.operateLoading = false
  })
}

const getByIdTagInfo = async (params) => {
  state.operateLoading = true
  const { data } = await asyncGetByIdTagInfo(params.id).finally((_) => {
    state.operateLoading = false
  })
  Object.keys(data).forEach((k) => {
    if (Reflect.has(state.formData, k)) {
      state.formData[k] = data[k]
    }
  })
  if (params.saveAs) {
    isSaveAs = true
    state.formData.id = ''
    state.formData.name = initVal().formData.name
    state.formData.displayName = initVal().formData.displayName
  }
}
const open = async (data) => {
  state.showOperate = true
  if (data) {
    await getByIdTagInfo(data)
    state.checkSql = true
  }
}

defineExpose({
  open,
})
defineOptions({
  name: 'SqlTag',
})
</script>

<style scoped lang="scss"></style>
