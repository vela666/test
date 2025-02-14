<script setup>
import { CirclePlus, Refresh } from '@element-plus/icons-vue'
import draggable from 'vuedraggable'
defineOptions({
  name: 'EventGroupConfig',
})
import useEventGroupConfig from './hooks/useEventGroupConfig'
const {
  userInfo,
  list,
  dialogVisible,
  showDialog,
  isOpen,
  isGlobal,
  tipDialogVisible,
  confirmLoding,
  tipDialogClose,
  selectedRule,
  showTitle,
  ruleOperation,
  addRule,
  editRuleName,
  copyRule,
  deleteRule,
  commonDialogVisible,
  formRules,
  formData,
  ruleFormRef,
  commonDialogClose,
  ruleSubmit,
  isEdit,
  setEdit,
  editGroupName,
  confirmGroupName,
  cancelGroupName,
  deleteGroup,
  addGroup,
  resetGroup,
  exitEdit,
  ruleList,
  leftLoading,
  activeRule,
  operatingRule,
  tipData,
  tipDialogSubmit,
  eventGroupDialogClose,
  useRule,
  saveRule,
  rightLoading,
  currentRule,
} = useEventGroupConfig()
</script>

<template>
  <div class="event-group-config" @click="showDialog">
    <svg-icon name="event-group-manage" class="eas-event-group-icon" />
    <span>{{ $t('analysis.manageGroups') }}</span>
  </div>
  <el-dialog
    v-model="dialogVisible"
    :title="$t('analysis.rulesManagingGroups')"
    :close-on-click-modal="false"
    class="event-group-dialog"
    @closed="eventGroupDialogClose">
    <template #header>
      <div class="flex-center">
        <div class="rule-dialog-title">
          {{ $t('analysis.rulesManagingGroups') }}
        </div>
        <div class="flex-center current-rule-tips">
          <div>{{ $t('analysis.currentAppliedRules') }}：</div>
          <div style="max-width: 200px" v-showTips>
            {{ currentRule.eventScreenName }}
          </div>
        </div>
      </div>
    </template>
    <div style="width: 100%; height: 100%; display: flex">
      <div
        :class="['container-left', { 'no-op': isEdit }]"
        v-loading="leftLoading">
        <div class="container-left__body">
          <div class="rule-list">
            <div
              :class="[
                'rule-item',
                {
                  'selected-rule':
                    item.eventScreenId === activeRule?.eventScreenId,
                },
              ]"
              v-for="item in ruleList"
              :key="`rule-item${item.eventScreenId}`"
              @click="selectedRule(item)">
              <div class="rule-title" v-showTips>
                {{ item.eventScreenName }}
              </div>
              <div class="rule-operation">
                <el-tooltip
                  effect="dark"
                  :content="$t('analysis.editRuleName')"
                  placement="top"
                  :hide-after="0">
                  <div class="op-btn" @click.stop="editRuleName(item)">
                    <svg-icon name="edit1"></svg-icon>
                  </div>
                </el-tooltip>
                <el-tooltip
                  effect="dark"
                  :content="$t('analysis.copyRule')"
                  placement="top"
                  :hide-after="0">
                  <div class="op-btn" @click.stop="copyRule(item)">
                    <svg-icon name="copy3"></svg-icon>
                  </div>
                </el-tooltip>
                <el-tooltip
                  effect="dark"
                  :content="$t('analysis.deleteRule')"
                  placement="top"
                  :hide-after="0">
                  <div
                    class="op-btn"
                    @click.stop="deleteRule(item)"
                    v-if="ruleList.length > 1">
                    <svg-icon name="delete1"></svg-icon>
                  </div>
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
        <div class="container-left__footer">
          <el-button :icon="CirclePlus" class="is-rule-btn" @click="addRule">
            {{ $t('analysis.addRule') }}
          </el-button>
        </div>
      </div>
      <div class="container-right" v-loading="rightLoading">
        <div class="container-right__header">
          <div class="rule-setting">
            <div class="rule-setting-item">
              <el-checkbox
                v-model="isOpen"
                :disabled="!isEdit"
                :label="$t('analysis.setPublic')" />
              <el-tooltip
                effect="dark"
                :content="$t('analysis.setPublicMsg')"
                placement="top"
                :hide-after="0">
                <svg-icon name="help2" class="c86919d ml5" />
              </el-tooltip>
            </div>
            <div class="rule-setting-item" v-if="userInfo.type === 2">
              <el-checkbox
                v-model="isGlobal"
                :disabled="!isEdit"
                :label="$t('analysis.setGlobalDefault')" />
              <el-tooltip
                effect="dark"
                :content="$t('analysis.setGlobalDefaultMsg')"
                placement="top"
                :hide-after="0"
                :persistent="true">
                <div>
                  <svg-icon name="help2" class="c86919d ml5" />
                </div>
              </el-tooltip>
            </div>
          </div>
          <div>
            <el-button
              v-if="!isEdit"
              type="primary"
              @click="setEdit"
              :disabled="!activeRule?.eventScreenId">
              {{ $t('analysis.editGroup') }}
            </el-button>
          </div>
        </div>
        <div class="container-right__body">
          <div class="group-setting">
            <el-button
              :icon="CirclePlus"
              class="is-rule-btn no-padding"
              :disabled="!isEdit"
              @click="addGroup">
              {{ $t('analysis.createNewGroup') }}
            </el-button>
            <el-button
              :icon="Refresh"
              class="is-rule-btn no-padding"
              :disabled="!isEdit"
              @click="resetGroup">
              {{ $t('btn.reset') }}
            </el-button>
          </div>
          <div class="group-container">
            <draggable
              v-model="list"
              force-fallback="true"
              :group="{ name: 'rules', pull: false, put: false }"
              :animation="500"
              handle=".handle"
              fallback-tolerance="10"
              item-key="id"
              :component-data="{
                name: 'fade',
                type: 'transtion-group',
              }"
              :disabled="!isEdit">
              <template #item="{ element, index }">
                <div class="group-view">
                  <div
                    v-if="!element.editable"
                    :class="['group-title', { 'edit-status': isEdit }]">
                    <div class="grab-icon handle">
                      <svg-icon name="three" />
                    </div>
                    <div class="group-title__text" v-showTips>
                      {{ element.name }}
                    </div>
                    <div
                      class="group-title__btn"
                      v-if="isEdit && element.id != -1">
                      <div class="op-btn2" @click="editGroupName(index)">
                        <svg-icon name="edit1"></svg-icon>
                      </div>
                      <div class="op-btn2" @click="deleteGroup(element, index)">
                        <svg-icon name="delete1"></svg-icon>
                      </div>
                    </div>
                  </div>
                  <div v-else class="group-edit-area">
                    <el-input
                      class="group-name-input"
                      v-model.trim="list[index].editName"
                      maxlength="24"
                      show-word-limit />
                    <el-button
                      class="is-rule-btn no-padding"
                      @click="confirmGroupName(index)">
                      {{ $t('btn.save') }}
                    </el-button>
                    <el-button
                      class="is-rule-btn no-padding"
                      @click="cancelGroupName(index)">
                      {{ $t('btn.cancel') }}
                    </el-button>
                  </div>
                  <div class="group-members">
                    <draggable
                      v-model="element.children"
                      force-fallback="true"
                      :group="{ name: 'row', pull: true, put: true }"
                      :animation="500"
                      handle=".handle2"
                      fallback-tolerance="10"
                      item-key="id"
                      :component-data="{
                        name: 'fade',
                        type: 'transtion-group',
                      }"
                      :disabled="!isEdit">
                      <template #item="data">
                        <div class="member-item">
                          <div class="grab-icon handle2">
                            <svg-icon name="three" />
                          </div>
                          <div class="group-members__text">
                            {{ data.element.eventNameZh }}
                          </div>
                        </div>
                      </template>
                    </draggable>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
        <div class="container-right__footer">
          <div class="footer_btn">
            <template v-if="isEdit">
              <el-button text class="skip" @click="exitEdit">
                {{ $t('analysis.exitEditing') }}
              </el-button>
              <el-button type="primary" @click="saveRule">
                {{ $t('btn.save') }}
              </el-button>
              <el-button type="primary" @click="saveRule(2)">
                {{ $t('analysis.saveUseRule') }}
              </el-button>
            </template>
            <template v-else>
              <el-button text class="skip" @click="dialogVisible = false">
                {{ $t('common.close') }}
              </el-button>
              <el-button
                type="primary"
                @click="useRule"
                :disabled="!activeRule?.eventScreenId">
                {{ $t('analysis.use') }}
              </el-button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
  <TipDialog
    v-model="tipDialogVisible"
    :iconType="tipData.iconType"
    :title="tipData.title"
    btnSwap
    :loading="confirmLoding"
    @close="tipDialogClose"
    @submit="tipDialogSubmit"
    :append-to-body="false">
    {{ tipData.text }}
  </TipDialog>
  <CommonDialog
    v-model="commonDialogVisible"
    :title="showTitle"
    alignCenter
    :loading="confirmLoding"
    :append-to-body="false"
    @submit="ruleSubmit"
    @close="commonDialogClose">
    <el-form
      :rules="formRules"
      label-position="top"
      label-width="100px"
      ref="ruleFormRef"
      :model="formData">
      <el-form-item :label="$t('analysis.ruleName')" prop="ruleName">
        <CommonInput
          :prefixSlot="false"
          clearable
          maxlength="24"
          show-word-limit
          :placeholder="$t('rules.enterRuleName')"
          v-model.trim="formData.ruleName" />
      </el-form-item>
    </el-form>
  </CommonDialog>
