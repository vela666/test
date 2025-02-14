<template>
  <el-form-item :label="$t('user.updateMethod')" class="m0 mb10">
    <el-radio-group v-model="refreshTypeVal">
      <el-radio-button :label="0" :value="0">{{
        $t('user.manualUpdate')
      }}</el-radio-button>
      <el-radio-button :label="1" :value="1">{{
        $t('user.automaticUpdate')
      }}</el-radio-button>
    </el-radio-group>
  </el-form-item>
  <div class="nd-upd-way-tip" v-if="refreshTypeVal === 0">
    {{ $t('user.manualUpdateMsg') }}
  </div>
  <div v-else>
    <!-- <el-input v-model="groupForm.qp" placeholder="分钟" clearable />  -->
    <el-radio-group v-model="accumulationVal">
      <el-radio :value="0">{{ $t('user.cover') }}</el-radio>
      <el-radio :value="1">{{ $t('user.increment') }}</el-radio>
    </el-radio-group>
    <div class="nd-upd-way-tip">
      <div>{{ $t('user.dailyUpdateTask', [text || $t('user.group')]) }}</div>
      <div class="mt10" v-if="show">
        {{ $t('user.coverAndIncrementMsg') }}
      </div>
    </div>
  </div>
  <template v-if="show && refreshTypeVal === 1 && accumulationVal === 1">
    <el-form-item
      :label="$t('user.removeSth', [text || $t('user.group')])"
      class="m0 mt20">
      <el-switch v-model="switchVal" />
    </el-form-item>
    <div
      class="flex-center c545e6e fz14"
      style="white-space: nowrap"
      v-if="switchVal">
      {{ $t('user.usersExceeding') }}
      <CommonInput
        class="w80 ml5 mr5"
        :prefixSlot="false"
        trimAllSpace
        :clearable="false"
        @input="inputFn"
        v-model="dayVal" />
      {{ $t('user.removedGroup', [text || $t('user.group')]) }}
    </div>
  </template>
</template>

<script setup>
import { matchNotNumberRegex } from '@/utils/regExp'
const props = defineProps({
  show: {
    type: Boolean,
    // 后端未做暂时隐藏
    default: false,
  },
  text: {
    type: String,
    default: '',
  },
})
const refreshTypeVal = defineModel('refreshType', {
  type: [String, Number],
  default: 0,
})

const accumulationVal = defineModel('accumulation', {
  type: [String, Number],
  default: 0,
})

const switchVal = defineModel('switch', {
  type: Boolean,
  default: false,
})

const dayVal = defineModel('day', {
  type: [String, Number],
  default: 30,
})
const inputFn = (v) => {
  let val = +v.replace(matchNotNumberRegex, '')
  val = val > 999 ? 999 : val < 1 ? 1 : val
  dayVal.value = val
}

defineOptions({
  name: 'UpdateWay',
})
</script>

<style scoped lang="scss">
.nd-upd-way-tip {
  padding: 10px;
  width: 360px;
  min-height: 36px;
  background-color: var(--eas-color-primary-light-1);
  border-radius: 4px;
  font-size: 12px;
  color: var(--eas-text-color);
}
</style>
