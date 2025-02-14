<template>
  <el-pagination
    v-show="!!total"
    ref="pagination"
    class="nd-pagination-container"
    :background="background"
    :current-page="currentPage"
    :layout="layoutItem"
    :page-size="pageSize"
    :page-sizes="pageSizes"
    :small="small"
    :total="total"
    v-bind="attrs"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange">
    <template #default>
      <span class="custom-footer-pagination" v-if="totalCount">
        {{
          $t('common.maximumPieces', [totalCount.toLocaleString(), maxCount])
        }}
      </span>
    </template>
  </el-pagination>
</template>

<script setup>
/*
 用法
<Pagination
    v-model:limit="pagingConfig.pageSize"
    v-model:page="pagingConfig.page"
        :total="pagingConfig.total"
@getData="getTableData"
    />
*/
import { computed, useAttrs } from 'vue'
const attrs = useAttrs()
const props = defineProps({
  small: {
    type: Boolean,
    default: false,
  },
  total: {
    type: Number,
    default: 0,
  },
  page: {
    type: Number,
    default: 1,
  },
  limit: {
    type: Number,
    default: 20,
  },
  pageSizes: {
    type: Array,
    default() {
      return [10, 20, 30, 40, 50]
    },
  },
  layout: {
    type: String,
    // slot可以添加额外元素
    default: 'total, sizes, prev, pager, next, slot, jumper',
  },
  background: {
    type: Boolean,
    default: true,
  },
  // 最多展示多少条数据
  maxCount: {
    type: [String, Number],
    default: 1000,
  },
  totalCount: {
    type: [String, Number],
    default: 0,
  },
})
const emit = defineEmits(['update:limit', 'update:page', 'getData'])
const currentPage = computed({
  get() {
    return props.page
  },
  set(val) {
    emit('update:page', val)
  },
})
const pageSize = computed({
  get() {
    return props.limit
  },
  set(val) {
    emit('update:limit', val)
  },
})

const layoutItem = computed(() => {
  if (props.totalCount) {
    return 'slot, sizes, prev, pager, next,  jumper'
  } else {
    return props.layout
  }
})

function handleSizeChange(val) {
  let el = document.querySelector('.el-table .el-table__body-wrapper')
  el &&
    el.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  pageSize.value = val
  emit('getData')
}

function handleCurrentChange(val) {
  let el = document.querySelector('.el-table .el-table__body-wrapper')
  el &&
    el.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    })
  currentPage.value = val
  emit('getData')
}

defineOptions({
  name: 'Pagination',
})
</script>

<style lang="scss">
.nd-pagination-container {
  &.el-pagination {
    display: flex;
    align-items: center;
    .el-pagination__editor.el-input {
      width: 45px;
    }
    .el-select {
      .el-input {
        width: 90px;
      }
    }
  }
  .custom-footer-pagination {
    position: absolute;
    left: 0;
    color: var(--el-text-color-regular);
  }
  /*:deep(.el-pagination.is-background .el-pager li:not(.disabled)) {
    &:hover {
      color: $color-primary;
      border: 1px solid $color-primary;
    }

    &.active {
      background: $color-primary;
      color: #ffffff;
    }
  }*/

  /*  :deep(.el-icon) {
      width: auto;
    }*/

  /* :deep(.el-pager li) {
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: $border-radius-small;
    background: $color-white;
    font-weight: 400;
    outline: none;
    font-size: 14px;
    color: $h2-text-color;
    cursor: pointer;

    &.btn-quickprev,
    &.btn-quicknext {
      border: none !important;
    }
  }

  :deep(.btn-prev),
  :deep(.btn-next) {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 !important;
    background: $color-white;
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: $border-radius-small;

    &:hover:not([disabled]) {
      border: 1px solid $color-primary;
    }
  }

  .btn-quickprev .el-icon-more {
    //border: none !important;
  }*/
}
</style>
