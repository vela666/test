<template>
  <div class="app-main">
    <LeftNav />
    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" />
    </router-view>
  </div>
</template>

<script setup>
import LeftNav from './components/LeftNav.vue'

defineOptions({
  name: 'AppMain',
})
</script>
<style lang="scss">
.app-main {
  display: flex;
  width: 100%;
  //height: calc(100% - var(--eas-header-height));
  height: 100%;
  overflow: hidden;
  background-color: var(--eas-color-primary-light-1);
  > * {
    &:not(.nd-left-nav) {
      &:last-of-type {
        flex: 1;
        padding: 20px;
        overflow: hidden;
        //flex-shrink: 0;
      }
    }
  }
}
</style>
