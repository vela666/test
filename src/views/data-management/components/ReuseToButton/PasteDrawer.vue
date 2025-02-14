<template>
  <CommonDialog
    :title="$t('btn.paste')"
    v-model="show"
    @submit="submit"
    @close="close"
    width="600px"
    :subTxt="$t('dataManagement.nextStep')"
    alignCenter>
    <CommonInput
      :rows="12"
      type="textarea"
      v-model="pasteVal"
      trimAllSpace
      resize="none"
      :desc="$t('dataManagement.copyContent')" />
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </CommonDialog>
</template>

<script setup>
import { ref } from 'vue'
import { decode } from 'js-base64'
import { isObject, isArray } from '@/utils/types'
import { ElMessage } from 'element-plus'
import { t } from '@/locales/i18n'

const props = defineProps({
  // 1事件管理 2事件属性管理 3用户属性管理 7SQL动态参数
  type: {
    type: String,
    default: '1',
  },
})
const emit = defineEmits(['paste'])
const show = ref(false)
const pasteVal = ref('')

const submit = () => {
  try {
    const data = JSON.parse(decode(pasteVal.value))
    if (!(isObject(data) || isArray(data)) || data.type !== props.type) {
      throw new Error('')
    }
    emit('paste', data.data)
    show.value = false
  } catch (err) {
    ElMessage.error(t('dataManagement.parseFailed'))
  }
}

const close = () => {
  pasteVal.value = ''
}

const open = () => {
  show.value = true
}
defineExpose({
  open,
})
defineOptions({
  name: 'PasteDrawer',
})
</script>
