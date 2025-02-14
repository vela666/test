<template>
  <CommonDialog
    className="nd-user-data-detail-dialog"
    v-model="state.show"
    fullscreen
    :show-close="false"
    :needFooter="false"
    @close="close">
    <template #header>
      <DialogFullScreenHeader
        @close="state.show = false"
        :title="$t('user.userBehaviorSequence')" />
    </template>
    <Detail class="pl20" :userId="state.userId" :fidList="state.fidList" />
  </CommonDialog>
</template>

<script setup>
import { reactive } from 'vue'
import Detail from './Detail.vue'

const initVal = () => {
  return {
    show: false,
    userId: '',
    fidList: [],
  }
}
const state = reactive(initVal())

const close = (val) => {
  Object.assign(state, initVal())
}
const open = (val, list, key = '__fid') => {
  state.show = true
  state.userId = val.__fid
  state.fidList = list.map((item) => item[key])
}
defineExpose({
  open,
})
defineOptions({
  name: 'UserSequence',
})
</script>
