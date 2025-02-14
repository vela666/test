<template>
  <DropDownItemSelection
    v-if="params.creator"
    :placement="placement"
    :hide-on-click="false"
    @visible-change="visibleChange"
    :max-height="284"
    offset="6"
    className="nd-report-creator"
    defaultCursor>
    <div class="flex-center flex-level-center c86919d c-pointer">
      <SvgIcon name="user1" class="fz20 mr3" />
      <div class="mr3">{{ params.creator }}</div>
      <el-icon
        class="c5473e8"
        :class="['arrow-icon fz16 m0', { 'is-rotate': visible }]"
        ><ArrowDown
      /></el-icon>
    </div>
    <template #content>
      <el-dropdown-item class="no-bg cbfbfbf fz12">
        {{ t('common.creator') }}
      </el-dropdown-item>
      <el-dropdown-item> {{ params.creator }} </el-dropdown-item>
      <div class="ml5 c545e6e">{{ params.createTime }}</div>
      <el-dropdown-item v-if="params.modifier" class="no-bg cbfbfbf fz12">
        {{ t('common.lastUpdatedBy') }}
      </el-dropdown-item>
      <el-dropdown-item v-if="params.modifier">
        {{ params.modifier }}
      </el-dropdown-item>
      <div class="ml5 c545e6e" v-if="params.updateTime">
        {{ params.updateTime }}
      </div>
      <el-dropdown-item
        class="nd-user-item cbfbfbf no-bg fz12"
        v-if="params.collaborator.length"
        >{{ t('dashboard.collaborator') }}</el-dropdown-item
      >
      <el-dropdown-item v-for="item of params.collaborator" :key="item">
        {{ item }}
      </el-dropdown-item>
      <el-dropdown-item
        class="nd-user-item cbfbfbf no-bg fz12"
        v-if="params.viewer.length">
        {{ t('dashboard.viewer') }}
      </el-dropdown-item>
      <el-dropdown-item v-for="item of params.viewer" :key="item">
        {{ item }}
      </el-dropdown-item>
    </template>
  </DropDownItemSelection>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  placement: {
    type: String,
    default: 'bottom-start',
  },
  // 包含协作和查看者的数据
  data: {
    type: Array,
    default() {
      return []
    },
  },
})

const visible = ref(false)

const params = computed(() => {
  return props.data.reduce(
    (p, c) => {
      if (c.authority === 3) {
        p.creator = c.name
      } else if (c.authority === 2) {
        p.collaborator.push(c.name)
      } else {
        p.viewer.push(c.name)
      }
      p.modifier = c.modifier
      p.createTime = c.createTime
      p.updateTime = c.updateTime
      return p
    },
    {
      creator: '',
      createTime: '',
      modifier: '',
      updateTime: '',
      viewer: [],
      collaborator: [],
    }
  )
})
const visibleChange = (val) => {
  visible.value = val
}

defineOptions({
  name: 'ReportCreator',
})
</script>
<style lang="scss">
.el-popper.nd-report-creator {
  min-width: 180px;
  .nd-user-item {
    margin-top: 5px;
    border-top: 1px solid var(--eas-hover-color-4);
  }
  .el-dropdown__list {
    padding: 4px 10px;
  }
}
</style>
<style scoped lang="scss">
.arrow-icon {
  transition: all 0.3s;
}
.is-rotate {
  transform: rotate(-180deg);
}
</style>
