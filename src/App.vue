<template>
  <el-button>Not render.</el-button>

  <Test>
    <el-button class="21312">Test</el-button>
    <el-input v-model="input" placeholder="Please input"/>
    <el-radio-group v-model="radio1" class="ml-4">
      <el-radio label="1" size="large">Option 1</el-radio>
      <el-radio label="2" size="large">Option 2</el-radio>
    </el-radio-group>
  </Test>
</template>

<script setup>
import Test from './test.vue'

const input = null
const radio1 = null
</script>
<style lang="scss">
 @use "element-plus/theme-chalk/src/index.scss" as *;
</style>
