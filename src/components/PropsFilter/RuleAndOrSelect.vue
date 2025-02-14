<template>
  <div v-if="containerShow" class="nd-and-or-condition">
    <div class="nd-and-or-line" />
    <div class="nd-and-or-container" v-if="addOrShow">
      <span
        v-for="item of 2"
        :key="item"
        @click="value = item - 1"
        :class="[
          value === item - 1 ? 'nd-and-or-container-text-active' : '',
          'nd-and-or-container-text',
        ]"
        >{{ t(`common.${item - 1 === 0 ? 'and' : 'or'}`) }}</span
      >
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: [Number, String],
    default: 0,
  },
  addOrShow: {
    type: Boolean,
    default: true,
  },
  containerShow: {
    type: Boolean,
    default: true,
  },
})
const emit = defineEmits(['update:modelValue'])

const value = computed({
  get() {
    return +props.modelValue
  },
  set(val) {
    emit('update:modelValue', +val)
  },
})

watch(
  () => [props.addOrShow, props.containerShow],
  (val) => {
    if (val.includes(false)) {
      value.value = 0
    }
  }
)

defineOptions({
  name: 'RuleAndOrSelect',
})
</script>

<style scoped lang="scss">
.nd-and-or-condition {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 24px;
  margin-right: 15px;
  .nd-and-or-line {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 1px;
    height: 100%;
    background-color: #d9dfe6;
  }
  &:hover {
    .nd-and-or-line {
      background-color: var(--eas-color-primary);
    }
  }
  .nd-and-or-container {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 50%;
    left: 0;
    cursor: pointer;
    transform: translateY(-50%);

    .nd-and-or-container-text {
      position: relative;
      width: 22px;
      height: 22px;
      line-height: 22px;
      text-align: center;
      background: var(--eas-color-primary-light-1);
      border: 1px solid var(--eas-text-color-light-1);
      font-size: 12px;

      &:first-of-type {
        top: 1px;
        border-radius: 2px 2px 0 0;
      }

      &:last-of-type {
        border-radius: 0 0 2px 2px;
      }

      &.nd-and-or-container-text-active {
        color: var(--eas-color-primary);
        border-color: var(--eas-color-primary);
        z-index: 1;
      }
    }
  }
}
</style>
