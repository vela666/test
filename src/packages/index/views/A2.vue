<template>
  <hr />

  <span>选中的值为: {{ renderColumns[selected]?.label }}</span>

  <hr />
  <div class="picker_container">
    <div class="title_box">
      <span>取消</span>
      <span>{{ title }}</span>
      <span>确定</span>
    </div>
    <div class="mask"></div>
    <div
      class="picker_box"
      @scroll="scroll"
      @scrollend="scrollend"
      ref="pickerRef"
    >
      <div
        class="item"
        v-for="(item, index) in renderColumns"
        :key="index"
        :class="item.id === selected ? 'current' : ''"
      >
        {{ item.label }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, toRefs, computed, ref, watch } from 'vue'

const state = reactive({
  title: '测试',
  columns: [],
  // 选中项
  selected: ''
})
const { title, selected } = toRefs(state)
const renderColumns = computed(() => {
  if (state.columns.length) {
    const empty = {
      label: '',
      id: ''
    }
    return [empty, ...state.columns, empty]
  } else {
    return []
  }
})

watch(
  () => state.columns.length,
  () => {
    if (state.columns.length) {
      state.selected = state.columns[0].id
    }
  }
)

setTimeout(() => {
  open()
}, 10)

function open() {
  state.columns = [
    {
      label: '北京',
      id: 1
    },
    {
      label: '武汉',
      id: 2
    },
    {
      label: '深圳',
      id: 3
    },
    {
      label: '泰国',
      id: 4
    },
    {
      label: '新加坡',
      id: 5
    }
  ]
}

// 滚动事件
const pickerRef = ref()
let timer = null

function scroll(ev) {
  const scroll = pickerRef.value.scrollTop
  const index = Math.round(scroll / 60)
  state.selected = renderColumns.value[index + 1].id
}

function scrollend() {
  const scroll = pickerRef.value.scrollTop
  const index = Math.round(scroll / 60)
  state.selected = renderColumns.value[index + 1].id
  if (scroll / 60) {
    pickerRef.value.scrollTop = index * 60
  }
}
</script>

<style lang="scss" scoped>
.picker_container {
  position: fixed;
  bottom: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 220px;

  .title_box {
    height: 40px;
    background-color: #999;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 12px;

    span:nth-child(1) {
      color: #ccc;
    }

    span:nth-child(2) {
      color: #666;
    }

    span:nth-child(3) {
      color: #000;
    }
  }

  .mask {
    position: absolute;
    top: 100px;
    left: 0;
    height: 60px;
    width: 100%;
    z-index: 1;
    background-color: rgba(255, 192, 203, 0.3);
    mix-blend-mode: darken;
  }

  .picker_box {
    position: absolute;
    top: 40px;
    left: 0;
    height: 180px;
    width: 100%;
    overflow-y: scroll;
    scroll-behavior: smooth;
    z-index: 2;

    .item {
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .item + .item {
      color: orange;
    }

    .current {
      font-weight: 600;
      font-size: 22px;
      color: #000 !important;

      & + .item {
        color: orange;
      }
    }
  }
}

hr {
  margin: 40px 0;
}
</style>
