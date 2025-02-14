<template>
  <div class="content flex-column gap20">
    <CustomTreeSelection
      :selectedList="seleted"
      v-model="selectedKanBanList1"
      :data="data">
      <template #rightTop>
        <div class="flex-column">
          <span class="w100-percentage c86919d mb5"> 顶部 </span>
          <div class="selected flex-center flex-between">
            <span v-showTips class="w100-percentage c545e6e mr10">
              啦啦啦
            </span>
          </div>
        </div>
      </template>
      <template #rightOperate="{ data }"> 操作自定义 </template>
    </CustomTreeSelection>
    <CustomTreeSelection
      :selectedList="seleted"
      v-model="selectedKanBanList1"
      :data="data">
      <template #leftTop> 左顶部 </template>
      <template #rightTop>
        <div class="flex-column">
          <span class="w100-percentage c86919d mb5"> 顶部 </span>
          <div class="selected flex-center flex-between">
            <span v-showTips class="w100-percentage c545e6e mr10">
              啦啦啦
            </span>
          </div>
        </div>
      </template>
    </CustomTreeSelection>
  </div>

  <!--  <ConsolePanel
    :data="{
      selectedKanBanList1,
      selectedKanBanList2,
    }" />-->
</template>

<script setup>
import { ref } from 'vue'

const data = [
  {
    id: 1,
    label: 'Level one 1',
    children: [
      {
        id: 3,
        label: 'Level two 2-1',
        children: [
          {
            id: 6663,
            label: 'Level three 3-1-1',
          },
          {
            id: 33335,
            label: 'Level three 3-1-2',
            children: [
              {
                id: 213123,
                label: 'Level three 9-1',
                children: [
                  {
                    id: 242444,
                    label: 'Level three 10-1',
                  },
                  {
                    id: 5553253,
                    label: 'Level three 10-2',
                  },
                ],
              },
              {
                id: 52155,
                label: 'Level three 9-2',
                children: [
                  {
                    id: 2234324,
                    label: 'Level three 11-1',
                    children: [
                      {
                        id: 22343241,
                        label: 'Level three 12-1',
                        children: [
                          {
                            id: 223432421,
                            label: 'Level three 13-1',
                          },
                          {
                            id: 55565325532,
                            label: 'Level three 13-2',
                          },
                          {
                            id: 5523235,
                            label: 'Level three 13-3',
                          },
                        ],
                      },
                      {
                        id: 5556532532,
                        label: 'Level three 12-2',
                      },
                      {
                        id: 552335,
                        label: 'Level three 12-3',
                      },
                    ],
                  },
                  {
                    id: 555653253,
                    label: 'Level three 11-2',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: 4,
        label: 'Level two 4-1',
        children: [
          {
            id: 5,
            label: 'Level three 5-1',
          },
          {
            id: 6,
            label: 'Level three 6-1',
          },
        ],
      },
      {
        id: 2,
        label: 'Level two 2-2',
        children: [
          {
            id: 61,
            label: 'Level three 3-2-1',
          },
          {
            id: 72,
            label: 'Level three 3-2-2',
          },
        ],
      },
    ],
  },
  {
    id: 7,
    label: 'Level one 7',
    children: [
      {
        id: 8,
        label: 'Level two 8-1',
        children: [],
      },
    ],
  },
]
// 回显
const seleted = [
  {
    id: 6663,
    label: 'Level three 3-1-1',
    disabled: true,
  },
  {
    id: 213123,
    label: 'Level three 9-1',
  },
  {
    id: 61,
    label: 'Level three 3-2-1',
    disabled: false,
  },
  {
    id: 72,
    label: 'Level three 3-2-2',
    disabled: false,
    notShow: true,
  },
  {
    id: 8,
    label: 'Level two 8-1',
    disabled: false,
    selected: true,
    // notShow: true,
    children: [],
  },
]

const selectedKanBanList1 = ref([])
defineOptions({
  name: 'Tree',
})
</script>

<style scoped lang="scss">
.content {
  background-color: #fff;
}
</style>
