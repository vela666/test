<script setup>
import imgsrc from '@/assets/images/no_permission.png'
defineOptions({
  name: 'NoPermission',
})
</script>

<template>
  <div class="no-permission">
    <img :src="imgsrc" />
    <div class="desc-text">
      <div>您没有该页面的访问权限</div>
      <div class="mt14">联系管理员开通权限</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.no-permission {
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
.desc-text {
  position: relative;
  margin-top: -30px;
}
</style>
