<template>
  <CommonDrawer
    v-model="state.drawerShow"
    ref="commonDrawerRef"
    :title="`${
      state.viewType === 'view'
        ? '消息详情'
        : formData.msgId
          ? '编辑消息'
          : '新增消息'
    }`"
    @close="close"
    :loading="state.submitLoading"
    :showBtn="false"
    size="600">
    <el-form
      :ref="(ref) => (state.formRef = ref)"
      :model="formData"
      :rules="formRules"
      label-position="top"
      label-width="100px"
      v-if="state.viewType !== 'view'">
      <el-form-item label="消息场景" prop="msgSceneId">
        <el-select placeholder="消息场景" v-model="formData.msgSceneId">
          <el-option
            v-for="item in newsSceneList"
            :key="item.msgSceneId"
            :label="item.msgSceneName"
            :value="item.msgSceneId" />
        </el-select>
      </el-form-item>
      <el-form-item label="发送时间" prop="pushTime">
        <el-date-picker
          v-model="formData.pushTime"
          type="datetime"
          placeholder="发送时间"
          style="width: 100%"
          value-format="YYYY-MM-DD HH:mm"
          format="YYYY-MM-DD HH:mm"
          :disabled-date="disabledDate"
          :disabled-hours="disabledHour"
          :disabled-minutes="disabledMinute"
          popper-class="date-picker-only-btn" />
      </el-form-item>
      <el-form-item label="消息标题" prop="msgTitle">
        <CommonInput
          v-model="formData.msgTitle"
          :maxlength="50"
          show-word-limit
          placeholder="消息标题"
          :prefixSlot="false" />
      </el-form-item>
      <el-form-item label="通知成员" prop="allUser">
        <el-radio-group v-model="formData.allUser">
          <el-radio-button :value="1" :label="1">全部成员</el-radio-button>
          <el-radio-button :value="0" :label="0">选择成员</el-radio-button>
        </el-radio-group>
      </el-form-item>
      <el-form-item v-if="!formData.allUser" prop="msgCompanyUserList">
        <OpationDataTree
          v-model="formData.msgCompanyUserList"
          :data="userList"
          selectedType="table"
          :columns="columns"
          :defaultProps="{ value: 'userId', label: 'nickName' }" />
      </el-form-item>
      <el-form-item label="通知内容" prop="msgContent">
        <WangEditor v-model="formData.msgContent" />
      </el-form-item>
      <el-checkbox
        v-model="formData.msgLoginPop"
        :true-value="1"
        :false-value="0">
        用户登录时弹出此消息
      </el-checkbox>
    </el-form>
    <template #footer-r v-if="state.viewType !== 'view'">
      <el-button class="skip" @click="state.drawerShow = false">取消</el-button>
      <el-button class="skip" @click="handleSubmit('draft')">
        保存为草稿
      </el-button>
      <el-button
        type="primary"
        @click="handleSubmit"
        :loading="state.submitLoading">
        确认
      </el-button>
    </template>

    <el-descriptions v-if="state.viewType === 'view'" title="" :column="1">
      <el-descriptions-item label="消息名称">
        {{ formData.msgTitle }}
      </el-descriptions-item>
      <el-descriptions-item label="消息场景">
        {{ formData.msgSceneName }}
      </el-descriptions-item>
      <el-descriptions-item label="发送时间">
        {{ formData.pushTime }}
      </el-descriptions-item>
      <el-descriptions-item label="接收成员">
        {{
          !formData.allUser
            ? formData.msgCompanyUserList.map((e) => e.nickName).join('、')
            : '全部成员'
        }}
      </el-descriptions-item>
      <el-descriptions-item label="通知内容">
        <span v-html="formData.msgContent" class="notice-container" />
      </el-descriptions-item>
      <el-descriptions-item label="其他设置">
        {{ !!formData.msgLoginPop ? '用户登录时弹出此消息' : '' }}
      </el-descriptions-item>
    </el-descriptions>
  </CommonDrawer>
</template>

<script setup>
import { reactive } from 'vue'
import { messageUpdate, messageAdd } from '@/api/modules/notice'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'

const props = defineProps({
  newsSceneList: {
    type: Array,
    default: () => [],
  },
  userList: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['getList'])

const columns = [
  {
    label: '成员名',
    prop: 'nickName',
  },
  {
    label: '企业名称',
    prop: 'companyName',
  },
  {
    label: '操作',
    prop: 'operation',
  },
]

const state = reactive({
  drawerShow: false,
  submitLoading: false,
  formRef: null,
  viewType: '',
})

/* 限制天 */
const disabledDate = (time) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

/* 限制小时 */
const disabledHour = () => {
  const arrs = []
  for (let i = 0; i < 24; i++) {
    if (new Date().getHours() <= i) continue
    arrs.push(i)
  }
  return arrs
}

/* 限制分 */
const disabledMinute = () => {
  const arrs = []
  for (let i = 0; i < 60; i++) {
    if (new Date().getMinutes() <= i) continue
    arrs.push(i)
  }
  return arrs
}

const initFormData = () => ({
  msgSceneId: '',
  pushTime: dayjs().add(15, 'minute').format('YYYY-MM-DD HH:mm'),
  msgTitle: '',
  allUser: 1,
  msgContent: '',
  msgLoginPop: 1,
  msgId: '',
  msgCompanyUserList: [],
})

const formData = reactive(initFormData())

const editorValidate = (rule, value, callback) => {
  const content = value
    .replace(/<[^<p>]+>/g, '')
    .replace(/<[</p>$]+>/g, '')
    .replace(/&nbsp;/gi, '')
    .replace(/<[^<br/>]+>/g, '')

  if (!content.trim()) {
    callback(new Error('请输入内容'))
  } else {
    callback()
  }
}

const formRules = reactive({
  msgSceneId: [{ required: true, message: '请选择消息场景' }],
  pushTime: [{ required: true, message: '请选择发送时间' }],
  allUser: [{ required: true }],
  msgContent: [
    { required: true, message: '请输入内容', validator: editorValidate },
  ],
  msgCompanyUserList: [{ required: true, message: '请选择成员' }],
})

/**
 * @description: 保存
 * @return {*}
 */
const handleSubmit = (type) => {
  state.formRef.validate((valid) => {
    if (valid) {
      handleSave(type)
    }
  })
}

/**
 * @description: 保存
 * @return {*}
 * @param {*} type  保存的类型  draft: 草稿
 */
const handleSave = (type) => {
  const params = {
    ...formData,
    msgStatus: type === 'draft' ? 1 : 2,
  }
  state.submitLoading = true
  const method = formData.msgId ? messageUpdate : messageAdd

  method(params)
    .then(() => {
      const message = formData.msgId ? '编辑成功' : '新建成功'
      ElMessage.success(message)
      state.drawerShow = false
      emit('getList')
    })
    .finally((_) => {
      state.submitLoading = false
    })
}

/**
 * @description: 编辑/详情
 * @return {*}
 */
const handleView = (row, type) => {
  state.drawerShow = true
  Object.assign(formData, row)
  state.viewType = type
}

const close = () => {
  state.viewType = ''
  Object.assign(formData, initFormData())
}

const open = () => {
  state.drawerShow = true
}
defineExpose({
  open,
  handleView,
})
</script>

<style lang="scss" scoped>
:deep() {
  .el-descriptions__cell {
    display: flex;
    .el-descriptions__label {
      white-space: nowrap;
    }
    // align-items: center;
  }
}
</style>

<style lang="scss">
.notice-container {
  img {
    max-width: 100%;
  }
}

.date-picker-only-btn {
  .el-picker-panel__footer {
    button:first-child {
      display: none;
    }
  }
}
</style>
