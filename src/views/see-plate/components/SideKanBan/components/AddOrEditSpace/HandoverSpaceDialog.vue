<template>
  <CommonDialog
    v-model="state.show"
    :loading="state.operateLoading"
    @submit="submit"
    @close="close"
    :title="t('dashboard.transferSpace')">
    <el-form
      :rules="formRules"
      label-position="top"
      label-width="100px"
      ref="formRef"
      :model="state.formData">
      <el-form-item
        :label="t('dashboard.transferAdminInstruction')"
        prop="selectData">
        <el-select filterable v-model="state.formData.selectData">
          <el-option
            v-for="item of data"
            :label="item.name"
            :key="item.id"
            :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
  </CommonDialog>
</template>

<script setup>
import { markRaw, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import useUserStore from '@/store/modules/user'
import {
  asyncTransferSpace,
  asyncTransferSpaceVerify,
} from '@/api/modules/see-plate/space'
import { useTipModal } from '@/components/TipDialog/index.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const formRules = {
  selectData: [{ required: true, message: t('common.pleaseSelect') }],
}
const props = defineProps({
  data: {
    type: Array,
    default() {
      return []
    },
  },
  params: {
    type: Object,
    default() {
      return {}
    },
  },
})

const initVal = () => {
  return {
    show: false,
    operateLoading: false,
    formData: {
      selectData: '',
    },
  }
}
const userStore = useUserStore()
const emit = defineEmits(['submit'])
const formRef = ref(null)
const state = reactive(initVal())

const change = (obj) => {
  state.targetObj = markRaw(obj)
}

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    try {
      state.operateLoading = true
      const params = {
        businessId: props.params.businessId,
        dataType: 3,
        moduleType: 3,
        receiveMemberId: state.formData.selectData,
        transferMemberId: userStore.userInfo.id,
      }
      const { data } = await asyncTransferSpaceVerify(params)
      if (data) {
        await useTipModal({
          // content: `空间接收人无访问【】的权限，确定移交空间后这些成员会从空间中移除！`,
          content: data,
          iconType: 3,
          needLoading: false,
          btnSwap: true,
          title: t('common.tip'),
        })
      }

      await asyncTransferSpace(params)
      ElMessage.success(t('common.operationSuccessfully'))
      emit('submit')
      close()
    } catch (e) {
      console.log(e)
    }
    state.operateLoading = false
  })
}

const open = (val) => {
  state.show = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'HandoverSpaceDialog',
})
</script>

<style scoped lang="scss"></style>
