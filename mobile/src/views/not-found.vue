<script setup>
import imgsrc from '@/assets/images/not_found.png'
defineOptions({
  name: 'NotFound',
})
</script>
<template>
  <div class="notfound">
    <img :src="imgsrc" />
    <div class="desc-text">
      <div style="margin-bottom: 25px">{{ $t('login.pageNotExist') }}</div>
      <el-button type="primary" @click="$router.replace('/')">
        {{ $t('login.returnImmediately') }}
      </el-button>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.notfound {
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  text-align: center;
  color: var(--eas-text-color-primary);
  font-size: var(--eas-font-size-medium);
  font-weight: var(--eas-font-weight-400);
  user-select: none;
}
</style>
