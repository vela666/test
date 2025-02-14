<template>
  <div class="w-editor-container">
    <Toolbar
      :mode="state.mode"
      :editor="editorRef"
      :defaultConfig="state.toolbarConfig"
      style="border-bottom: 1px solid var(--eas-text-color-light-1)" />
    <Editor
      v-model="editorValue"
      style="height: 400px; overflow-y: hidden; width: 100%"
      :mode="state.mode"
      @onCreated="handleCreated"
      :defaultConfig="state.editorConfig" />
  </div>
</template>

<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { computed, reactive, shallowRef, watch } from 'vue'
import { useFormItem } from 'element-plus'

// 二进制转成base64
const blobToDataURL = (blob, cb) => {
  const reader = new FileReader()
  reader.onload = function (evt) {
    const base64 = evt.target.result
    cb(base64)
  }
  reader.readAsDataURL(blob)
}

const state = reactive({
  mode: 'default',
  editorConfig: {
    placeholder: 'Please Enter...',
    MENU_CONF: {
      uploadImage: {
        async customUpload(file, insertFn) {
          blobToDataURL(file, (base64Url) => {
            const res = base64Url
            insertFn(res, '', '')
          })
        },
      },
      // uploadImage: {
      //   fieldName: 'your-fileName',
      //   base64LimitSize: 10 * 1024 * 1024, // 10M 以下插入 base64
      // },
    },
  },
  toolbarConfig: {},
})

const editorRef = shallowRef()

const handleCreated = (editor) => {
  editorRef.value = editor // 记录 editor 实例，重要！
}

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

const { formItem } = useFormItem()
watch(
  () => props.modelValue,
  () => {
    formItem?.validate('change').catch((err) => {})
  }
)

const emit = defineEmits(['update:modelValue'])

const editorValue = computed({
  get() {
    return props.modelValue
  },
  set(val) {
    emit('update:modelValue', val)
  },
})
</script>

<style lang="scss" scoped>
.w-editor-container {
  border: 1px solid var(--eas-text-color-light-1);
  z-index: 100;
}
</style>
