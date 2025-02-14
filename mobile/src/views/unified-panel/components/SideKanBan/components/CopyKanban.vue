<template>
  <CommonDialog
    v-model="state.show"
    width="550px"
    :loading="state.operatLoading"
    @submit="submit"
    @close="close"
    :title="t('dashboard.copyDash')">
    <el-form
      :rules="formRules"
      label-position="top"
      label-width="100px"
      ref="formRef"
      :model="state.formData">
      <el-form-item
        :label="`${t(`dashboard.dashboard`)}${t('common.name')}`"
        prop="name">
        <CommonInput
          show-word-limit
          :prefixSlot="false"
          maxlength="50"
          v-model="state.formData.name" />
      </el-form-item>
      <SelectFolderOrSpace
        :label="t('btn.addTo')"
        comprehensive
        @change="selectFolderOrSpaceChange"
        v-model="state.formData.folderId" />
    </el-form>
  </CommonDialog>
</template>

<script setup>
import { markRaw, reactive, ref } from 'vue'
import { asyncCopyKanBan } from '@/api/modules/unified-panel'
import { ElMessage } from 'element-plus'
import { recordBehavior } from '@/utils/record-behavior.js'
import { topLevelIdMap } from '@/views/see-plate/enum.js'
import SelectFolderOrSpace from '@/views/see-plate/components/SideKanBan/components/SelectFolderOrSpace.vue'
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
const initVal = () => {
  return {
    show: false,
    operatLoading: false,
    selectFolderOrSpaceParams: {},
    formData: {
      name: '',
      folderId: '',
    },
  }
}

const state = reactive(initVal())

const selectFolderOrSpaceChange = (data) => {
  state.selectFolderOrSpaceParams = markRaw(data)
}

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.operatLoading = true
    recordBehavior({
      moduleName: '综合看板',
      operate: '复制看板',
    })
    await asyncCopyKanBan({
      businessId: state.currentData.businessId,
      dataItemList: state.selectFolderOrSpaceParams.children.map(
        (item, index) => {
          return {
            id: item.id,
            order: index + 1,
            type: item.type === 'dashboard' ? 1 : 2,
          }
        }
      ),
      name: state.formData.name,
      sourceModuleType: topLevelIdMap[state.currentData.topLevelId],
      targetModuleType:
        topLevelIdMap[state.selectFolderOrSpaceParams.topLevelId],
      toFolderBusinessId: state.formData.folderId,
    }).finally((_) => {
      state.operatLoading = false
    })
    state.show = false
    ElMessage.success(t('common.copySuccess'))
    emit('getData')
  })
}

const open = async (data) => {
  state.currentData = markRaw(data)
  state.formData.name = data.name
  state.show = true
}
defineExpose({
  open,
})
defineOptions({
  name: 'CopyKanban',
})
</script>

<style lang="scss"></style>
