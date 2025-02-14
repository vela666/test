<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import useMenu from '@/layouts/hooks/useMenu'
import AppLink from '@/layouts/components/AppLink/index.vue'
import { CaretBottom } from '@element-plus/icons-vue'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  basePath: {
    type: String,
    default: '',
  },
})

const route = useRoute()
const currentPath = computed(() => route.path)
const { onlyOneChild, hasOneShowingChild, resolvePath } = useMenu()

const emit = defineEmits(['changePath'])

const changePath = (onlyOneChild) => {
  emit('changePath', onlyOneChild)
}

defineOptions({
  name: 'NavbarItem',
})
</script>

<template>
  <template v-if="!item.hidden">
    <template
      v-if="
        hasOneShowingChild(item.children, item) &&
        (!onlyOneChild.children?.length || onlyOneChild.noShowingChildren)
      ">
      <AppLink
        class="no-bg"
        v-if="onlyOneChild.meta"
        :to="resolvePath(basePath, onlyOneChild.path)">
        <el-menu-item
          :class="[
            onlyOneChild.meta.hasSubs.includes(currentPath) ||
            resolvePath(basePath, onlyOneChild.path) === route.path
              ? 'is-active'
              : '',
          ]"
          :index="resolvePath(basePath, onlyOneChild.path)">
          <svg-icon
            v-if="onlyOneChild.meta.icon"
            :name="onlyOneChild.meta.icon"
            class="eas-menu-item__icon" />
          <div class="eas-menu-item__title">
            {{ onlyOneChild.meta.title }}
          </div>
        </el-menu-item>
      </AppLink>
    </template>
    <el-sub-menu
      v-else
      :index="resolvePath(basePath, item.path)"
      popper-class="nd-top-sub-menu"
      :expand-close-icon="CaretBottom"
      :expand-open-icon="CaretBottom"
      :class="[item.meta.hasSubs.includes(currentPath) ? 'is-active' : '']">
      <template #title>
        <span class="nd-top-sub-menu-title">{{ item.meta.title }}</span>
      </template>
      <NavbarItem
        v-for="child of item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(basePath, child.path)" />
    </el-sub-menu>
  </template>
</template>

<style scoped lang="scss"></style>
