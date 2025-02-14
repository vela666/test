<script setup>
import { isExternal } from '@/utils'

const props = defineProps({
  to: {
    type: String,
    required: true,
  },
})

const handleHref = () => {
  return props.to + '?virtualAppId=' + sessionStorage.getItem('appId')
}

defineOptions({
  name: 'AppLink',
})
</script>

<template>
  <a
    class="no-active"
    v-if="isExternal(to, false)"
    :href="to"
    target="_blank"
    rel="noopener"
    v-bind="$attrs">
    <slot />
  </a>
  <router-link v-else :to="handleHref()" v-bind="$attrs">
    <slot />
  </router-link>
</template>

<style scoped lang="scss">
.no-active {
  :deep(.is-active) {
    color: var(--el-menu-text-color) !important;
    &:after {
      display: none;
    }
  }
}
</style>
