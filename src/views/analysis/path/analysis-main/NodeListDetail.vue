<template>
  <CommonDialog
    :title="$t('analysis.path.nodeDetail')"
    v-bind="attrs"
    width="45%"
    :needFooter="false">
    <div class="mb20">
      {{ $t('analysis.path.nodeEvents') }}：{{ clickedNode.showName }}
    </div>
    <el-row class="border-top mt10">
      <el-col :span="8"></el-col>
      <el-col :span="8">{{ $t('analysis.path.sessions') }}</el-col>
      <el-col :span="8">{{ $t('analysis.path.uerDetails') }}</el-col>
    </el-row>
    <el-row>
      <el-col :span="8">{{ $t('analysis.path.total') }}</el-col>
      <el-col :span="8">{{ clickedNode.value.toLocaleString() }}</el-col>
      <el-col :span="8">
        <el-link
          :type="isValidNumByCluster(clickedNode.value) ? 'primary' : 'default'"
          :underline="false"
          :disabled="!isValidNumByCluster(clickedNode.value)"
          @click="openUserListDialog(getClusterParams({ type: 0 }))">
          {{ $t('analysis.path.view') }}
        </el-link>
        <Tooltip
          :content="$t('analysis.createResultGroup')"
          placement="right"
          v-if="isValidNumByCluster(clickedNode.value)">
          <svg-icon
            name="creator1"
            class="c-pointer ml3"
            @click="openClusterDialog(getClusterParams({ type: 0 }))" />
        </Tooltip>
      </el-col>
    </el-row>
    <template v-if="clickedNode.listData && clickedNode.listData.length > 0">
      <el-row>
        <el-col :span="8">
          {{
            analysisResult.dataQP?.sourceEvent?.sourceType === '1'
              ? $t('analysis.path.forwardEventStat')
              : $t('analysis.path.subEventStat')
          }}
        </el-col>
        <el-col :span="8">
          {{ clickedNode?.totalNext.toLocaleString() }}
          （{{ clickedNode.totalNextPrecent }}）
        </el-col>
        <el-col :span="8">
          <el-link
            :type="
              isValidNumByCluster(clickedNode?.totalNext)
                ? 'primary'
                : 'default'
            "
            :underline="false"
            :disabled="!isValidNumByCluster(clickedNode?.totalNext)"
            @click="openUserListDialog(getClusterParams({ type: 1 }))">
            {{ $t('analysis.path.view') }}
          </el-link>
          <Tooltip
            :content="$t('analysis.createResultGroup')"
            placement="right"
            v-if="isValidNumByCluster(clickedNode?.totalNext)">
            <svg-icon
              name="creator1"
              class="c-pointer ml3"
              @click="openClusterDialog(getClusterParams({ type: 1 }))" />
          </Tooltip>
        </el-col>
      </el-row>
      <el-row class="border-bottom">
        <el-col :span="8">
          {{
            analysisResult.dataQP?.sourceEvent?.sourceType === '1'
              ? $t('analysis.path.start')
              : $t('analysis.path.loss')
          }}
        </el-col>
        <el-col :span="8">
          {{ clickedNode?.wastage.toLocaleString() }}
          （{{ clickedNode.wastagePrecent }}）
        </el-col>
        <el-col :span="8">
          <el-link
            :type="
              isValidNumByCluster(clickedNode?.wastage) ? 'primary' : 'default'
            "
            :underline="false"
            :disabled="!isValidNumByCluster(clickedNode?.wastage)"
            @click="openUserListDialog(getClusterParams({ type: 2 }))">
            {{ $t('analysis.path.view') }}
          </el-link>
          <Tooltip
            :content="$t('analysis.createResultGroup')"
            placement="right"
            v-if="isValidNumByCluster(clickedNode?.wastage)">
            <svg-icon
              name="creator1"
              class="c-pointer ml3"
              @click="openClusterDialog(getClusterParams({ type: 2 }))" />
          </Tooltip>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="8">
          {{
            analysisResult.dataQP?.sourceEvent?.sourceType === '1'
              ? $t('analysis.path.forwardEventStat')
              : $t('analysis.path.subEventStat')
          }}
        </el-col>
        <el-col :span="8">{{ $t('analysis.path.sessions') }}</el-col>
        <el-col :span="8">{{ $t('analysis.path.uerDetails') }}</el-col>
      </el-row>

      <el-row v-for="(item, i) in clickedNode.listData" :key="i">
        <el-col :span="8" class="ellipsis" :title="item.eventName">
          {{ item.eventName }}
        </el-col>
        <el-col :span="8">
          {{ item.times.toLocaleString() }}（{{ item.percent }}）
        </el-col>
        <el-col :span="8">
          <el-link
            :type="isValidNumByCluster(item.times) ? 'primary' : 'default'"
            :underline="false"
            :disabled="!isValidNumByCluster(item.times)"
            @click="
              openUserListDialog(
                getClusterParams({ type: 3, eventNameEn: item.eventNameEn })
              )
            ">
            {{ $t('analysis.path.view') }}
          </el-link>
          <Tooltip
            :content="$t('analysis.createResultGroup')"
            placement="right"
            v-if="isValidNumByCluster(item.times)">
            <svg-icon
              name="creator1"
              class="c-pointer ml3"
              @click="
                openClusterDialog(
                  getClusterParams({ type: 3, eventNameEn: item.eventNameEn })
                )
              " />
          </Tooltip>
        </el-col>
      </el-row>
    </template>
  </CommonDialog>

  <ResultClusterDialog
    ref="resultClusterRef"
    :qp="{}"
    :api="createTraceSegmentation" />
  <ResultUserListDialog ref="userListRef" :analysisType="5" />
