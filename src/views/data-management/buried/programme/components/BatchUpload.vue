<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="$t('dataManagement.batchUpload')"
    size="900px">
    <CommonUpload
      ref="commonUploadRef"
      v-model:file-list="state.file"
      :on-exceed="clearFiles"
      @change="handelUploadFile"
      :on-remove="handleRemove">
      <template #desc>
        <div class="c86919d">
          {{ $t('dataManagement.supportFileExtensions') }}.xls / .xlsx
        </div>
        <div class="c86919d">
          {{ $t('dataManagement.clickDownloadTemplate') }}
          <a
            @click.stop
            target="_blank"
            class="c5473e8"
            :href="externalUrl.buryingPointProgramme"
            >埋点方案模板.xlsx</a
          >
        </div>
      </template>
    </CommonUpload>
  </CommonDrawer>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { externalUrl } from '@/enumeration'
import { recordBehavior } from '@/utils/record-behavior.js'
import { asyncImportProgramme } from '@/api/modules/programme/common.js'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    operateLoading: false,
    showOperate: false,
    file: [],
  }
}

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const commonUploadRef = ref(null)

const close = () => {
  Object.assign(state, initVal())
}
const submit = async () => {
  if (!state.file.length) {
    ElMessage.warning(t('user.userGroup.uploadFilePlease'))
    return
  }
  const formData = new FormData()
  formData.append('file', state.file[0].raw)
  try {
    state.operateLoading = true
    recordBehavior({
      moduleName: '数据管理',
      submoduleName: '埋点方案',
      operate: '批量上传埋点方案',
    })
    await asyncImportProgramme(formData).finally((_) => {
      state.operateLoading = false
    })
    emit('getData')
    state.showOperate = false
    ElMessage.success(t('common.operationSuccessfully'))
  } catch (e) {
    console.log(e)
  }
}

const open = () => {
  state.showOperate = true
}

const handelUploadFile = async (file, fileList) => {
  state.file = fileList
}

const handleRemove = (file, fileList) => {
  state.file = []
}

const clearFiles = (files) => {
  commonUploadRef.value.clearFiles(files)
}

defineExpose({
  open,
})
defineOptions({
  name: 'BatchUpload',
})
</script>

<style scoped lang="scss"></style>
