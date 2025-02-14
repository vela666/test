<script setup>
import { ref, nextTick, watch, computed, useAttrs, onMounted } from 'vue'
import EditItem from './EditItem/index.vue'
import CustomIndexItem from './CustomIndexItem/index.vue'
import { v4 as uuidv4 } from 'uuid'
import { ClickOutside as vClickOutside } from 'element-plus'
import { debounce } from 'lodash-es'
defineOptions({
  name: 'FormulaCode',
})
const attrs = useAttrs()
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'event-change'])

const datas = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val)
  },
})

if (!props.modelValue?.length) {
  datas.value.push({ id: uuidv4(), type: 2, value: {} })
}

// 自定义指标中的事件id集合(数组去重)
const eventIds = computed(() => {
  return getEventIds(datas.value)
})

onMounted(() => {
  document.addEventListener('keydown', function (event) {
    // 检查按下的是否是Control(Ctrl)键和'E'键
    if (event.ctrlKey && (event.key === 'E' || event.key === 'e')) {
      event.preventDefault()
    }
  })
})

watch(eventIds, (newVal, oldVal) => {
  if (!isSameEvents(newVal, oldVal)) {
    emit('event-change', [...new Set(newVal)])
  }
})

function isSameEvents(newVal, oldVal) {
  if (newVal.length !== oldVal.length) return false
  const newStr = [...new Set(newVal)].sort().toString()
  const oldStr = [...new Set(oldVal)].sort().toString()
  return newStr === oldStr
}

// 获取自定义指标中的事件id
function getEventIds(code) {
  const eventIds = []
  if (Array.isArray(code)) {
    for (const item of code) {
      if (item.type === 2) {
        if (item?.value?.events?.eventId) {
          eventIds.push(item.value.events.eventId)
        }
      }
    }
  }
  return eventIds
}

const showKeybord = ref(false)
watch(showKeybord, (val) => {
  if (val) {
    if (datas.value.length > 0) {
      let lastIndex = currentIndex.value
      if (lastIndex == -1) {
        editRef.value?.[0]?.prevInput?.focus()
        return
      } else if (lastIndex < -1) {
        lastIndex = datas.value.length - 1
      }
      editRef.value?.[lastIndex]?.nextInput?.focus()
    }
  } else {
    currentIndex.value = -2
    inputNum.value = 0
  }
})

const closeKeybord = () => (showKeybord.value = false)
const currentIndex = ref(-2)
const editRef = ref(null)
const clickBoxHandler = (e) => {
  if (e?.target?.className?.split(' ')?.includes('eas-drop-box')) return
  showKeybord.value = true
  const lastIndex = datas.value.length - 1
  //if (currentIndex.value === -2 || lastIndex < 0) {
  currentIndex.value = lastIndex
  moveCursorNextInput()
  //}
}
const symbolArr = ['+', '-', '*', '/', '(', ')']

const numInputRef = ref([])

// 插入一项
const insertItem = (item) => {
  const curIdx = currentIndex.value
  if (datas.value.length >= 1 && datas.value.every((e) => e.type === 0)) {
    //清空初始状态下空值
    datas.value = datas.value.filter((e) => e.type !== 0)
  }
  nextTick(() => {
    if (curIdx < -1) {
      datas.value.push(item)
    } else {
      datas.value.splice(curIdx + 1, 0, item)
    }
    const index = datas.value.findIndex((el) => el.id === item.id)
    currentIndex.value = index
    nextTick(() => {
      if (item.type === 1 && !symbolArr.includes(item.value)) {
        //数值光标自动移动至输入框
        numInputRef.value[index]?.focus()
      } else {
        if (Array.isArray(editRef.value)) {
          moveCursorNextInput()
        } else {
          editRef.value?.nextInput?.focus()
        }
      }
    })
  })
}

const clickKeyup = ({ key }) => {
  if (key === 'e' || key === 'E') {
    addEventIndex()
  }
  if (key === 'q' || key === 'Q' || /^[0-9.]$/.test(key)) {
    addNum(/^[0-9.]$/.test(key) ? key : '')
  } else {
    addSymbol(key)
  }
}

const clickInputKeyup = (e, item) => {
  if (
    ['(', ')', '+', '-', '*', '/'].includes(e.key) ||
    ((e.ctrlKey || e.metaKey) &&
      (e.key === 'q' || e.key === 'Q' || e.key === 'e' || e.key === 'E'))
  ) {
    clickKeyup({ key: e.key })
  } else if (e.keyCode === 8) {
    // Backspace
    if (item.value === '') {
      cliclDelete()
    }
  }
}

const clickNumInputStop = (index, item) => {
  showKeybord.value = true
  currentIndex.value = datas.value.findIndex((el) => el.id === item.id)
  nextTick(() => {
    numInputRef.value[index]?.focus()
  })
}