</template>

<script setup>
import { useAttrs, ref } from 'vue'
import { isValidNumByCluster } from '@/utils/index.js'
import { createTraceSegmentation } from '@/api/modules/common'
import ResultClusterDialog from '@/views/analysis/components/ResultClusterDialog/index.vue'
import ResultUserListDialog from '@/views/analysis/components/ResultUserListDialog/index.vue'
import { isObject } from 'lodash-es'

defineOptions({
  name: 'NodeListDetail',
})

const attrs = useAttrs()
const props = defineProps({
  clickedNode: {
    type: Object,
    default: () => {},
  },
  analysisResult: {
    type: Object,
    default: () => {},
  },
})

const resultClusterRef = ref(null)
const userListRef = ref(null)

const openClusterDialog = (params = {}) => {
  resultClusterRef.value?.open(isObject(params) ? params : {})
}

const openUserListDialog = (params = {}) => {
  userListRef.value?.open(isObject(params) ? params : {})
}

/**
 * @description: 路径分析结果分群参数
 * @return {*}
 */
const getClusterParams = ({ type, eventNameEn = '' }) => {
  const sourceEventName = props.analysisResult.dataQP?.sourceEvent?.eventName
  const links = props.analysisResult?.dataSource?.links.length
  // 0 初始事件  1 结束事件
  const sourceType = props.analysisResult.dataQP?.sourceEvent?.sourceType

  const data = {
    type,
    nodeIndex:
      sourceType === '1'
        ? links - props.clickedNode.depth
        : props.clickedNode.depth,
    clusterSql: props.analysisResult.resultClusterSql,
    nodeEvent:
      props.clickedNode.showNameEn === sourceEventName
        ? 'key_ev'
        : props.clickedNode.showNameEn,
    nodeEventList: [],
    nextNodeEvent: eventNameEn === sourceEventName ? 'key_ev' : eventNameEn,
    nextNodeEventList: [],
  }

  // 若当前节点为其他，需要传递除其他之外的事件
  if (data.nodeEvent === '__more') {
    const list = props.analysisResult.option.series.data.filter(
      (item) =>
        item.depth === props.clickedNode.depth &&
        item.showNameEn !== data.nodeEvent
    )
    data.nodeEventList = list
      .map((item) => item.showNameEn)
      .map((item) => {
        if (item === sourceEventName) {
          item = 'key_ev'
        }
        return item
      })
  }

  // 后续节点事件，若后续节点为其他，需要传递除其他之外的事件
  if (data.nextNodeEvent === '__more') {
    const list = props.clickedNode.listData.filter(
      (item) => item.eventNameEn !== data.nextNodeEvent
    )
    data.nextNodeEventList = list
      .map((item) => item.eventNameEn)
      .map((item) => {
        if (item === sourceEventName) {
          item = 'key_ev'
        }
        return item
      })
  }

  const params = {
    type: 5, // 路径分析
    data,
    qp: JSON.stringify(props.analysisResult.dataQP),
  }

  return params
}
</script>

<style scoped lang="scss">
.el-col {
  height: 40px;
  line-height: 40px;
}
.border-bottom {
  border-bottom: 1px solid #d9d9d9;
}
.border-top {
  border-top: 1px solid #d9d9d9;
}
</style>
