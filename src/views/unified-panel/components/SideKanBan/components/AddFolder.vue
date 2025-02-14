<template>
  <CommonDialog
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.show"
    :title="t('dashboard.addFile')">
    <div class="flex-column gap16">
      <el-form
        ref="formRef"
        :model="state.formData"
        :rules="formRules"
        label-position="top"
        label-width="100px">
        <el-form-item
          :label="`${t('dashboard.folder')}${t('common.name')}`"
          prop="name">
          <CommonInput
            :prefixSlot="false"
            v-model="state.formData.name"
            maxlength="50"
            show-word-limit
            :clearable="false" />
        </el-form-item>
        <SelectFolderOrSpace
          comprehensive
          prop="id"
          :label="t('btn.addTo')"
          needShare
          @change="change"
          v-model="state.formData.id" />
      </el-form>
    </div>
  </CommonDialog>
</template>

<script setup>
import { reactive, ref, markRaw } from 'vue'
import SelectFolderOrSpace from '@/views/see-plate/components/SideKanBan/components/SelectFolderOrSpace.vue'
import { asyncAddFolder } from '@/api/modules/unified-panel/folder.js'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const formRules = {
  name: [{ required: true, message: t('common.pleaseEnter') }],
  id: [{ required: true, message: t('common.pleaseSelect') }],
}
const emit = defineEmits(['getData'])

const initVal = () => {
  return {
    show: false,
    operateLoading: false,
    targetObj: {},
    formData: {
      name: '',
      id: 'ownerModule',
    },
  }
}

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
    state.operateLoading = true
    const name = state.formData.name
    const folderType = state.formData.id === 'shareModule' ? 3 : 1
    const params = {
      name,
      folderType,
    }

    await asyncAddFolder(params).finally((_) => {
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
  name: 'AddFolder',
})
</script>

<style scoped lang="scss"></style>
