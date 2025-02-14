<template>
  <CommonDrawer
    v-model="state.show"
    :title="t('dashboard.importDashboard')"
    size="700px"
    @submit="submit"
    @close="close"
    :loading="state.loading">
    <template #title>
      {{ t('dashboard.importDashboard') }}
      <Tooltip>
        <SvgIcon name="help2" class="c86919d" />
        <template #content>
          {{ t('dashboard.exportWarning') }}
        </template>
      </Tooltip>
    </template>
    <el-form
      ref="formRef"
      :model="state.formData"
      :rules="formRules"
      label-position="top">
      <el-form-item prop="importType" :label="t('dashboard.importTo')">
        <el-select v-model="state.formData.importType">
          <el-option :label="t('dashboard.existingPath')" value="1" />
          <el-option
            v-if="getButtonAuth().authEnum.addFile"
            :label="t('dashboard.createdByMeAndCreateFolder')"
            value="2" />
          <el-option
            v-if="getButtonAuth().authEnum.addSpace"
            :label="t('dashboard.createSpaceAndImport')"
            value="3" />
        </el-select>
      </el-form-item>
      <SelectFolderOrSpace
        v-if="+state.formData.importType === 1"
        prop="businessId"
        :label="t('dashboard.selectPath')"
        @change="selectFolderOrSpaceChange"
        class="nd-import-kanban"
        v-model="state.formData.businessId" />
      <el-form-item
        v-if="+state.formData.importType === 2"
        prop="folderName"
        :label="`${t('dashboard.folder')}${t('common.name')}`">
        <CommonInput
          maxlength="50"
          show-word-limit
          :clearable="false"
          :prefixSlot="false"
          v-model="state.formData.folderName" />
      </el-form-item>
      <el-form-item
        v-if="+state.formData.importType === 3"
        prop="spaceName"
        :label="`${t('dashboard.space')}${t('common.name')}`">
        <CommonInput
          maxlength="100"
          show-word-limit
          :clearable="false"
          :prefixSlot="false"
          v-model="state.formData.spaceName" />
      </el-form-item>
      <el-form-item :label="t('common.uploadFile')" prop="file">
        <CommonUpload
          ref="commonUploadRef"
          v-model:file-list="state.file"
          :on-exceed="clearFiles"
          @change="handelUploadFile"
          :accept="['.json']"
          :on-remove="handleRemove">
          <template #desc>
            <div class="c86919d">
              {{ t('dashboard.supportedFileExtensions') }}
              <br />
              {{ t('dashboard.importOtherProjectDashboards') }}
            </div>
          </template>
        </CommonUpload>
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getButtonAuth } from '@/views/see-plate/enum.js'
import SelectFolderOrSpace from './SelectFolderOrSpace.vue'
import { asyncImportKanBan } from '@/api/modules/see-plate/dashboard.js'
import { useI18n } from 'vue-i18n'
import CommonDrawer from '@/components/CommonDrawer/index.vue'

const emit = defineEmits(['getData'])
const { t } = useI18n()

const formRules = {
  importType: [
    { required: true, message: t('common.pleaseSelect'), trigger: 'blur' },
  ],
  folderName: [
    { required: true, message: t('common.pleaseEnter'), trigger: 'blur' },
  ],
  spaceName: [
    { required: true, message: t('common.pleaseEnter'), trigger: 'blur' },
  ],
  businessId: [
    { required: true, message: t('common.pleaseSelect'), trigger: 'blur' },
  ],
  file: [
    { required: true, message: t('common.pleaseUpload'), trigger: 'blur' },
  ],
}

const initVal = () => {
  return {
    loading: false,
    show: false,
    file: [],
    formData: {
      spaceName: '',
      folderName: '',
      businessId: '',
      importType: '1',
      file: null,
      dataType: '',
    },
  }
}

const state = reactive(initVal())
const formRef = ref(null)
const commonUploadRef = ref(null)

const selectFolderOrSpaceChange = (value) => {
  state.formData.dataType = value.type
}

const clearFiles = (files) => {
  commonUploadRef.value.clearFiles(files)
}

const handleRemove = () => {
  state.file = []
  state.formData.file = null
  formRef.value.validateField('file')
}
const handelUploadFile = async (file, fileList) => {
  state.file = fileList
  const reader = new FileReader()
  reader.readAsText(file.raw, 'utf-8')
  reader.onload = async (e) => {
    try {
      state.formData.file = file.raw
      formRef.value.validateField('file')
    } catch (e) {
      state.file = []
      state.formData.file = null
      ElMessage.warning(t('common.uploadFileIncorrect'))
    }
  }
}

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.loading = true
    const formData = new FormData()
    const importType = state.formData.importType
    formData.append('file', state.formData.file)
    formData.append('appId', sessionStorage.getItem('appId'))
    formData.append('importType', importType)
    if (+importType === 1) {
      formData.append('dataType', state.formData.dataType)
      formData.append('businessId', state.formData.businessId)
    } else {
      formData.append(
        'name',
        state.formData[+importType === 2 ? 'folderName' : 'spaceName']
      )
    }
    await asyncImportKanBan(formData).finally((_) => {
      state.loading = false
    })
    ElMessage.success(t('common.operationSuccessfully'))
    emit('getData', false, true)
    state.show = false
  })
}

const open = () => {
  state.show = true
}

defineExpose({
  open,
})

defineOptions({
  name: 'ImportKanBan',
})
</script>
