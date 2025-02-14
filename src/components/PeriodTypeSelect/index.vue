<template>
  <DropDownPopoverSelection
    v-model:visible="state.visible"
    trigger="click"
    persistent
    className="nd-period-type-select">
    <div
      :style="`height:${h}`"
      class="nd-period-type-select-label"
      :class="{ 'not-border': !showBorder, 'is-show-menu': state.visible }">
      {{ timeTypeListMap[state.particle] }}
      <!--      <el-icon v-show="showBorder" :class="{ 'is-rotate': state.visible }"-->
      <el-icon class="ml5" v-show="showBorder"><ArrowDown /></el-icon>
    </div>
    <template #content>
      <div
        v-for="item of timeTypeArr"
        :key="item.type"
        class="flex-center"
        :class="[state.particle === item.type ? 'yf-particle-sel' : '']"
        @click="changeValue(item)">
        <span>{{ item.label }}</span>
        <div class="nd-week-set" v-if="item.type === 'week'">
          <SvgIcon
            name="calendar1"
            class="ml5 elem-hover"
            @click.stop="changeWeek" />
          <!-- @click.stop="" 阻止 el-dropdown-menu 默认的点击关闭 -->
          <div v-show="state.showWeek" class="nd-week-set-body" @click.stop>
            <div class="nd-week-title">{{ $t('common.customWeek') }}</div>

            <i18n-t
              keypath="periodTypeSelect.weekStartDay"
              tag="div"
              class="nd-week-desc">
              <template #weekDay>
                <span class="c545e6e ml5 mr5">{{
                  weekListMap[state.weekDay]
                }}</span>
              </template>
            </i18n-t>

            <div class="nd-weeks-content">
              <div
                v-for="week of weekList"
                :key="week.type"
                :class="[
                  'nd-weeks-list',
                  state.weekDay === week.type ? 'nd-weeks-active' : '',
                ]"
                @click.stop="selectWeekDay(week)">
                <span>{{ week.label }}</span>
              </div>
            </div>
            <div class="nd-week-btns">
              <el-button plain @click="weekCancel">{{
                $t('btn.cancel')
              }}</el-button>
              <el-button type="primary" @click="weekConfirm(item.type)"
                >{{ $t('btn.confirm') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </DropDownPopoverSelection>
</template>

<script setup>
import { reactive, computed, watch, ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import {
  timeTypeList,
  timeTypeListMap,
  weekList,
  weekListMap,
} from '@/enumeration/date'

const props = defineProps({
  h: {
    type: String,
    default: '32px',
  },
  // { particle: 'day' }
  modelValue: {
    type: Object,
    default() {
      return {}
    },
  },
  // ['day','minute','hour','week','month','summary']
  limit: {
    type: Array,
    default() {
      return []
    },
  },
  showBorder: {
    type: Boolean,
    default: true,
  },
})
const emit = defineEmits(['update:modelValue', 'change'])

const state = reactive({
  visible: false,
  particle: 'day',
  showWeek: false,
  firstDayOfWeek: 1,
  weekDay: 1,
})
const timeTypeArr = computed(() => {
  if (!props.limit.length) return timeTypeList
  return timeTypeList.filter((item) => {
    return props.limit.includes(item.type)
  })
})

const updVal = () => {
  const newObj = { particle: state.particle }
  if (state.particle === 'week') {
    newObj.firstDayOfWeek = state.firstDayOfWeek
  }
  emit('update:modelValue', newObj)
  emit('change', {
    particle: state.particle,
    firstDayOfWeek: state.firstDayOfWeek,
  })
}

const changeValue = (item) => {
  state.particle = item.type
  state.visible = false
  updVal()
}
const changeWeek = () => {
  state.showWeek = !state.showWeek
  if (!state.showWeek) state.visible = false
  state.weekDay = state.firstDayOfWeek
}
const selectWeekDay = (item) => {
  state.weekDay = item.type
}
const weekCancel = () => {
  state.showWeek = false
  state.visible = false
}
const weekConfirm = (particle) => {
  state.firstDayOfWeek = state.weekDay
  state.particle = particle
  state.showWeek = false
  state.visible = false
  updVal()
}

watch(
  () => props.modelValue,
  (val) => {
    state.particle = val.particle
    state.firstDayOfWeek = val.firstDayOfWeek || 1
  },
  {
    immediate: true,
  }
)

/*watch(
  () => state.particle,
  (val) => {
    console.log(val, ' asda')
    const newObj = { particle: val }
    if (val === 'week') {
      newObj.firstDayOfWeek = state.firstDayOfWeek
    }
    emit('update:modelValue', newObj)
  }
)*/
defineOptions({
  name: 'PeriodTypeSelect',
})
</script>

<style lang="scss">
.nd-period-type-select {
  height: auto;
  overflow: visible !important;
  max-height: none !important;
}
</style>
<style lang="scss" scoped>
.nd-week-set {
  position: relative;
}
.nd-period-type-select-label {
  position: relative;
  display: flex;
  padding: 10px;
  align-items: center;
  color: var(--eas-text-color-primary);
  font-size: 14px;
  background-color: #fff;
  cursor: pointer;
  user-select: none;
  border-radius: 4px;
  border: 1px solid var(--eas-text-color-light-1);

  &:hover {
    border-color: var(--eas-color-primary);
  }

  &.is-show-menu {
    border-color: var(--eas-color-primary);
  }

  /* > i {
    transition: all 0.3s;
  }
  .is-rotate {
    transform: rotate(180deg);
  }*/
}

.nd-week-set-body {
  position: absolute;
  top: 0;
  left: 81px;
  width: 288px;
  background-color: #fff;
  border-radius: 4px;
  cursor: default;
  box-shadow: 0 3px 6px 1px rgba(28, 32, 40, 0.18);

  .nd-week-title {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 10px;
    color: var(--eas-text-color-primary);
    font-weight: 500;
    font-size: 14px;
  }

  .nd-week-desc {
    margin-top: 5px;
    margin-bottom: 5px;
    //display: flex;
    //align-items: center;
    //justify-content: flex-start;
    padding: 0 10px;
    color: var(--eas-text-color-primary);
    font-size: 14px;
  }

  .nd-weeks-content {
    position: relative;
    display: flex;
    flex-wrap: wrap;
    padding: 0 10px;
    gap: 10px;

    .nd-weeks-list {
      display: flex;
      height: 30px;
      align-items: center;
      justify-content: center;
      color: var(--eas-text-color-primary);
      font-size: 14px;
      padding: 0 7px;
      border: 1px solid var(--eas-border-color);
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        border-color: var(--eas-color-primary);
      }
    }

    .nd-weeks-active {
      border-color: var(--eas-color-primary);
    }
  }

  .nd-week-btns {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 10px;
    margin-top: 10px;
    border-top: 1px solid var(--eas-border-color);
  }
}

.not-border {
  border: none !important;
  padding: 0 !important;
}
</style>
