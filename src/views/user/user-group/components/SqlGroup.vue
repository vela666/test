<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="`${state.formData.id ? $t('user.userGroup.editSqlGroup') : $t('user.userGroup.addSqlGroup')}`"
    size="900px">
    <el-form
      label-position="top"
      ref="formRef"
      :rules="rules"
      :model="state.formData">
      <DisplayNameRemark
        :id="state.formData.id"
        v-model:name="state.formData.name"
        v-model:displayName="state.formData.displayName"
        v-model:remark="state.formData.remark" />
      <el-form-item prop="clusterSql">
        <template #label>
          {{ $t('common.SqlInputBox') }}
          <span class="c86919d ml20">
            {{ $t('user.userGroup.sqlGroupMsg') }}
          </span>
        </template>
        <AceEditor
          type="3"
          @change="sqlChange"
          v-model="state.formData.clusterSql"
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
            {{ row[item.prop] }}
          </template>
        </el-table-column>
      </el-table>
      <UpdateWay
        v-model:refreshType="state.formData.refreshType"
        v-model:switch="state.formData.excludeSegmentationToggle"
        v-model:accumulation="state.formData.accumulation"
        v-model:day="state.formData.excludeSegmentationDay" />
      <DefaultGroup
        v-model:defaultCluster="state.formData.defaultCluster"
        v-model:belongCluster="state.formData.belongCluster"
        v-model:analyseId="state.formData.analyseId" />
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import DisplayNameRemark from '@/views/user/components/DisplayNameRemark.vue'
import UpdateWay from '@/views/user/components/UpdateWay.vue'
import DefaultGroup from './DefaultGroup.vue'

import { asyncCheckUserGroupAndTagSql } from '@/api/modules/common'
import {
  asyncAddGroup,
  asyncEditGroup,
  asyncGetByIdGroupInfo,
  asyncRefreshGroupData,
} from '@/api/modules/user-group'
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
      clusterSql: '',
      name: groupName(),
      displayName: displayName(),
      remark: '',
      // qp: {},
      createType: 8,

      // 0 手动更新 1自动更新
      refreshType: 0,
      // 0覆盖 1增量
      accumulation: 0,

      excludeSegmentationToggle: false,
      excludeSegmentationDay: 30,
      type: 0,
      // 是否是默认分群 0 否 1是
      defaultCluster: 0,
      // 是否属于分群 0 否 1是
      belongCluster: 0,
      // 分析模型
      analyseId: [],
    },
  }
}
const trigger = ['blur', 'change']

const rules = {
  clusterSql: [
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
    if (item === 'fid') {
      p.push({
        label: item,
        prop: item,
      })
    }
    return p
  }, [])
})
const sqlChange = (val) => {
  state.tableData = []
  state.checkSql = false
}
const validateSQL = async () => {
  console.log('validateSQL')
  // state.checkSql = false
  state.sqlLoading = true
  const { data } = await asyncCheckUserGroupAndTagSql({
    createType: state.formData.createType,
    sqlExpression: state.formData.clusterSql,
  }).finally((_) => {
    state.sqlLoading = false
  })
  state.tableData = data.sqlValidDataList || []
  ElMessage.success(t('user.SqlVerificationSuccessful'))
  state.checkSql = true
  formRef.value.validateField('clusterSql')
}

const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const defaultCluster = state.formData.defaultCluster === 1
    const params = {
      ...state.formData,
      qp: JSON.stringify({}),
      belongCluster: defaultCluster ? state.formData.belongCluster : 0,
      analyseId: defaultCluster ? state.formData.analyseId.join(',') : '',
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
      const fn = bool ? asyncEditGroup : asyncAddGroup
      const { data } = await fn(params)
      await asyncRefreshGroupData(bool ? state.formData.id : data).finally(
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

const getByIdGroupInfo = async (params) => {
  state.operateLoading = true
  const { data } = await asyncGetByIdGroupInfo(params.id).finally((_) => {
    state.operateLoading = false
  })
  Object.keys(data).forEach((k) => {
    if (Reflect.has(state.formData, k)) {
      if (k === 'analyseId') {
        state.formData[k] = data[k] ? data[k].split(',') : []
      } else {
        state.formData[k] = data[k]
      }
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
    await getByIdGroupInfo(data)
    state.checkSql = true
  }
  console.log(state)
}

defineExpose({
  open,
})
defineOptions({
  name: 'SqlGroup',
})
</script>

<style scoped lang="scss"></style>
