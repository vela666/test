<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="`${state.formData.id ? $t('user.userGroup.editIdGroup') : $t('user.userGroup.addIdGroup')}`"
    size="900px">
    <el-form
      :rules="rules"
      label-position="top"
      ref="formRef"
      :model="state.formData">
      <DisplayNameRemark
        :id="state.formData.id"
        v-model:name="state.formData.name"
        v-model:displayName="state.formData.displayName"
        v-model:remark="state.formData.remark" />
      <el-form-item :label="$t('user.userGroup.relatedFields')" prop="property">
        <el-select
          v-model="state.formData.property"
          :placeholder="$t('common.pleaseSelect')"
          class="w100-percentage">
          <el-option
            v-for="item of state.relatedFieldList"
            :key="item.propertyName"
            :label="item.propertyNameDisplay"
            :value="item.propertyName" />
        </el-select>
      </el-form-item>
      <el-form-item :label="$t('user.userGroup.uploadFiles')" prop="csvFile">
        <CommonUpload
          ref="commonUploadRef"
          v-model:file-list="state.file"
          :on-exceed="clearFiles"
          @change="handelUploadFile"
          :accept="['.csv']"
          :on-remove="handleRemove">
          <template #desc>
            <div class="fz14 c86919d line-h-1-dot-5 mt10">
              1、{{ $t('user.userGroup.generateIdGroup') }}<br />
              2、{{ $t('user.userGroup.supportUploadAttr') }}<br />
              3、{{ $t('user.userGroup.uploadCsvFormat') }}
            </div>
          </template>
        </CommonUpload>
      </el-form-item>
    </el-form>
  </CommonDrawer>
</template>

<script setup>
import { markRaw, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import DisplayNameRemark from '@/views/user/components/DisplayNameRemark.vue'
import { displayName, groupName } from '@/views/user/enum'
import {
  asyncAddIdGroup,
  asyncEditIdGroup,
  asyncGetByIdGroupInfo,
  asyncGetIdGroupRelatedAttrList,
  asyncRefreshGroupData,
} from '@/api/modules/user-group'
import { analysisExcel } from '@/utils/excel'
import { filterArraySpecifiedKey } from '@/utils/dataProcessing'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const initVal = () => {
  return {
    operateLoading: false,
    showOperate: false,
    file: [],
    relatedFieldList: [],
    formData: {
      id: '',
      name: groupName(),
      csvFile: null,
      displayName: displayName(),
      remark: '',
      // qp: null,
      createType: 2,
      property: '',
      type: 0,
      refreshType: 0,
    },
  }
}

const trigger = ['blur', 'change']

const rules = {
  property: [{ required: true, message: t('common.pleaseSelect'), trigger }],
  csvFile: [
    { required: true, message: t('user.userGroup.uploadFilePlease'), trigger },
  ],
}
const emit = defineEmits(['getData'])
const state = reactive(initVal())
const formRef = ref(null)
const commonUploadRef = ref(null)

const getIdGroupRelatedAttrList = async () => {
  const { data } = await asyncGetIdGroupRelatedAttrList()
  state.relatedFieldList = markRaw(data)
}

const getByIdGroupInfo = async (id) => {
  state.operateLoading = true
  const { data } = await asyncGetByIdGroupInfo(id).finally((_) => {
    state.operateLoading = false
  })
  Object.keys(data).forEach((k) => {
    if (Reflect.has(state.formData, k)) {
      state.formData[k] = data[k]
    }
  })
  const qp = JSON.parse(data.qp)
  state.file = [{ name: qp.fileName }]
  state.formData.property = qp.propertyName
  state.formData.csvFile = { name: qp.fileName }
}
const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    const property = state.relatedFieldList.find(
      (item) => item.propertyName === state.formData.property
    )
    const cluster = {
      appId: sessionStorage.getItem('appId'),
      ...filterArraySpecifiedKey(
        state.formData,
        ['csvFile', 'property', 'qp'],
        true
      ),
      qp: JSON.stringify({
        propertyName: property.propertyName,
        propertyNameDisplay: property.propertyNameDisplay,
        propertyType: property.propertyType,
        fileName: state.formData.csvFile.name,
      }),
    }
    console.log({
      cluster,
      state,
    })
    const formData = new FormData()
    if (state.formData.csvFile.type) {
      formData.append('file', state.formData.csvFile)
    }
    formData.append(
      'cluster',
      new Blob([JSON.stringify(cluster)], { type: 'application/json' })
    )
    try {
      state.operateLoading = true
      const bool = Number.isInteger(state.formData.id)
      const fn = bool ? asyncEditIdGroup : asyncAddIdGroup
      const { data } = await fn(formData)
      await asyncRefreshGroupData(bool ? state.formData.id : data).finally(
        (_) => {
          emit('getData')
          state.showOperate = false
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

const open = (data) => {
  state.showOperate = true
  if (data) {
    state.formData.id = data.id
    getByIdGroupInfo(data.id)
  }
  getIdGroupRelatedAttrList()
}

const handelUploadFile = async (file, fileList) => {
  state.file = fileList
  const reader = new FileReader()
  reader.readAsText(file.raw, 'utf-8')
  reader.onload = async (e) => {
    try {
      const data = e.target.result
      if (data.includes('�')) {
        state.file = []
        return ElMessage.warning(t('rules.uploadFormat'))
      }
      state.formData.csvFile = file.raw
      await analysisExcel(file)
      formRef.value.validateField('csvFile')
    } catch (e) {
      state.file = []
    }
  }
}

const handleRemove = (file, fileList) => {
  state.file = []
  state.formData.csvFile = null
  formRef.value.validateField('csvFile')
}

const clearFiles = (files) => {
  commonUploadRef.value.clearFiles(files)
}

defineExpose({
  open,
})
defineOptions({
  name: 'IdGroup',
})
</script>

<style scoped lang="scss"></style>
