<template>
  <div class="detail-page__container flex-column">
    <header class="detail-page__header flex-center flex-between mb20 c545e6e">
      <div class="flex-center">
        <span
          class="header-left flex-center c545e6e"
          @click="$router.go(-1)"
          :underline="false">
          <el-icon class="fz18 mr3"><ArrowLeft /></el-icon>
          <span>{{ $t('common.back') }}</span>
        </span>
        <el-divider direction="vertical" style="margin: 0 20px" />
        <el-breadcrumb separator="/">
          <el-breadcrumb-item>
            <a @click="handleLink">
              {{ route.meta?.parent.title }}
            </a>
          </el-breadcrumb-item>
          <el-breadcrumb-item>
            {{ title || route.meta.title }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <slot name="detail-r" />
    </header>
    <slot />
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const props = defineProps({
  title: {
    type: [String, Number],
    default: '',
  },
})

const handleLink = () => {
  router.push(route.meta?.parent?.path)
}
</script>

<style lang="scss" scoped>
.detail-page {
  &__container {
    padding: 20px;
  }
}
.header-left {
  cursor: pointer;
  > span {
    position: relative;
    top: 1px;
  }
  &:hover {
    color: var(--eas-color-primary);
  }
}
:deep() {
  .el-breadcrumb__inner a,
  .el-breadcrumb__inner.is-link {
    font-weight: normal;
    color: var(--eas-text-color-primary);
    &:hover {
      color: var(--eas-color-primary);
    }
  }
}
</style>
