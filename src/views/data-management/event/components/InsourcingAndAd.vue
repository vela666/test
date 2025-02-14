<template>
  <CommonDrawer
    @submit="submit"
    @close="close"
    size="600px"
    :loading="state.operateLoading"
    v-model="state.showOperate"
    :title="
      state.formData.eventName === 'eas_iap'
        ? $t('dataManagement.event.addIapEvent')
        : $t('dataManagement.event.addAdEvent')
    ">
    <el-form
      ref="formRef"
      scroll-to-error
      label-position="top"
      :model="state.formData">
      <el-form-item :label="$t('dataManagement.eventName')" prop="eventName">
        <el-input v-model.trim="state.formData.eventName" disabled />
      </el-form-item>
      <el-form-item
        :rules="[
          {
            required: true,
            message: $t('common.pleaseEnter'),
            trigger: ['blur', 'change'],
          },
        ]"
        :label="$t('dataManagement.displayName')"
        prop="eventNameZh">
        <CommonInput
          :prefixSlot="false"
          trimAllSpace
          show-word-limit
          :desc="$t('common.pleaseEnter')"
          maxlength="50"
          v-model="state.formData.eventNameZh" />
      </el-form-item>
      <el-form-item :label="$t('common.description')" prop="eventDesc">
        <CommonInput
          :prefixSlot="false"
          maxlength="200"
          show-word-limit
          :desc="$t('common.pleaseEnter')"
          :rows="7"
          type="textarea"
          resize="none"
          v-model="state.formData.eventDesc" />
      </el-form-item>
    </el-form>
    <div class="fz14 c545e6e mb5">
      {{
        $t('dataManagement.event.easproConfigTips', {
          type:
            state.formData.eventName === 'eas_iap'
              ? $t('dataManagement.event.internalPurchaseEvent')
              : $t('dataManagement.event.advertisingEvent'),
        })
      }}
      :
      <el-link
        type="primary"
        href="https://yifants.feishu.cn/wiki/UM7HwDlGIiJpXcktYtQcL4wnnLf"
        target="_blank"
        :underline="false">
        {{ $t('dataManagement.event.viewAccessInstructions') }}
      </el-link>
      <!-- easpro的{{
        `${state.formData.eventName === 'eas_iap' ? '内购' : '广告'}`
      }}事件，其必包含以下事件属性（可在属性配置中解除绑定）： -->
    </div>
    <el-table
      ref="tableRef"
      border
      class="nd-table-custom h-auto"
      :data="state.formData.eventAttributeList">
      <el-table-column prop="fEn" :label="$t('dataManagement.eventName')" />
      <el-table-column prop="fZh" :label="$t('dataManagement.displayName')" />
      <el-table-column prop="fType" :label="$t('common.type')">
        <template #default="{ row }">
          {{ eventDataTypeListMap[row.fType] }}
        </template>
      </el-table-column>
      <el-table-column prop="fDesc" :label="$t('common.description')" />
    </el-table>
  </CommonDrawer>
</template>

<script setup>
import { markRaw, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { eventDataTypeListMap } from '@/enumeration/data-management/event'
import {
  asyncAddInsourcingOrAdAttr,
  asyncGetInsourcingOrAdAttr,
} from '@/api/modules/data-management/event'
import { recordBehavior } from '@/utils/record-behavior.js'
import { t } from '@/locales/i18n'

const initVal = () => {
  return {
    operateLoading: false,
    showOperate: false,
    formData: {
      eventName: '',
      eventNameZh: '',
      eventDesc: '',
      eventAttributeList: [],
    },
  }
}

const emit = defineEmits(['getData'])
const state = reactive(initVal())
const formRef = ref(null)

const close = () => {
  Object.assign(state, initVal())
}
const submit = () => {
  formRef.value.validate(async (valid) => {
    if (!valid) return
    recordBehavior({
      moduleName: '数据管理',
      submoduleName: '事件管理',
      operate: `新增${
        state.formData.eventName === 'eas_iap' ? '内购' : '广告'
      }事件`,
    })
    state.operateLoading = true
    const { code, message } = await asyncAddInsourcingOrAdAttr(
      state.formData
    ).finally(() => {
      state.operateLoading = false
    })
    state.showOperate = false
    emit('getData')
    ElMessage.success(t('common.addedSuccessfully'))
  })
}

const getData = async () => {
  const { data } = await asyncGetInsourcingOrAdAttr(state.formData.eventName)
  state.formData.eventAttributeList = markRaw(data)
}

// data.mark: 1 内购  2 广告
const open = (mark) => {
  state.showOperate = true
  const is1 = mark === 1
  state.formData.eventName = is1 ? 'eas_iap' : 'eas_ad'
  state.formData.eventNameZh = is1
    ? t('dataManagement.event.internalPurchase')
    : t('dataManagement.event.advertisement')
  getData()
}

defineExpose({
  open,
})
defineOptions({
  name: 'InsourcingAndAd',
})
</script>
