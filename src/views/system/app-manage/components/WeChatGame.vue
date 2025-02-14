<template>
  <el-form-item label="小游戏APPID" prop="appName">
    <el-input clearable placeholder="请输入" v-model="formData.appName" />
  </el-form-item>
  <el-form-item label="小游戏原始ID" prop="appName">
    <el-input clearable placeholder="请输入" v-model="formData.appName" />
  </el-form-item>
  <el-form-item label="头条URL" prop="appName">
    <el-input clearable placeholder="请输入" v-model="formData.appName" />
  </el-form-item>

  <el-form-item label="头条Token" prop="appName">
    <el-input clearable placeholder="请输入" v-model="formData.appName" />
  </el-form-item>

  <el-form-item label="自动刷新微信token" prop="attribution">
    <el-switch v-model="formData.attribution" />
  </el-form-item>
  <el-form-item label="刷新模式">
    <el-radio-group v-model="formData.refreshNode">
      <el-radio-button
        :label="item"
        :value="item"
        v-for="item of Object.keys(refreshNodeList)"
        :key="item">
        {{ refreshNodeList[item] }}
      </el-radio-button>
    </el-radio-group>
  </el-form-item>
  <el-form-item label="客户刷新接口地址" prop="appName">
    <el-input clearable placeholder="请输入" v-model="formData.appName" />
  </el-form-item>
  <el-form-item label="小游戏AppSecret" prop="appName">
    <el-input clearable placeholder="请输入" v-model="formData.appName" />
  </el-form-item>
</template>

<script setup>
import { computed } from 'vue'
const refreshNodeList = {
  0: '调佣客户端接口刷新',
  1: '全自动刷新',
  /* all: '全部平台',
  douyin: '抖音小游戏',
  andriod: 'Andriod',
  ios: 'IOS',*/
}
const props = defineProps({
  form: {
    type: Object,
    default: () => {},
  },
})
const emit = defineEmits(['update:form'])

const formData = computed({
  get() {
    return props.form
  },
  set(val) {
    console.log(val)
    emit('update:form', val)
  },
})

defineOptions({
  name: 'WeChatGame',
})
</script>

<style scoped lang="scss"></style>
