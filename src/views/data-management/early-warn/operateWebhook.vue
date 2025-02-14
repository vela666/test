<script setup>
import { cloneDeep } from 'lodash-es'
import { ref, reactive, computed, markRaw } from 'vue'
import { asyncGetOptionalProjectGroupList } from '@/api/modules/project-group'
import { earlyWarnSaveAddress } from '@/api/modules/data-management/early'
import { t } from '@/locales/i18n'

const state = reactive({
  visible: false,
  formData: {
    sendType: null,
    projectId: '',
    addressName: '',
    addressUrl: '',
  },
  projectGroupList: [],
})

const rules = reactive({
  projectId: [
    {
      required: true,
      message: t('dataManagement.earlyWarn.validProjectRules'),
      trigger: 'change',
    },
  ],
  addressName: [
    {
      required: true,
      message: t('dataManagement.earlyWarn.validNameRules'),
      trigger: 'blur',
    },
  ],
  addressUrl: [
    {
      required: true,
      message: t('dataManagement.earlyWarn.validWebhookRules'),
      trigger: 'blur',
    },
  ],
})

const form = ref()

/**
 * @description 关闭弹框
 */
const handleDialogClose = () => {
  form.value.resetFields()
  state.visible = false
}

/**
 * @description 创建webhook
 */
const handleDialogSubmit = () => {
  form.value.validate((valid) => {
    if (valid) {
      const params = {
        projectId: state.formData.projectId,
        addressName: state.formData.addressName,
        addressUrl: state.formData.addressUrl,
        sendType: state.formData.sendType,
      }
      earlyWarnSaveAddress(params).then((res) => {
        if (res && res.code === 200) {
          handleDialogClose()
        }
      })
    }
  })
}

/**
 * @description 项目组获取
 */
const projectSelectVisibleChange = (bool) => {
  bool && getProjectGroupList()
}
const getProjectGroupList = async () => {
  const { data } = await asyncGetOptionalProjectGroupList({
    size: -1,
  })
  state.projectGroupList = markRaw(data)
}

/**
 * @description 打开webhook配置弹框
 */
const open = (data) => {
  state.visible = true
  state.formData = {
    projectId: data.projectId ?? '',
    addressName: data.addressName ?? '',
    addressUrl: data.sendAddress ?? '',
    sendType: data.sendType,
  }
}

defineExpose({ open })

defineOptions({
  name: 'operateWebhook',
})
</script>
<template>
  <CommonDialog
    v-model="state.visible"
    :width="550"
    title="保存"
    :show-close="true"
    :need-footer="true"
    @submit="handleDialogSubmit"
    @close="handleDialogClose">
    <template #default>
      <el-form
        label-position="top"
        ref="form"
        :model="state.formData"
        :rules="rules">
        <el-form-item
          :label="t('system.apps.assignProjectTeam')"
          prop="projectId">
          <el-select
            class="w100-percentage"
            v-model="state.formData.projectId"
            filterable
            collapse-tags
            @visible-change="projectSelectVisibleChange"
            :placeholder="t('common.pleaseSelect')">
            <el-option
              v-for="item of state.projectGroupList"
              :key="item.projectId"
              :label="item.projectName"
              :value="item.projectId"
              :disabled="item.userType !== 1" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('common.name')" prop="addressName">
          <CommonInput
            v-model="state.formData.addressName"
            :prefixSlot="false"
            :maxlength="50"
            show-word-limit
            :placeholder="t('dataManagement.earlyWarn.enterRecognizeName')" />
        </el-form-item>
        <el-form-item
          :label="t('dataManagement.earlyWarn.webhookAddress')"
          prop="addressUrl">
          <CommonInput
            v-model="state.formData.addressUrl"
            :prefixSlot="false"
            :maxlength="200"
            show-word-limit
            :placeholder="
              t('dataManagement.earlyWarn.enterDynamicWebhook', {
                type:
                  state.formData.sendType === 1
                    ? t('dataManagement.earlyWarn.lark')
                    : t('dataManagement.earlyWarn.dingTalk'),
              })
            " />
        </el-form-item>
      </el-form>
    </template>
  </CommonDialog>
</template>
<style lang="scss" scoped></style>
