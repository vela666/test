<script setup>
import { ref, reactive, onMounted } from 'vue'
defineOptions({
  name: 'EditItem',
})
const props = defineProps({
  prev: {
    type: Boolean,
    default: true,
  },
  next: {
    type: Boolean,
    default: true,
  },
  dataId: {
    type: String,
    default: '',
  },
})
const prevInput = ref(null)
const nextInput = ref(null)
const emit = defineEmits([
  'delete-item',
  'click-item',
  'move-left',
  'move-right',
  'click-keyup',
])
const str = ref('')
const noStrInput = () => {
  str.value = ''
}
const deleteItem = (type) => {
  emit('delete-item', { id: props.dataId, type })
}
const clickItem = (type) => {
  emit('click-item', { id: props.dataId, type })
}
const moveCursorLeft = (type) => {
  emit('move-left', { id: props.dataId, type })
}
const moveCursorRight = (type) => {
  emit('move-right', { id: props.dataId, type })
}
const clickKeyup = (e) => {
  if (
    ['(', ')', '+', '-', '*', '/'].includes(e.key) ||
    ((e.ctrlKey || e.metaKey) &&
      (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E')) ||
    /^[0-9.]$/.test(e.key)
  ) {
    emit('click-keyup', { id: props.dataId, key: e.key })
  }
}
// eslint-disable-next-line vue/no-setup-props-destructure
defineExpose({ prevInput, nextInput, id: props.dataId })
</script>

<template>
  <div class="edit-item">
    <input
      v-if="prev"
      ref="prevInput"
      class="edit-item__input"
      type="text"
      v-model="str"
      @input="noStrInput"
      @click.stop="clickItem('prev')"
      @keyup.delete="deleteItem('prev')"
      @keyup.left="moveCursorLeft('prev')"
      @keyup.right="moveCursorRight('prev')"
      @keyup="clickKeyup" />
    <slot></slot>
    <input
      v-if="next"
      ref="nextInput"
      class="edit-item__input"
      type="text"
      v-model="str"
      @input="noStrInput"
      @click.stop="clickItem('next')"
      @keyup.delete="deleteItem('next')"
      @keyup.left="moveCursorLeft('next')"
      @keyup.right="moveCursorRight('next')"
      @keyup="clickKeyup" />
  </div>
</template>

<style scoped lang="scss">
.edit-item {
  display: inline-flex;
  height: 100%;
  align-items: center;
  &__input {
    display: inline-flex;
    text-align: center;
    height: 28px;
    width: 10px;
    background-color: transparent;
    border: 0;
    outline: 0;
    &:focus {
      border-bottom: 1px solid var(--eas-color-primary-disabled);
    }
  }
}
</style>
