<script setup>
import { ref, reactive, onMounted } from 'vue'
import Navbar from './components/Navbar/index.vue'
import AppMain from './components/AppMain/index.vue'
defineOptions({
  name: 'Layout',
})
</script>

<template>
  <Navbar />
  <AppMain />
</template>

<style scoped lang="scss"></style>
