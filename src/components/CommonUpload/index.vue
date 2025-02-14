<template>
  <el-upload
    ref="uploadRef"
    v-bind="attrs"
    :accept="accept.join(',')"
    drag
    :limit="limit"
    action="#"
    :auto-upload="false"
    class="upload-container"
    :on-exceed="onExceedCallback"
    :on-change="onChange"
    @drop.capture="
      (e) => onChange(e.dataTransfer.files[0], e.dataTransfer.files, true)
    ">
    <div class="upload-content">
      <div class="upload-tip">
        <div class="fz16" style="color: #545e6e">
          {{ $t('common.clickUpload') }}
        </div>
        <el-text
          v-if="!Object.keys($slots).includes('desc')"
          type="info"
          style="margin: 6px 0">
          {{
            $t('common.onlyUploadFile', [
              Array.isArray(uploadType) ? uploadType.join('、') : uploadType,
              accept.join('、'),
              size,
            ])
          }}
        </el-text>
        <slot name="desc" />
        <slot name="help" />
      </div>
      <img
        src="@/assets/images/upload@2x.png"
        width="120"
        height="80"
        style="align-self: center" />
    </div>
  </el-upload>
</template>

<script setup>
import { ref, useAttrs, onMounted } from 'vue'
import { ElMessage, genFileId } from 'element-plus'
import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

const attrs = useAttrs()
const props = defineProps({
  limit: {
    type: Number,
    default: 1,
  },
  accept: {
    type: Array,
    default: () => ['.xlsx', '.xls'],
  },
  uploadType: {
    type: [String, Array],
    default: () => ['Excel'],
  },
  // 限制上传文件的大小
  size: {
    type: [String, Number],
    default: 10,
  },
  onExceed: {
    type: Function,
  },
  /*  fileTypeEnum: {
    type: Array,
    default: () => [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ],
  },*/
})

const uploadRef = ref(null)
const emit = defineEmits(['update:file-list', 'change'])

const hasOnExceedProp = ref(false)
// 在组件挂载后检查 prop 是否存在
onMounted(() => {
  if (props.onExceed !== undefined) {
    hasOnExceedProp.value = true
  }
})

const onExceedCallback = (file) => {
  if (hasOnExceedProp.value) {
    props.onExceed(file)
  } else {
    ElMessage.warning(t('common.fileUploaded'))
  }
}

/**
 * @description: 文件上传
 * @return {*}
 * @param { File } file
 */
const onChange = (files, fileLists, isDrop = false) => {
  const file = files.raw
    ? files
    : {
        raw: files,
      }

  const fileList = files.raw ? fileLists : [file]

  if (file.raw instanceof File) {
    // 获取文件后缀
    const type = file.raw.name.match(/\.([^.]+)$/)?.[0]
    // if (!props.fileTypeEnum.includes(file.raw?.type)) {
    if (!props.accept.includes(type)) {
      emit('update:file-list', [])
      ElMessage.warning(t('common.uploadFileIncorrect'))
      return
    }
    const limit = file.raw.size / 1024 / 1024 <= Number(props.size)
    if (!limit) {
      emit('update:file-list', [])
      ElMessage.warning(t('common.fileCannotExceed', [props.size]))
      return
    }
    if (!isDrop) emit('change', file, fileList)
  }
}

// 清除上传文件
const clearFiles = (files) => {
  uploadRef.value.clearFiles()
  files.forEach((item) => {
    item.uid = genFileId()
    uploadRef.value.handleStart(item)
  })
}
defineExpose({
  clearFiles,
})

defineOptions({
  name: 'CommonUpload',
})
</script>

<style lang="scss" scoped>
.upload-container {
  width: 100%;
  border: 1px dashed #cbd0d6;
  border-radius: 6px;
  min-height: 140px;
  .upload-content {
    display: flex;
    justify-content: space-between;
  }
  .upload-tip {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    .el-link {
      justify-content: flex-start;
    }
  }
}
:deep() {
  .el-upload {
    padding: 25px 100px 25px 30px;
    width: 100%;
    height: 100%;
  }
  .el-upload-dragger {
    border: none;
    padding: unset;
    width: 100%;
    text-align: unset;
  }
}
</style>
