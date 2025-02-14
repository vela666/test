<template>
  <slot v-if="hasAuth.show" :title="hasAuth.title" />
</template>

<script setup>
import { computed } from 'vue'
import useRouteStore from '@/store/modules/route'
// 一般用于更多操作按钮
// 要用后端返回的文案的话 建议按页面上按钮顺序传递权限标识
/*<Auths :value="['dashboard:copy','dashboard:addFile','dashboard:addDash']">
<template #default="{ title }">
    <el-button>{{
  title
}}</el-button>
</template>
</Auths>*/

const props = defineProps({
  // 权限标识
  value: {
    type: Array,
    default() {
      return []
    },
  },
  // 多个权限验证
  // false 满足一个则显示
  // true 全部满足则显示
  allExist: {
    type: Boolean,
    default: false,
  },
})

const routeStore = useRouteStore()

const hasAuth = computed(() => {
  const show = props.value[props.allExist ? 'every' : 'some']((k) => {
    return Object.keys(routeStore.buttonPermissionsMap).includes(k)
  })
  const title = props.value.reduce((p, c) => {
    p.push(routeStore.buttonPermissionsMap[c]?.title)
    return p
  }, [])

  return {
    show,
    title,
  }
})
defineOptions({
  name: 'Auths',
})
</script>
