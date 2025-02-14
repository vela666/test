<template>
  <el-form-item
    v-if="showName"
    :rules="[
      { required: true, message: $t('common.pleaseEnter'), trigger },
      {
        validator(rule, value, callback) {
          if (!validIdentifierRegex1(value)) {
            return callback($t('user.nameCheckMsg'))
          }
          callback()
        },
        trigger,
      },
    ]"
    :label="$t('user.userTag.tagName')"
    prop="name">
    <CommonInput
      class="w100-percentage"
      :prefixSlot="false"
      trimAllSpace
      maxlength="8"
      show-word-limit
      :disabled="!!id"
      v-model="nameVal" />
  </el-form-item>
  <el-form-item
    :rules="[{ required: true, message: $t('common.pleaseEnter'), trigger }]"
    :label="$t('user.displayName')"
    prop="displayName">
    <CommonInput
      class="w100-percentage"
      :prefixSlot="false"
      trimAllSpace
      maxlength="24"
      show-word-limit
      v-model="displayNameVal" />
  </el-form-item>
  <el-form-item :label="$t('common.remark')">
    <CommonInput
      class="w100-percentage"
      :prefixSlot="false"
      maxlength="50"
      show-word-limit
      :rows="3"
      type="textarea"
      resize="none"
      v-model="remarkVal" />
  </el-form-item>
</template>

<script setup>
import { computed } from 'vue'
import { validIdentifierRegex1 } from '@/utils/validate'
const props = defineProps({
  // 是否显示分群名
  showName: {
    type: Boolean,
    default: true,
  },
  id: {
    type: [String, Number],
    default: '',
  },
  name: {
    type: String,
    default: '',
  },
  displayName: {
    type: String,
    default: '',
  },
  remark: {
    type: String,
    default: '',
  },
})
const emit = defineEmits(['update:name', 'update:displayName', 'update:remark'])

const trigger = ['blur', 'change']
const nameVal = computed({
  get() {
    return props.name
  },
  set(val) {
    emit('update:name', val)
  },
})
const displayNameVal = computed({
  get() {
    return props.displayName
  },
  set(val) {
    emit('update:displayName', val)
  },
})
const remarkVal = computed({
  get() {
    return props.remark
  },
  set(val) {
    emit('update:remark', val)
  },
})
defineOptions({
  name: 'DisplayNameRemark',
})
</script>

<style scoped lang="scss"></style>
