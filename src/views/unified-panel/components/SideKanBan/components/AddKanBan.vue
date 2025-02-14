<template>
  <CommonDialog
    v-model="state.show"
    @close="close"
    @submit="submit"
    :loading="state.operateLoading"
    :title="t('dashboard.addDash')"
    size="600px">
    <div class="flex-column gap16">
      <el-form
        ref="formRef"
        :model="state.formData"
        :rules="formRules"
        label-position="top"
        label-width="100px">
        <el-form-item
          :label="`${t(`dashboard.dashboard`)}${t('common.name')}`"
          prop="name">
          <CommonInput
            :prefixSlot="false"
            v-model="state.formData.name"
            maxlength="50"
            show-word-limit
            :clearable="false" />
        </el-form-item>
        <SelectFolderOrSpace
          prop="businessId"
          :label="t('btn.addTo')"
          comprehensive
          @change="selectFolderOrSpaceChange"
          v-model="state.formData.businessId" />
      </el-form>
    </div>
  </CommonDialog>
</template>

<script setup>
import { markRaw, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { asyncAddKanBan } from '@/api/modules/unified-panel'
import { recordBehavior } from '@/utils/record-behavior.js'
import SelectFolderOrSpace from '@/views/see-plate/components/SideKanBan/components/SelectFolderOrSpace.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const formRules = {
  name: [{ required: true, message: t('common.pleaseEnter') }],
}
const emit = defineEmits(['getData'])

const initVal = () => {
  return {
    show: false,
    operateLoading: false,
    selectFolderOrSpaceParams: {},
    formData: {
      name: '',
      businessId: '',
    },
  }
}

const formRef = ref(null)
const state = reactive(initVal())

const selectFolderOrSpaceChange = (obj) => {
  state.selectFolderOrSpaceParams = markRaw(obj)
}

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.operateLoading = true
    recordBehavior({
      moduleName: '综合看板',
      operate: '新建看板',
    })
    await asyncAddKanBan(state.formData).finally((_) => {
      state.operateLoading = false
    })
    ElMessage.success(t('common.createSuccess'))
    state.show = false
    emit('getData')
  })
}

const open = () => {
  state.show = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'AddKanBan',
})
</script>

<style scoped lang="scss"></style>
