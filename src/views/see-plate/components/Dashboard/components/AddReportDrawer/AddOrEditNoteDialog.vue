<template>
  <CommonDialog
    v-model="state.show"
    :title="t(`dashboard.${state.formData.noteId ? 'editLabel' : 'addNote'}`)"
    :loading="state.operatLoading"
    @submit="submit"
    @close="close">
    <el-form
      :rules="formRules"
      label-position="top"
      label-width="100px"
      :model="state.formData"
      ref="formRef">
      <el-form-item prop="name" :label="t('dashboard.noteBackgroundColor')">
        <div class="flex-center gap20">
          <div
            @click="setNoteBg(item.type)"
            v-for="item of noteBgColorList"
            :key="item.type"
            :class="[
              +state.formData.backgroundColor === item.type &&
                'nd-note-bg-item-active',
              'nd-note-bg-item c-pointer',
            ]"
            :style="`background-color:${item.label}`"></div>
        </div>
      </el-form-item>
      <el-form-item prop="noteTitle" :label="t('common.title')">
        <CommonInput
          show-word-limit
          maxlength="50"
          :prefixSlot="false"
          v-model="state.formData.noteTitle" />
      </el-form-item>
      <el-form-item prop="name" :label="t('dashboard.titleStyle')">
        <div class="flex flex-align-items-baseline gap20">
          <div
            @click="setNoteFontSize(item.type)"
            :key="item.type"
            :class="[
              +state.formData.titleStyle === item.type && 'c5473e8',
              'txt-bold c-pointer ',
            ]"
            v-for="(item, index) of noteTitleFontSizeList"
            :style="`font-size:${item.label}`">
            {{ `H${index + 1}` }}
          </div>
        </div>
      </el-form-item>
      <el-form-item
        v-if="state.formData.viewSizeType && state.isLeft"
        :label="t('dashboard.windowSize')"
        prop="viewSizeType">
        <el-radio-group
          v-model="state.formData.viewSizeType"
          class="flex gap20">
          <el-radio class="m0" :value="1">{{
            t('dashboard.mediumImage')
          }}</el-radio>
          <el-radio :value="2">{{ t('dashboard.largeImage') }}</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item prop="noteContent" :label="t('common.content')">
        <CommonInput
          show-word-limit
          maxlength="500"
          :rows="7"
          type="textarea"
          resize="none"
          :prefixSlot="false"
          v-model="state.formData.noteContent" />
      </el-form-item>
    </el-form>
  </CommonDialog>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { asyncEditNote, asyncAddNote } from '@/api/modules/see-plate/note'
import { noteBgColorList, noteTitleFontSizeList } from '@/enumeration/note.js'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  // 便签所属类型，1：数据看板模块下，2：综合看板模块下
  type: {
    type: String,
    default: '1',
  },
})

const { t } = useI18n()

const initVal = () => {
  return {
    show: false,
    operatLoading: false,
    isLeft: false,
    formData: {
      noteId: '',
      noteTitle: '',
      noteContent: '',
      // 1中图、2大图
      viewSizeType: 2,
      titleStyle: noteTitleFontSizeList[1].type,
      backgroundColor: noteBgColorList[0].type,
    },
  }
}
const emit = defineEmits(['getData', 'updNote'])
const formRef = ref(null)
const state = reactive(initVal())
const formRules = {
  noteTitle: [{ required: true, message: t('common.pleaseEnter') }],
}

const setNoteBg = (val) => {
  state.formData.backgroundColor = val
}

const setNoteFontSize = (val) => {
  state.formData.titleStyle = val
}

const close = () => {
  Object.assign(state, initVal())
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    state.operatLoading = true
    const bool = state.formData.noteId
    const fn = bool ? asyncEditNote : asyncAddNote
    await fn({
      noteId: state.formData.noteId,
      backgroundColor: state.formData.backgroundColor,
      noteContent: state.formData.noteContent,
      noteTitle: state.formData.noteTitle,
      titleStyle: state.formData.titleStyle,
      type: props.type,
    }).finally((_) => {
      state.operatLoading = false
    })
    ElMessage.success(
      t(`common.${bool ? 'editedSuccessfully' : 'addedSuccessfully'}`)
    )
    // 更新本地数据，不去重新获取
    if (bool) {
      emit('updNote', {
        ...state.formData,
        reportName: state.formData.noteTitle,
      })
    }

    state.show = false
    emit('getData')
  })
}
const open = (params = {}) => {
  Object.assign(state.formData, params)
  if (params?.newW) {
    state.formData.viewSizeType = params.newW === 6 ? 1 : 2
  }
  state.isLeft = Object.hasOwn(params, 'viewSizeType') || !!params.isLeft
  state.show = true
}

defineExpose({
  open,
})
defineOptions({
  name: 'AddOrEditNoteDialog',
})
</script>

<style scoped lang="scss">
.nd-note-bg-item {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  border: 1px solid var(--eas-border-color);
  &-active {
    border-color: var(--eas-color-primary);
  }
}
</style>