const setInputNum = debounce((id, index) => {
  if (datas.value[index] && datas.value[index].id === id) {
    let val = datas.value[index].value
    val = String(val).replace(/^0{1,}/g, '0')
    val = val.replace(/^\./g, '0.')
    datas.value[index].value = val.replace(/^\D*(\d*(?:\.\d*)?).*$/g, '$1')
  }
}, 300)

// 添加四则运算符
const addSymbol = (str) => {
  if (!symbolArr.includes(str)) return
  insertItem({ id: uuidv4(), type: 1, value: str })
}

//添加事件指标
const addEventIndex = () => {
  insertItem({ id: uuidv4(), type: 2, value: {} })
}

const inputNum = ref(0)
// 添加数值
const addNum = (key) => {
  inputNum.value = key || ''
  insertItem({ id: uuidv4(), type: 1, value: inputNum.value })
}

//清空
const clearAll = () => {
  datas.value = []
  nextTick(() => {
    insertItem({ id: uuidv4(), type: 0, value: '' })
  })
}

// 根据id获取对应的input的ref
function getEditRefById(id) {
  let find = undefined
  if (Array.isArray(editRef.value)) {
    find = editRef.value.find((el) => el.id === id)
  }
  return find
}

// nextInput移动光标
function moveCursorNextInput() {
  const curId = datas.value[currentIndex.value]?.id
  const curEditRef = getEditRefById(curId)
  curEditRef?.nextInput?.focus()
}

// 实体键盘上的 按钮backspace、delete
const deleteItem = ({ id, type }) => {
  const index = datas.value.findIndex((el) => el.id === id)
  const firstPre = index === 0 && type === 'prev'
  if (firstPre) return
  datas.value.splice(index, 1)
  currentIndex.value = index - 1
  nextTick(() => {
    if (currentIndex.value > -1) {
      moveCursorNextInput()
    } else if (currentIndex.value == -1) {
      editRef.value?.[0]?.prevInput?.focus()
    }
    if (!datas.value.length) {
      nextTick(() => {
        insertItem({ id: uuidv4(), type: 0, value: '' })
      })
    }
  })
}

//点击展示下拉操作面板
const clickHandle = ({ id, type }) => {
  if (!showKeybord.value) showKeybord.value = true
  const index = datas.value.findIndex((el) => el.id === id)
  const firstPre = index === 0 && type === 'prev'
  currentIndex.value = firstPre ? -1 : index
}

//点击 <- 移动焦点
const moveCursorLeft = ({ id, type }) => {
  if (currentIndex.value < 0) return
  const index = datas.value.findIndex((el) => el.id === id)
  const firstPre = index === 0 && type === 'prev'
  if (firstPre) return
  nextTick(() => {
    if (index === 0 && type === 'next') {
      editRef.value?.[0]?.prevInput?.focus()
      currentIndex.value = -1
    } else {
      currentIndex.value = index - 1
      moveCursorNextInput()
    }
  })
}

//点击 -> 移动焦点
const moveCursorRight = ({ id, type }) => {
  if (currentIndex.value < -1) return
  const lastIndex = datas.value.length - 1
  const index = datas.value.findIndex((el) => el.id === id)
  const lastNext = index === lastIndex && type === 'next'
  if (lastNext) return
  if (index === 0 && type === 'prev') {
    currentIndex.value = 0
  } else {
    currentIndex.value = index + 1
  }
  nextTick(() => {
    moveCursorNextInput()
  })
}

// 点击Delete按钮触发
const cliclDelete = () => {
  if (currentIndex.value <= -1) return
  datas.value.splice(currentIndex.value, 1)
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
    moveCursorNextInput()
  } else if (currentIndex.value === 0) {
    const len = datas.value.length
    if (len > 0) {
      nextTick(() => {
        editRef.value?.[currentIndex.value]?.prevInput?.focus()
      })
    } else {
      currentIndex.value -= 2
    }
  }
  if (!datas.value.length) {
    nextTick(() => {
      insertItem({ id: uuidv4(), type: 0, value: '' })
    })
  }
}

defineExpose({ showKeybord })
</script>

