<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="`${state.formData.id ? $t('user.userGroup.editConditionGroup') : $t('user.userGroup.addConditionGroup')}`"
    size="900px">
    <el-form label-position="top" ref="formRef" :model="state.formData">
      <DisplayNameRemark
        :id="state.formData.id"
        v-model:name="state.formData.name"
        v-model:displayName="state.formData.displayName"
        v-model:remark="state.formData.remark" />
      <el-form-item :label="$t('user.userGroup.groupRule')" prop="name">
        <Condition :groupDefine="state.formData.qp" ref="conditionRef" />
      </el-form-item>

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
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import UpdateWay from '@/views/user/components/UpdateWay.vue'
import DefaultGroup from './DefaultGroup.vue'
import DisplayNameRemark from '@/views/user/components/DisplayNameRemark.vue'
import Condition from '@/views/user/components/Condition/index.vue'
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
    formData: {
      id: '',
      name: groupName(),
      displayName: displayName(),
      remark: '',
      qp: {},
      createType: 1,

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
let isSaveAs = false
const emit = defineEmits(['getData'])
const state = reactive(initVal())
const formRef = ref(null)
const conditionRef = ref(null)

const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      const defaultCluster = state.formData.defaultCluster === 1
      const params = {
        ...state.formData,
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
        const val = await conditionRef.value.getResult()
        if (!val.events.length && !val.users.length) {
          throw t('user.userGroup.groupRuleNoEmpty')
        }
        params.qp = JSON.stringify(val)
      } catch (err) {
        ElMessage.warning(err)
        return
      }
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
      if (k === 'qp') {
        state.formData[k] = JSON.parse(data[k])
      } else if (k === 'analyseId') {
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
  if (data) getByIdGroupInfo(data)
}

defineExpose({
  open,
})
defineOptions({
  name: 'ConditionGroup',
})
</script>

<style scoped lang="scss"></style>
