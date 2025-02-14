<template>
  <CommonDialog
    v-model="state.show"
    width="550px"
    :loading="state.operatLoading"
    @submit="submit"
    @close="close"
    :title="t('btn.rename')">
    <el-form
      :rules="formRules"
      label-position="top"
      label-width="100px"
      ref="formRef"
      :model="state.formData">
      <el-form-item
        :label="`${t(`dashboard.${isFolder ? 'folder' : 'dashboard'}`)}${t('common.name')}`"
        prop="name">
        <CommonInput
          maxlength="50"
          show-word-limit
          :prefixSlot="false"
          v-model="state.formData.name" />
      </el-form-item>
    </el-form>
  </CommonDialog>
</template>

<script setup>
import { computed, markRaw, reactive, ref } from 'vue'
import { asyncRenameKanBan } from '@/api/modules/unified-panel'
import { asyncRenameFolder } from '@/api/modules/unified-panel/folder.js'
import { ElMessage } from 'element-plus'
import { recordBehavior } from '@/utils/record-behavior.js'
import useUnifiedPanelStore from '@/store/modules/unified-panel.js'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const emit = defineEmits(['getData'])
const formRef = ref(null)
const formRules = {
  name: [
    { required: true, message: t('common.pleaseEnter') },
    { min: 1, max: 50, message: t('rules.length1To50', [t('common.name')]) },
  ],
}

const unifiedPanelStore = useUnifiedPanelStore()

const initVal = () => {
  return {
    show: false,
    operatLoading: false,
    currentData: {},
    formData: {
      businessId: '',
      name: '',
    },
  }
}

const state = reactive(initVal())

const isFolder = computed(() => {
  return state.currentData.type === 'folder'
})

const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.operatLoading = true
    const fn = isFolder.value ? asyncRenameFolder : asyncRenameKanBan

    recordBehavior({
      moduleName: '综合看板',
      operate: `重命名${isFolder.value ? '文件夹' : '看板'}`,
    })
    const { data } = await fn(state.formData).finally((_) => {
      state.operatLoading = false
    })
    if (!isFolder.value) {
      unifiedPanelStore.selectedInfo.name = data
    }
    ElMessage.success(t('common.editedSuccessfully'))
    emit('getData')
    state.show = false
  })
}

const open = (data) => {
  state.currentData = markRaw(data)
  state.formData.name = data.name
  state.formData.businessId = data.businessId
  state.show = true
}
defineExpose({
  open,
})
defineOptions({
  name: 'EditFolderOrKanban',
})
</script>

<style lang="scss" scoped></style>
