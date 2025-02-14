<script setup>
import { h, ref, onMounted, onBeforeUnmount } from 'vue'
import { ElNotification } from 'element-plus'

import { useI18n } from 'vue-i18n'
const { t } = useI18n() // 使用useI18n钩子获取国际化t函数

//微前端
import microApp, { version } from '@micro-zoe/micro-app'
microApp.start()

const timer = ref()
const currentVersion = ref()

onMounted(() => {
  getVersion()
  timer.value = setInterval(() => {
    getVersion('check')
  }, 300000)
})

onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

const getVersion = (type) => {
  const script = document.createElement('script')
  script.src = `./version.js?t=${new Date().getTime()}`
  script.onload = () => {
    /* eslint-disable no-undef */
    const newVersion = easpro_version
    // 当脚本加载完成后，你可以直接访问myVariable
    if (type && currentVersion.value !== newVersion) {
      newEL()
    } else {
      currentVersion.value = newVersion
    }
    document.head.removeChild(script)
  }
  document.head.appendChild(script)
}

const newEL = () => {
  ElNotification({
    type: 'success',
    title: t('login.newVersion'),
    position: 'bottom-right',
    duration: 290000,
    message: h('span', null, [
      h('span', null, t('login.versionUpdated')),
      h(
        'a',
        {
          onClick: () => {
            window.location.reload(true)
          },
          style: 'cursor:pointer;color:#409EFF;',
        },
        t('login.clickRefresh')
      ),
    ]),
  })
}
</script>

<template>
  <router-view />
</template>