<template>
  <div>
    <div
      :class="[
        'formula',
        { 'empty-code': datas.length === 0 },
        { editing: showKeybord },
      ]"
      v-click-outside="closeKeybord">
      <div
        class="formula-code"
        @click.stop="clickBoxHandler"
        :placeholder="$t('analysis.indicators')">
        <edit-item
          ref="editRef"
          v-for="(item, index) in datas"
          :key="item.id"
          :prev="index === 0"
          :dataId="item.id"
          @delete-item="deleteItem"
          @click-item="clickHandle"
          @move-left="moveCursorLeft"
          @move-right="moveCursorRight"
          @click-keyup="clickKeyup">
          <div
            v-if="item.type == 1 && symbolArr.includes(item.value)"
            class="show-item symbol-num">
            {{ item.value }}
          </div>
          <span
            v-else-if="item.type == 1 && !symbolArr.includes(item.value)"
            class="flex-center">
            <span class="code-item-num">
              <span class="code-item-num-content">{{ item.value }}</span>
              <span class="code-item-num-input">
                <el-input
                  :ref="(ref) => (numInputRef[index] = ref)"
                  type="text"
                  v-model="item.value"
                  @click.stop="clickNumInputStop(index, item)"
                  @input="setInputNum(item.id, index)"
                  @keyup="(e) => clickInputKeyup(e, item)"
                  style="height: 28px" />
              </span>
            </span>
          </span>
          <div v-else-if="item.type == 2" class="show-item">
            <CustomIndexItem v-bind="attrs" v-model="item.value" />
          </div>
        </edit-item>
      </div>
      <div class="opration-panel" v-if="showKeybord">
        <div class="keyboard">
          <div class="keyboard_area">
            <div>
              <button
                class="keyboard_btn is_symbol"
                v-for="(item, index) in symbolArr"
                :key="`is_symbol_${index}`"
                @click="addSymbol(item)">
                {{ item }}
              </button>
            </div>
            <button class="keyboard_btn del_btn" @click="cliclDelete">
              Delete
            </button>
          </div>
          <div class="keyboard_area">
            <div class="flex-center">
              <button
                class="keyboard_btn join_item join_event mr20"
                @click="addEventIndex">
                {{ $t('analysis.addEvent') }}(Ctrl + E)
              </button>
              <div class="flex-center">
                <button
                  class="keyboard_btn join_item join_event left-radius"
                  @click="addNum()">
                  {{ $t('analysis.addNumber') }}(Ctrl + Q)
                </button>
              </div>
            </div>
            <button class="keyboard_btn clear_btn" @click="clearAll">
              {{ $t('btn.clearAction') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <slot name="append" />
  </div>
</template>

<style scoped lang="scss">
.flex-center {
  display: flex;
  align-items: center;
}
.formula {
  min-height: 40px;
  position: relative;
  border: 1px solid transparent;
  color: var(--eas-text-color-primary);
  border-bottom-color: var(--eas-color-primary-light);
  &.empty-code {
    border-color: var(--eas-color-danger);
  }
  &.editing {
    border-color: transparent;
    border-bottom-color: var(--eas-color-primary);
  }
}
.formula-code {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  min-height: 38px;
  :deep(.edit-item) {
    height: 38px;
  }
  &:empty::after {
    content: attr(placeholder);
    color: var(--eas-text-color-light-1);
  }
}
.show-item {
  height: 28px;
  display: inline-flex;
  align-items: center;
}

.opration-panel {
  position: absolute;
  z-index: 2000;
  top: calc(100% + 2px);
  left: 0px;
  min-width: 380px;
  width: 100%;
  height: 116px;
  background-color: #fff;
  box-shadow: 0px 3px 6px 1px rgba(42, 51, 84, 0.09);
  border-radius: 0px 0px 4px 4px;
}
.keyboard {
  width: 100%;
  height: 100%;
  padding: 20px;
  &_area {
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    &:not(:last-child) {
      margin-bottom: 20px;
    }
  }
}
.keyboard_btn {
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: var(--eas-hover-color-1);
  color: var(--eas-text-color-primary);
  border-radius: var(--eas-border-radius-4);
  border: none;
  cursor: pointer;
  &:active {
    color: #fff;
    background-color: var(--eas-color-primary);
  }
  &.is_symbol {
    width: 28px;
    line-height: 28px;
    &:not(:last-child) {
      margin-right: 16px;
    }
  }
  &.del_btn {
    width: 75px;
  }
  &.left-radius {
    border-radius: var(--eas-border-radius-4) 0 0 var(--eas-border-radius-4);
  }
}
.join_item {
  width: 88px;
  :deep() {
    .el-input__wrapper {
      padding: 1px 5px;
      border-radius: 0 var(--eas-border-radius-4) var(--eas-border-radius-4) 0;
    }
    .el-input__inner {
      height: 26px;
      text-align: inherit;
    }
    .el-input-number__decrease,
    .el-input-number__increase {
      display: none;
    }
  }
}
.join_event {
  width: 150px;
}
.clear_btn {
  width: 75px;
}

/**自适应宽度的输入框**/
.code-item-num {
  position: relative;
  display: inline-block;
  height: 28px;
  &-content {
    display: inline-block;
    height: 28px;
    min-width: 30px;
    opacity: 0;
    padding: 0 12px;
  }
  &-input {
    position: absolute;
    left: 0;
    top: 0;
    display: inline-block;
    width: 100%;
    min-width: 30px;
    opacity: 1;
    :deep() .el-input__inner {
      height: 28px;
      line-height: 28px;
    }
  }
}
</style>
