<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="`${state.formData.id ? $t('user.userTag.editFirstAndLast') : $t('user.userTag.addFirstAndLast')}`"
    size="900px">
    <el-form label-position="top" ref="formRef" :model="state.formData">
      <DisplayNameRemark
        :text="$t('user.tag')"
        :id="state.formData.id"
        v-model:name="state.formData.name"
        v-model:displayName="state.formData.displayName"
        v-model:remark="state.formData.remark" />
      <Condition ref="conditionRef" :qp="state.formData.qp" />
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
import { nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import UpdateWay from '@/views/user/components/UpdateWay.vue'
import DisplayNameRemark from '@/views/user/components/DisplayNameRemark.vue'
import Condition from './Condition/index.vue'
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
    formData: {
      id: '',
      name: groupName('t'),
      displayName: displayName(t('user.tag')),
      remark: '',
      qp: [],
      createType: 5,
      // 0 手动更新 1自动更新
      refreshType: 0,
      // 0覆盖 1增量
      accumulation: 0,
      excludeSegmentationToggle: false,
      excludeSegmentationDay: 30,
      type: 1,
      valueType: 0,
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
      const params = {
        ...state.formData,
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
        // valueType:tag值类型 0代表字符串 1表示整型 2表示浮点 3表示日期时间
        if (val.propertyType === 'string') {
          params.valueType = 0
        } else if (['int', 'enum'].includes(val.propertyType)) {
          params.valueType = 1
        } else if (val.propertyType === 'double') {
          params.valueType = 2
        } else if (
          ['timeunit', 'timestamp', 'datetime'].includes(val.propertyType)
        ) {
          params.valueType = 3
        }
        params.qp = JSON.stringify(val)
      } catch (err) {
        ElMessage.warning(err)
        return
      }
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
      if (k === 'qp') {
        state.formData[k] = JSON.parse(data[k])
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
    getByIdTagInfo(data)
  } else {
    nextTick(() => {
      conditionRef.value.initData()
    })
  }
}

defineExpose({
  open,
})
defineOptions({
  name: 'FirstLastFeature',
})
</script>

<style scoped lang="scss"></style>
