<script setup>
import useUserCenter from './hooks/useUserCenter'
import { WarningFilled } from '@element-plus/icons-vue'
import { recordBehavior } from '@/utils/record-behavior.js'
import handleClipboard from '@/utils/clipboard'
recordBehavior({
  moduleName: '通用',
  submoduleName: '个人设置',
  operate: '进入页面',
})
const {
  state,
  userInfo,
  tokenRef,
  userFormRef,
  userNameFormRules,
  handleModifyUserName,
  modifyUserNameSubmit,
  userNameDialogClose,
  emailTitle,
  emailFormRef,
  emailFormRules,
  bindEmail,
  getVerificationCode,
  showSend,
  count,
  emailType,
  emailOperationSubmit,
  validateOld,
  unBindEmail,
  modifyEmail,
  emailDialogClose,
  pwdFormRef,
  pwdFormRules,
  handleModifyPassword,
  pwdDialogClose,
  modifyPasswordSubmit,
  getCreateToken,
} = useUserCenter()

defineOptions({
  name: 'UcerCenter',
})
</script>

<template>
  <div class="user-center">
    <div class="user-center__title">{{ $t('login.personalSettings') }}</div>
    <div class="user-center__container">
      <div class="user_content">
        <div class="info__box is_base">
          <div class="info__title pd-t10">
            {{ $t('login.basicInformation') }}
          </div>
          <div class="info__content">
            <div class="content__item is_username">
              <div class="item_title username_before">
                {{ $t('system.roles.userName') }}
              </div>
              <div class="item_content">
                <span>{{ userInfo.name }}</span>
                <el-button
                  text
                  class="is-normal-button"
                  @click="handleModifyUserName">
                  {{ $t('btn.edit') }}
                </el-button>
              </div>
            </div>
            <div class="content__item is_account">
              <div class="item_title">{{ $t('login.account') }}</div>
              <div class="item_content">{{ userInfo.account }}</div>
            </div>
          </div>
        </div>
        <div class="info__box is_base">
          <div class="info__title pd-t10">
            {{ $t('login.securityAccount') }}
          </div>
          <div class="info__content">
            <div class="content__item is_email">
              <div class="item_title">{{ $t('login.email') }}</div>
              <div class="item_content">
                <template v-if="userInfo.email == ''">
                  <span>{{ $t('login.emailNotBound') }}</span>
                  <el-button text class="is-normal-button" @click="bindEmail">
                    {{ $t('login.binding') }}
                  </el-button>
                </template>
                <template v-else>
                  <span>{{ userInfo.email }}</span>
                  <div>
                    <el-button
                      text
                      class="is-normal-button"
                      @click="modifyEmail">
                      {{ $t('btn.edit') }}
                    </el-button>
                    <!-- <el-button
                      text
                      class="is-normal-button"
                      @click="unBindEmail"
                      >解除绑定
                    </el-button> -->
                  </div>
                </template>
              </div>
            </div>
            <div class="content__item is_pwd">
              <div class="item_title">{{ $t('login.password') }}</div>
              <div class="item_content">
                <span>***********</span>
                <el-button
                  text
                  class="is-normal-button"
                  @click="handleModifyPassword">
                  {{ $t('btn.edit') }}
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <div class="info__box">
          <div class="info__title pd-t10 no-wrap">
            {{ $t('login.tokenSettings') }}
            <Tooltip>
              <template #content
                >{{ $t('login.dataQueryToken') }} token</template
              >
              <SvgIcon name="help2" class="c545e6e" />
            </Tooltip>
          </div>
          <div class="info__content">
            <div class="content__item is_email">
              <div class="item_title flex flex-between">
                <div ref="tokenRef" v-showTips v-show="state.token">
                  {{ state.token }}
                </div>
                <div class="flex-center gap5" :class="{ ml20: !!state.token }">
                  <el-button
                    v-if="!state.token"
                    text
                    type="primary"
                    @click="getCreateToken(0)">
                    {{ $t('login.generateToken') }}
                  </el-button>
                  <template v-else>
                    <el-button
                      text
                      type="primary"
                      @click="handleClipboard(tokenRef, $event)"
                      >{{ $t('btn.copy') }}</el-button
                    >
                    <el-button @click="getCreateToken(1)" text type="primary">
                      {{ $t('btn.refresh') }}
                    </el-button>
                    <el-button @click="getCreateToken(2)" text type="primary">
                      {{ $t('login.renewal') }}
                    </el-button>
                  </template>
                </div>
              </div>
              <div class="item_content" v-show="state.token">
                {{ $t('common.effectiveTime') }}：{{ state.expirationTime }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <CommonDialog
    v-model="state.show"
    :title="$t('login.editUserName')"
    alignCenter
    @close="userNameDialogClose"
    @submit="modifyUserNameSubmit"
    :loading="state.loading">
    <el-form
      :rules="userNameFormRules"
      label-position="top"
      label-width="100px"
      :model="state.formData"
      ref="userFormRef">
      <el-form-item :label="$t('system.roles.userName')" prop="userName">
        <CommonInput
          :prefixSlot="false"
          clearable
          maxlength="50"
          show-word-limit
          :placeholder="$t('rules.enterUserName')"
          v-model.trim="state.formData.userName" />
      </el-form-item>
    </el-form>
  </CommonDialog>
  <CommonDialog
    v-model="state.emailShow"
    :title="emailTitle"
    alignCenter
    @close="emailDialogClose"
    @submit="emailOperationSubmit"
    :loading="state.loading"
    :submitTxt="`${validateOld ? $t('btn.nextStep') : $t('btn.confirm')}`">
    <div class="email-unbinding-warning" v-if="emailType == 1">
      <el-icon class="email-unbinding-warning__icon"><WarningFilled /></el-icon>
      <div class="email-unbinding-warning__text">
        {{ $t(login.unbindEmailMsg) }}
      </div>
    </div>
    <el-form
      :rules="emailFormRules"
      label-position="top"
      label-width="100px"
      :model="state.emailFormData"
      ref="emailFormRef">
      <el-form-item :label="$t('login.email')" prop="email">
        <el-input
          clearable
          maxlength="50"
          show-word-limit
          :placeholder="$t('rules.enterEmailAddress')"
          v-model.trim="state.emailFormData.email"
          :disabled="emailType == 1 || validateOld" />
      </el-form-item>
      <el-form-item prop="code">
        <el-input
          maxlength="8"
          :placeholder="$t('rules.enterEmailCode')"
          v-model.trim="state.emailFormData.code"
          class="code__input" />
        <el-button
          v-if="showSend"
          type="primary"
          class="code__btn"
          :loading="state.btnLoading"
          @click="getVerificationCode">
          {{ $t('login.getVerificationCode') }}
        </el-button>
        <div class="code__btn code__timer" v-else>
          {{ $t('login.secondsResend', [count]) }}
        </div>
      </el-form-item>
    </el-form>
  </CommonDialog>
  <CommonDialog
    v-model="state.pwdShow"
    :title="$t('login.editPassword')"
    alignCenter
    @close="pwdDialogClose"
    @submit="modifyPasswordSubmit"
    :loading="state.loading">
    <el-form
      :rules="pwdFormRules"
      label-position="top"
      label-width="100px"
      :model="state.pwdFormData"
      ref="pwdFormRef">
      <el-form-item
        :label="$t('login.originalPassword')"
        prop="currentPassword">
        <el-input
          v-model.trim="state.pwdFormData.currentPassword"
          maxlength="50"
          autocomplete="off"
          :placeholder="$t('common.pleaseEnter')"
          type="password"
          show-password
          auto-complete="new-password" />
      </el-form-item>
      <el-form-item :label="$t('login.newPassword')" prop="newPassword">
        <el-input
          v-model.trim="state.pwdFormData.newPassword"
          maxlength="50"
          autocomplete="off"
          :placeholder="$t('common.pleaseEnter')"
          type="password"
          show-password
          auto-complete="new-password" />
      </el-form-item>
      <el-form-item :label="$t('login.confirmPassword')" prop="confirmPassword">
        <el-input
          v-model.trim="state.pwdFormData.confirmPassword"
          maxlength="50"
          autocomplete="off"
          :placeholder="$t('common.pleaseEnter')"
          type="password"
          show-password
          auto-complete="new-password" />
      </el-form-item>
    </el-form>
  </CommonDialog>
</template>

<style scoped lang="scss">
.pd-t8 {
  padding-top: 8px;
}
.pd-t10 {
  padding-top: 10px;
}
.user-center {
  padding-top: 10px;
  &__title {
    font-size: var(--eas-font-size-medium);
    color: var(--eas-text-color);
    font-weight: bold;
    margin-bottom: 10px;
    height: 21px;
  }
  &__container {
    width: 100%;
    height: calc(100% - 31px);
    background-color: var(--eas-white-bg-color);
    border-radius: var(--eas-border-radius-4);
  }
  .user_content {
    width: 754px;
    min-height: 500px;
    padding-top: 30px;
    margin: 0 auto;
  }
  .info__box {
    width: 100%;
    display: flex;
    &.is_base {
      margin-bottom: 69px;
    }
  }
  .info__title {
    margin-right: 20px;
    font-size: var(--eas-font-size-base);
    color: var(--eas-text-color);
    font-weight: bold;
    min-width: 140px;
  }
  .info__content {
    .content__item {
      width: 678px;
      height: 80px;
      &:hover {
        background-color: var(--eas-hover-color);
        border-radius: var(--eas-border-radius);
      }
      &.is_username {
        padding: 10px 18px 15px 20px;
        margin-bottom: 34px;
      }
      &.is_account {
        padding: 9px 18px 16px 20px;
      }
      &.is_email {
        padding: 11px 18px 12px 20px;
        margin-bottom: 36px;
      }
      &.is_pwd {
        padding: 8px 18px 15px 20px;
      }
      .item_title {
        color: var(--eas-text-color);
        font-weight: 400;
        &.username_before {
          &::before {
            content: '*';
            width: 7px;
            height: 21px;
            margin-right: 4px;
            font-size: var(--eas-font-size-medium);
            font-weight: 400;
            color: var(--eas-color-danger);
          }
        }
      }
      .item_content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 17px;
        color: var(--eas-text-color-primary);
        font-weight: 400;
      }
    }
  }
}
.el-button.is-text {
  &.is-normal-button {
    color: var(--eas-color-primary);
  }
}
.code__input {
  width: 280px;
  margin-right: 10px;
}
%border-radius {
  border-radius: var(--eas-border-radius-4);
}
.code__btn {
  width: 196px;
  @extend %border-radius;
}
.code__timer {
  height: 32px;
  text-align: center;
  border: 1px solid var(--eas-color-primary);
  color: var(--eas-color-primary);
  user-select: none;
}
:deep(.el-form-item__content) {
  .el-input__suffix {
    .el-input__password {
      color: var(--eas-border-color-3);
    }
  }
}
.email-unbinding-warning {
  display: flex;
  height: 52px;
  padding: 10px;
  margin-bottom: 24px;
  background: var(--eas-color-warning-light-1);
  border-radius: var(--eas-border-radius-4);
  &__icon {
    margin-right: 6px;
    font-size: var(--eas-font-size-large);
    color: var(--eas-message-warning-text-color);
  }
  &__text {
    font-size: var(--eas-font-size-small);
    color: var(--eas-text-color);
  }
}
</style>