</template>

<style scoped lang="scss">
@use 'group.scss';
</style>
<style lang="scss">
.event-group-dialog {
  width: 960px;
  height: 600px;
  background: #fff;
  box-shadow: 0px 3px 6px 1px rgba(28, 39, 80, 0.2);
  border-radius: 10px 10px 10px 10px;
  .el-dialog__header {
    border-bottom: 1px solid var(--eas-border-color);
    margin-right: 0px;
    padding: 20px 32px;
    .el-dialog__title {
      font-size: var(--eas-font-size-medium);
      font-weight: bold;
      color: #333;
    }
    .el-dialog__headerbtn {
      font-size: var(--eas-font-size-extra-large);
    }
    .el-dialog__close {
      --el-color-info: var(--eas-border-color-3);
    }
  }
  .el-dialog__body {
    padding: 0px;
    height: calc(100% - 65px);
    display: flex;
    .container-left {
      width: 221px;
      height: 100%;
      border-right: 1px solid var(--eas-border-color);
      &__body {
        width: 100%;
        height: calc(100% - 56px);
      }
      &__footer {
        width: 100%;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
    .container-right {
      width: calc(100% - 221px);
      height: 100%;
      color: var(--eas-text-color-primary);
      &__header {
        display: flex;
        justify-content: space-between;
        height: 51px;
        padding: 8px 32px 10px 20px;
        border-bottom: 1px solid var(--eas-border-color);
      }
      &__body {
        height: calc(100% - 123px);
      }
      &__footer {
        display: flex;
        justify-content: flex-end;
        height: 72px;
        padding: 20px 32px 20px 0px;
        .footer_btn {
          display: inline-block;
        }
        .el-button.is-text:not(.is-disabled):hover {
          background-color: var(--eas-border-color);
        }
      }
    }
  }
}
.rule-dialog-title {
  font-size: var(--eas-font-size-medium);
  font-weight: bold;
  color: #333;
  margin-right: 20px;
}
.current-rule-tips {
  font-size: var(--eas-font-size-base);
  color: #707070;
  font-weight: 400;
}
</style>
