<template>
  <CommonDialog
    v-model="state.dialogVisible"
    :title="`${formData.id ? $t('analysis.editResultGroup') : $t('analysis.createResultGroup')}`"
    @close="handleClosed"
    @submit="handleSubmit"
    :loading="state.submitLoading">
    <el-form ref="formRef" :model="formData" label-position="top">
      <DisplayNameRemark
        :id="formData.id"
        :showName="showName"
        showSwitch
        v-model:name="formData.name"
        v-model:displayName="formData.displayName"
        v-model:remark="formData.remark"
        v-model:addExistCluster="formData.addExistCluster"
        v-model:clusterInfo="formData.clusterInfo" />
    </el-form>
  </CommonDialog>
</template>

<script setup>
import { reactive, ref, inject, toRef } from 'vue'
import { groupName, displayName } from '@/views/user/enum'
import useOperate from '@/components/PropsFilter/useOperate'
import { ElMessage } from 'element-plus'
import { saveResultCluster, editResultCluster } from '@/api/modules/user-detail'
import { asyncRefreshGroupData } from '@/api/modules/user-group'
import DisplayNameRemark from '@/views/user/components/DisplayNameRemark.vue'
import { isObject, omit, cloneDeep, isFunction } from 'lodash-es'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const props = defineProps({
  // 是否显示分群名
  showName: {
    type: Boolean,
    default: false,
  },
  qp: {
    type: [Object, Function],
    default: () => {},
  },
  validateQp: {
    type: Object,
    default: () => {},
  },
  // 是否需要验证qp是否符合
  isValid: {
    type: Boolean,
    default: false,
  },
  // 后端结果分群api接口
  api: {
    type: Function,
    default: null,
  },
  // 用户操作日志描述  数据报表和数据看板
  moduleName: {
    type: String,
    default: '',
  },
  submoduleName: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['getData'])
const appId = toRef(inject('appId', sessionStorage.getItem('appId')))

const { parseFilterData } = useOperate()

const state = reactive({
  dialogVisible: false,
})

const initFormData = () => ({
  id: '',
  name: groupName(),
  displayName: displayName(),
  remark: '',
  addExistCluster: 0,
  clusterInfo: undefined,
})

const formData = reactive(initFormData())

const handleClosed = () => {
  Object.assign(formData, initFormData())
}

const formRef = ref(null)

/**
 * @description: 保存结果分群
 * @return {*}
 */
const handleSubmit = () => {
  formRef.value.validate((valid) => {
    if (valid) {
      if (props.isValid && !formData.id && !parseFilterData(props.validateQp)) {
        ElMessage.warning(t('common.filterConditionErr'))
        return
      }
      if (props.moduleName) {
        recordBehavior({
          moduleName: props.moduleName,
          submoduleName: props.submoduleName || props.moduleName,
          operate: '创建结果分群',
        })
      }
      handleSave()
    }
  })
}

/**
 * @description: 保存结果分群
 * @return {*}
 */
const handleSave = () => {
  let params = {
    displayName: formData.displayName,
    id: formData.id,
    remark: formData.remark,
    type: 0,
    createType: 3,
    addExistCluster: !!formData.addExistCluster,
    ...omit(cloneDeep(formData), [
      'id',
      'displayName',
      'remark',
      'addExistCluster',
      'clusterInfo',
    ]),
    appId: appId.value,
  }

  // 添加到已有分群
  if (formData.addExistCluster) {
    params.clusterId = formData.clusterInfo.id
    params.displayName = formData.clusterInfo.name
  }

  if (!formData.id) {
    const qp = typeof props.qp === 'function' ? props.qp() : props.qp
    params = {
      name: formData.name,
      qp: JSON.stringify(qp),
      ...params,
    }
  }

  const method = formData.id
    ? editResultCluster
    : isFunction(props.api)
      ? props.api
      : saveResultCluster
  //创建编辑结果分群，qp统一转字符串处理
  if (isObject(params.qp)) {
    params.qp = JSON.stringify(params.qp)
  }

  state.submitLoading = true
  method(params)
    .then((res) => {
      const message = !formData.id ? '创建成功' : '编辑成功'
      ElMessage.success(message)
      if (!formData.id) refreshResultCluster(res.data)
      state.dialogVisible = false

      emit('getData')
    })
    .finally((_) => {
      state.submitLoading = false
    })
}

/**
 * @description: 刷新结果分群
 * @return {*}
 * @param {*} id
 */
const refreshResultCluster = (id) => {
  asyncRefreshGroupData(id, appId.value)
}

const open = (info) => {
  if (isObject(info)) {
    Object.assign(formData, info)
  }

  state.dialogVisible = true
}

defineExpose({
  open,
})
</script>
