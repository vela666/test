<template>
  <micro-app
    class="h100-percentage"
    name="operate"
    :data="{
      userInfo: {
        ...toRefs(userStore.userInfo),
        localTokenNameKey,
        localTokenKey,
        localUserIdKey,
        locationOrigin,
      },
      generateVersionUrl,
      resetInfo,
    }"
    :url="url"></micro-app>
</template>

<script setup>
import { toRefs } from 'vue'
import useUserStore from '@/store/modules/user.js'
import {
  localTokenNameKey,
  localTokenKey,
  localUserIdKey,
  locationOrigin,
} from '@/enumeration/auth.js'
import {
  domesticOverseasMark,
  generateVersionUrl,
} from '@/utils/domesticOverseas.js'

const url = import.meta.env[`VITE_APP_EXTERNAL_API_${domesticOverseasMark()}`]

const userStore = useUserStore()
const resetInfo = async () => {
  await userStore.resetUser()
  location.reload()
}
defineOptions({
  name: 'DataOperation',
})
</script>

<style scoped lang="scss"></style>
