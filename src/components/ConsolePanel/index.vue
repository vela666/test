<template>
  <teleport to="body">
    <section
      class="console-panel"
      :class="{ 'console-panel-visible': visible }"
      :data-position="position">
      <el-scrollbar height="100%">
        <table>
          <tr v-for="(item, key) of data" :key="key">
            <td>{{ key }}</td>
            <td>
              <div style="white-space: pre-wrap">
                {{ item }}
              </div>
            </td>
          </tr>
        </table>
      </el-scrollbar>

      <div class="switch" @click="visible = !visible">
        {{ visible ? '收起' : '展开' }}
      </div>
    </section>
  </teleport>
</template>

<script setup>
// 展示数据
import { ref } from 'vue'

const props = defineProps({
  position: {
    type: String,
    default: 'right',
  },
  width: {
    type: String,
    default: '30%',
  },
  data: {
    type: Object,
    default() {
      return {}
    },
  },
})

const visible = ref(true)

defineOptions({
  name: 'ConsolePanel',
})
</script>

<style lang="scss" scoped>
.console-panel {
  position: fixed;
  z-index: 9999;
  width: 0;
  background-color: rgba(0, 0, 0, 0.8);
  transition: all 0.2s linear;

  &[data-position='right'] {
    top: 0;
    right: 0;
    bottom: 0;

    .switch {
      right: auto;
      left: -50px;
      border-radius: 15px 0 0 15px;
    }
  }
  &[data-position='left'] {
    top: 0;
    left: 0;
    bottom: 0;

    .switch {
      right: -50px;
      left: auto;
      border-radius: 0 15px 15px 0;
    }
  }

  &.console-panel-visible {
    width: 30%;
  }

  table {
    width: 100%;

    tr + tr {
      border-top: 1px solid rgba(255, 255, 255, 0.5);
    }

    td {
      padding: 0 0.5em;
      vertical-align: middle;
      color: #fff;

      &:first-child {
        background-color: rgba(0, 0, 0, 1);
      }

      & + td {
        border-left: 1px solid rgba(255, 255, 255, 0.5);
      }
    }
  }

  .switch {
    position: absolute;
    bottom: 0;
    left: -50px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 50px;
    height: 30px;
    background-color: black;
    border-top-left-radius: 15px;
    border-bottom-left-radius: 15px;
    cursor: pointer;
    color: #fff;
  }
}
</style>
