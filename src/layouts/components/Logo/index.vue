<script setup>
import imgLogo from '@/assets/images/logo-1.png'
defineOptions({
  name: 'Logo',
})
</script>

<template>
  <img :src="imgLogo" class="logo" width="100%" height="64" />
</template>

<style scoped lang="scss">
.logo {
  // margin-right: 20px;
}
</style>
