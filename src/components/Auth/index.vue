<template>
  <slot v-if="hasAuth" :title="hasAuth.title" />
</template>

<script setup>
import { computed } from 'vue'
import useRouteStore from '@/store/modules/route'
/*<Auth value="dashboard:copy">
  取后端返回的文案
  <template #default="{ title }">
      <div>{{
    title
  }}</div>
  </template>
</Auth>*/
const props = defineProps({
  // 权限标识
  value: {
    type: [String, Boolean],
    default: '',
  },
})

const routeStore = useRouteStore()

const hasAuth = computed(() => {
  return routeStore.buttonPermissionsMap[props.value]
})
defineOptions({
  name: 'Auth',
})
</script>
