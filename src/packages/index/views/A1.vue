<template>
  <button @click="openModal">打开筛选条件</button>

  <div v-show="showModal" class="modal" :class="{show: showModal}">
    <div class="modal-content">
      <div class="modal-header">
        <span class="cancel" @click="closeModal">取消</span>
        <span class="title">筛选条件</span>
        <span class="apply" @click="applyFilter">应用</span>
      </div>
      <div class="modal-body">
        <div
            class="filter-option"
            v-for="(option, index) in filterOptions"
            :key="index"
            @click="toggleSelect(index)"
        >
          <span>{{ option.label }}</span>
          <span v-if="option.selected" class="selected">默认筛选</span>
        </div>
      </div>
      <div class="modal-footer">
        <div
            class="footer-item"
            v-for="(item, index) in footerItems"
            :key="index"
        >
          <span>{{ item.text }}</span>
          <span v-if="item.selected" class="selected">个人默认筛选</span>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'

const showModal = ref(false) // 控制模态框是否显示
const filterOptions = ref([
  { label: '切换筛选条件', selected: false },
  { label: 'bbb', selected: false },
  { label: 'bbb', selected: false },
  { label: 'aaa', selected: true },
  { label: 'bbb', selected: false },
  { label: 'aaa', selected: true }
])

const footerItems = ref([
  { text: '个人默认筛选', selected: true },
  { text: '其他筛选项', selected: false }
])

// 打开模态框
const openModal = () => {
  showModal.value = true
  console.log(1)
}

// 关闭模态框
const closeModal = () => {
  showModal.value = false
}

// 切换选项选中状态
const toggleSelect = (index) => {
  filterOptions.value[index].selected = !filterOptions.value[index].selected
}

// 应用筛选
const applyFilter = () => {
  console.log('应用筛选条件')
  closeModal() // 应用后关闭模态框
}
</script>

<style >
.modal {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: flex-end;
  z-index: 1000;
  transform: translateY(100%); /* 初始状态：在底部隐藏 */
}

.modal-content {
  max-height: 300px;
  overflow-y: auto;
  background: white;
  width: 100%;
  padding: 20px;
  border-radius: 20px 20px 0 0;
  box-shadow: 0px -2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cancel, .apply {
  cursor: pointer;
  color: blue;
}

.modal-body {
  margin: 20px 0;
}

.filter-option {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
}

.selected {
  font-size: 12px;
  color: grey;
}

.modal-footer {
  display: flex;
  flex-direction: column;
}

.footer-item {
  display: flex;
  justify-content: space-between;
}

/* 动画效果：显示模态框 */
.modal.show {
  transform: translateY(0);
  transition: all 1s ease;
}

</style>