<template>
  <div class="selection-right">
    <div class="flex-center flex-between">
      <div>
        <span>
          {{ $t('common.selected') }}
          <i class="c5473e8">{{
            selectLists - defaultSelectedAndDisabledNode
          }}</i>
          {{ $t('common.pcs') }}
        </span>
        <!-- 解决禁用且选中的时候 文案不确定 -->
        <span v-if="defaultSelectedAndDisabledNode"
          >，{{ $t('common.defaultSelection')
          }}<i class="c5473e8">{{ defaultSelectedAndDisabledNode }}</i>
          {{ $t('common.pcs') }}
        </span>
      </div>
      <el-button
        v-show="!!(selectLists - defaultSelectedAndDisabledNode)"
        text
        @click="emit('delData', false)">
        {{ $t('common.clear') }}
      </el-button>
    </div>

    <div class="selection-exhibit mt5 flex-column gap10">
      <!--  自定义内容  -->
      <slot name="rightCustom"></slot>
      <template v-if="!$slots.rightCustom">
        <slot name="rightTop"></slot>
        <div
          class="flex-column"
          v-for="item of Object.keys(mapSelectLists)"
          :key="item">
          <span class="w100-percentage c86919d mb5" v-if="rightShowParent">
            {{ item }}
          </span>
          <div
            v-for="sub of mapSelectLists[item]"
            :key="sub"
            class="selected flex-center flex-between">
            <span v-showTips class="w100-percentage c545e6e mr10">
              {{ sub[treeProps.label] }}
            </span>
            <div class="flex-center">
              <slot v-if="$slots.rightOperate" name="rightOperate" :data="sub">
              </slot>
              <SvgIcon
                v-if="!$slots.rightOperate && !sub[treeProps.disabled]"
                @click="emit('delData', sub)"
                class="c-pointer ml10 c8a8a8a fz16"
                name="close1" />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  selectLists: {
    type: Number,
    default: 0,
  },
  defaultSelectedAndDisabledNode: {
    type: Number,
    default: 0,
  },
  treeProps: {
    type: Object,
    default() {
      return {}
    },
  },
  mapSelectLists: {
    type: Object,
    default() {
      return {}
    },
  },
  // 显示父级
  rightShowParent: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:checked', 'update:search', 'delData'])

defineOptions({
  name: 'SelectionRight',
})
</script>

<style scoped lang="scss"></style>
