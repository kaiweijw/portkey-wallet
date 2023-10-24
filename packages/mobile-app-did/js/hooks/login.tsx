import {
  CurrentWalletType,
  useCurrentWalletInfo,
  useOriginChainId,
  useOtherNetworkLogged,
  useWallet,
} from '@portkey-wallet/hooks/hooks-ca/wallet';
import {
  createWallet,
  resetCaInfo,
  resetWallet,
  setCAInfo,
  setManagerInfo,
  setOriginChainId,
} from '@portkey-wallet/store/store-ca/wallet/actions';
import { CAInfo, LoginType, ManagerInfo } from '@portkey-wallet/types/types-ca/wallet';
import {
  AuthenticationInfo,
  OperationTypeEnum,
  VerificationType,
  VerifierInfo,
  VerifierItem,
} from '@portkey-wallet/types/verifier';
import { handleErrorCode, sleep } from '@portkey-wallet/utils';
import Loading from 'components/Loading';
import AElf from 'aelf-sdk';
import { request } from 'api';
import React, { useCallback, useRef } from 'react';
import { useAppDispatch } from 'store/hooks';
import useBiometricsReady from './useBiometrics';
import navigationService from 'utils/navigationService';
import { TimerResult, IntervalGetResultParams, intervalGetResult } from 'utils/wallet';
import CommonToast from 'components/CommonToast';
import useEffectOnce from './useEffectOnce';
import { resetUser, setCredentials } from 'store/user/actions';
import { DigitInputInterface } from 'components/DigitInput';
import { GuardiansApproved } from 'pages/Guardian/types';
import { useGetDeviceInfo } from './device';
import { extraDataEncode } from '@portkey-wallet/utils/device';
import { useGetGuardiansInfo, useGetVerifierServers } from './guardian';
import { handleUserGuardiansList } from '@portkey-wallet/utils/guardian';
import { useLanguage } from 'i18n/hooks';
import { DefaultChainId } from '@portkey-wallet/constants/constants-ca/network';
import { useGetChainInfo } from '@portkey-wallet/hooks/hooks-ca/chainList';
import { useGetRegisterInfo } from '@portkey-wallet/hooks/hooks-ca/guardian';
import { usePin, useUser } from './store';
import { queryFailAlert } from 'utils/login';
import { useResetStore } from '@portkey-wallet/hooks/hooks-ca';
import { ChainId } from '@portkey-wallet/types';
import ActionSheet from 'components/ActionSheet';
import { resetDappList } from '@portkey-wallet/store/store-ca/dapp/actions';
import { request as globalRequest } from '@portkey-wallet/api/api-did';
import { useVerifyToken } from './authentication';
import { verification } from 'utils/api';
import { Text } from 'react-native';
import { TextL } from 'components/CommonText';
import fonts from 'assets/theme/fonts';
import { CreateAddressLoading } from '@portkey-wallet/constants/constants-ca/wallet';

export function useOnResultFail() {
  const dispatch = useAppDispatch();
  const { currentNetwork } = useWallet();
  const otherNetworkLogged = useOtherNetworkLogged();
  const resetStore = useResetStore();

  return useCallback(
    (message: string, isRecovery?: boolean, isReset?: boolean) => {
      Loading.hide();
      CommonToast.fail(message);
      queryFailAlert(
        () => {
          resetStore();
          dispatch(resetDappList(currentNetwork));
          if (otherNetworkLogged) {
            dispatch(resetCaInfo(currentNetwork));
          } else {
            dispatch(resetWallet());
            dispatch(resetUser());
          }
        },
        isRecovery,
        isReset,
      );
    },
    [currentNetwork, dispatch, otherNetworkLogged, resetStore],
  );
}

export function useOnManagerAddressAndQueryResult() {
  const { t } = useLanguage();
  const dispatch = useAppDispatch();
  const biometricsReady = useBiometricsReady();
  const { biometrics } = useUser();
  const getDeviceInfo = useGetDeviceInfo();
  const onResultFail = useOnResultFail();
  const timer = useRef<TimerResult>();
  useEffectOnce(() => {
    return () => {
      timer.current?.remove();
    };
  });
  const originChainId = useOriginChainId();
  const onIntervalGetResult = useIntervalGetResult();
  return useCallback(
    async ({
      showLoading = true,
      managerInfo,
      walletInfo,
      confirmPin,
      pinRef,
      verifierInfo,
      guardiansApproved,
    }: {
      showLoading?: boolean;
      managerInfo: Omit<ManagerInfo, 'managerUniqueId'>;
      walletInfo?: CurrentWalletType;
      confirmPin: string;
      pinRef?: React.MutableRefObject<DigitInputInterface | undefined>;
      verifierInfo?: VerifierInfo;
      guardiansApproved?: GuardiansApproved;
    }) => {
      const isRecovery = managerInfo.verificationType === VerificationType.communityRecovery;
      showLoading &&
        Loading.show({
          text: t(isRecovery ? 'Initiating social recovery' : CreateAddressLoading),
        });

      await sleep(500);
      try {
        const tmpWalletInfo = walletInfo?.address ? walletInfo : AElf.wallet.createNewWallet();
        const extraData = await extraDataEncode(getDeviceInfo());
        let data: any = {
          loginGuardianIdentifier: managerInfo.loginAccount,
          manager: tmpWalletInfo.address,
          extraData,
          context: {
            clientId: tmpWalletInfo.address,
            requestId: tmpWalletInfo.address,
          },
          chainId: originChainId,
        };

        let fetch = request.verify.registerRequest;
        if (isRecovery) {
          fetch = request.verify.recoveryRequest;
          data.guardiansApproved = guardiansApproved?.map(i => ({ identifier: i.value, ...i }));
        } else {
          data = {
            ...managerInfo,
            ...verifierInfo,
            type: LoginType[managerInfo.type],
            ...data,
          };
        }
        const req = await fetch({ data });
        // whether there is wallet information
        const _managerInfo = {
          ...managerInfo,
          managerUniqueId: req.sessionId,
          requestId: tmpWalletInfo.address,
        } as ManagerInfo;

        if (walletInfo?.address) {
          dispatch(setManagerInfo({ managerInfo: _managerInfo, pin: confirmPin }));
        } else {
          dispatch(
            createWallet({
              walletInfo: tmpWalletInfo,
              caInfo: { managerInfo: _managerInfo, originChainId },
              pin: confirmPin,
            }),
          );
        }
        dispatch(setCredentials({ pin: confirmPin }));

        if (biometricsReady && biometrics === undefined) {
          Loading.hide();
          navigationService.navigate('SetBiometrics', { pin: confirmPin });
        } else {
          timer.current = onIntervalGetResult({
            managerInfo: _managerInfo,
            onPass: (caInfo: CAInfo) => {
              if (isRecovery) CommonToast.success('Wallet Recovered Successfully!');
              Loading.hide();
              dispatch(
                setCAInfo({
                  caInfo,
                  pin: confirmPin,
                  chainId: originChainId,
                }),
              );
              navigationService.reset('Tab');
            },
            onFail: (message: string) => onResultFail(message, isRecovery, true),
          });
        }
      } catch (error) {
        Loading.hide();
        CommonToast.failError(error);
        pinRef?.current?.reset();
      }
    },
    [biometrics, biometricsReady, dispatch, getDeviceInfo, onIntervalGetResult, onResultFail, originChainId, t],
  );
}

export function useIntervalGetResult() {
  return useCallback((params: IntervalGetResultParams) => intervalGetResult(params), []);
}

type LoginParams = {
  loginAccount: string;
  loginType?: LoginType;
  authenticationInfo?: AuthenticationInfo;
  showLoginAccount?: string;
};

export function useGoGuardianApproval(isLogin?: boolean) {
  const dispatch = useAppDispatch();
  return useCallback(
    ({
      originChainId,
      loginAccount,
      userGuardiansList,
      authenticationInfo,
    }: {
      originChainId: ChainId;
      loginAccount: string;
      userGuardiansList?: any;
      authenticationInfo?: AuthenticationInfo;
    }) => {
      const onConfirm = () => {
        dispatch(setOriginChainId(originChainId));
        navigationService.navigate('GuardianApproval', {
          loginAccount,
          userGuardiansList,
          authenticationInfo,
        });
      };
      if (!isLogin) {
        ActionSheet.alert({
          title: 'Continue with this account?',
          message: `This account already exists. Click "Confirm" to log in.`,
          buttons: [
            { title: 'Cancel', type: 'outline' },
            {
              title: 'Confirm',
              onPress: () => onConfirm(),
            },
          ],
        });
      } else {
        onConfirm();
      }
    },
    [dispatch, isLogin],
  );
}

type LoginConfirmParams = {
  showLoginAccount: string;
  loginAccount: string;
  loginType: LoginType;
  authenticationInfo?: AuthenticationInfo;
};

type LoginAuthParams = LoginConfirmParams & {
  selectedVerifier: VerifierItem;
  chainId: ChainId;
};

const ALLOCATE_SLEEP_TIME = 2 * 1000;
export function useGoSelectVerifier(isLogin?: boolean) {
  const dispatch = useAppDispatch();
  const pin = usePin();
  const { address } = useCurrentWalletInfo();
  const verifyToken = useVerifyToken();
  const onRequestOrSetPin = useOnRequestOrSetPin();

  const onConfirmAuth = useCallback(
    async ({ loginAccount, loginType, authenticationInfo, selectedVerifier, chainId }: LoginAuthParams) => {
      const isRequestResult = !!(pin && address);

      const loadingKey = Loading.show(isRequestResult ? { text: CreateAddressLoading } : undefined);

      try {
        const rst = await verifyToken(loginType, {
          accessToken: authenticationInfo?.[loginAccount || ''],
          id: loginAccount,
          verifierId: selectedVerifier?.id,
          chainId,
          operationType: OperationTypeEnum.register,
        });
        onRequestOrSetPin({
          showLoading: !isRequestResult,
          managerInfo: {
            verificationType: VerificationType.register,
            loginAccount: loginAccount,
            type: loginType,
          },
          verifierInfo: { ...rst, verifierId: selectedVerifier?.id },
        });
      } catch (error) {
        Loading.hide(loadingKey);
        CommonToast.failError(error);
      }
      !isRequestResult && Loading.hide(loadingKey);
    },
    [address, onRequestOrSetPin, pin, verifyToken],
  );

  const onDefaultConfirm = useCallback(
    async ({ loginAccount, loginType, selectedVerifier, chainId }: LoginAuthParams) => {
      const loadingKey = Loading.show();
      try {
        const requestCodeResult = await verification.sendVerificationCode({
          params: {
            type: LoginType[loginType],
            guardianIdentifier: loginAccount,
            verifierId: selectedVerifier?.id,
            chainId,
            operationType: OperationTypeEnum.register,
          },
        });
        if (requestCodeResult.verifierSessionId) {
          navigationService.navigate('VerifierDetails', {
            requestCodeResult,
            verificationType: VerificationType.register,
            guardianItem: {
              isLoginAccount: true,
              verifier: selectedVerifier,
              guardianAccount: loginAccount,
              guardianType: loginType,
            },
          });
        } else {
          throw new Error('send fail');
        }
      } catch (error) {
        CommonToast.failError(error);
      }
      Loading.hide(loadingKey);
    },
    [],
  );

  const onConfirm = useCallback(
    async (confirmParams: LoginConfirmParams) => {
      const { loginType } = confirmParams;
      dispatch(setOriginChainId(DefaultChainId));

      const loadingKey = Loading.show({
        text: 'Assigning a verifier on the blockchain...',
      });
      try {
        await sleep(ALLOCATE_SLEEP_TIME);
        const result = await globalRequest.verify.getVerifierServer({
          params: {
            chainId: DefaultChainId,
          },
        });
        Loading.hide(loadingKey);

        const allotVerifier: VerifierItem = result;
        if (!allotVerifier || allotVerifier.id === undefined) {
          throw new Error('No verifier found');
        }
        switch (loginType) {
          case LoginType.Apple:
          case LoginType.Google:
            onConfirmAuth({
              ...confirmParams,
              selectedVerifier: allotVerifier,
              chainId: DefaultChainId,
            });
            break;
          default: {
            ActionSheet.alert({
              title2: (
                <Text>
                  <TextL>{`${allotVerifier?.name} will send a verification code to `}</TextL>
                  <TextL style={fonts.mediumFont}>{confirmParams.showLoginAccount || ''}</TextL>
                  <TextL>{` to verify your ${
                    loginType === LoginType.Phone ? 'phone number' : 'email address'
                  }.`}</TextL>
                </Text>
              ),
              buttons: [
                {
                  title: 'Cancel',
                  // type: 'solid',
                  type: 'outline',
                },
                {
                  title: 'Confirm',
                  onPress: () => {
                    onDefaultConfirm({
                      ...confirmParams,
                      selectedVerifier: allotVerifier,
                      chainId: DefaultChainId,
                    });
                  },
                },
              ],
            });
            break;
          }
        }
      } catch (error) {
        Loading.hide(loadingKey);
        CommonToast.failError(error);
      }
    },
    [dispatch, onConfirmAuth, onDefaultConfirm],
  );
  const onConfirmRef = useRef(onConfirm);
  onConfirmRef.current = onConfirm;

  return useCallback(
    async (params: LoginConfirmParams) => {
      if (isLogin) {
        ActionSheet.alert({
          title: 'Continue with this account?',
          message: `This account has not been registered yet. Click "Confirm" to complete the registration.`,
          buttons: [
            { title: 'Cancel', type: 'outline' },
            {
              title: 'Confirm',
              onPress: () => onConfirmRef.current(params),
            },
          ],
        });
      } else {
        await onConfirmRef.current(params);
      }
    },
    [isLogin],
  );
}

export function useOnLogin(isLogin?: boolean) {
  const getVerifierServers = useGetVerifierServers();
  const getGuardiansInfo = useGetGuardiansInfo();
  const getRegisterInfo = useGetRegisterInfo();
  const getChainInfo = useGetChainInfo();
  const goGuardianApproval = useGoGuardianApproval(isLogin);
  const goSelectVerifier = useGoSelectVerifier(isLogin);

  return useCallback(
    async (params: LoginParams) => {
      const { loginAccount, loginType = LoginType.Email, authenticationInfo, showLoginAccount } = params;
      try {
        let chainInfo = await getChainInfo(DefaultChainId);
        let verifierServers = await getVerifierServers(chainInfo);

        const { originChainId } = await getRegisterInfo({ loginGuardianIdentifier: loginAccount });

        if (originChainId !== DefaultChainId) {
          chainInfo = await getChainInfo(originChainId);
          verifierServers = await getVerifierServers(chainInfo);
        }

        const holderInfo = await getGuardiansInfo({ guardianIdentifier: loginAccount }, chainInfo);
        if (holderInfo?.guardianAccounts || holderInfo?.guardianList) {
          goGuardianApproval({
            originChainId,
            loginAccount,
            userGuardiansList: handleUserGuardiansList(holderInfo, verifierServers),
            authenticationInfo,
          });
        } else {
          await goSelectVerifier({
            showLoginAccount: showLoginAccount || loginAccount,
            loginAccount,
            loginType,
            authenticationInfo,
          });
        }
      } catch (error) {
        if (handleErrorCode(error) === '3002') {
          await goSelectVerifier({
            showLoginAccount: showLoginAccount || loginAccount,
            loginAccount,
            loginType,
            authenticationInfo,
          });
        } else {
          throw error;
        }
      }
    },
    [getChainInfo, getGuardiansInfo, getRegisterInfo, getVerifierServers, goGuardianApproval, goSelectVerifier],
  );
}

export function useOnRequestOrSetPin() {
  const { walletInfo } = useWallet();
  const pin = usePin();
  const onManagerAddressAndQueryResult = useOnManagerAddressAndQueryResult();
  return useCallback(
    ({
      showLoading,
      managerInfo,
      verifierInfo,
      guardiansApproved,
    }: {
      showLoading?: boolean;
      managerInfo: Omit<ManagerInfo, 'managerUniqueId'>;
      verifierInfo?: VerifierInfo;
      guardiansApproved?: GuardiansApproved;
    }) => {
      if (walletInfo?.address && pin) {
        onManagerAddressAndQueryResult({
          managerInfo,
          confirmPin: pin,
          walletInfo,
          verifierInfo,
          guardiansApproved,
          showLoading,
        });
      } else {
        navigationService.navigate('SetPin', {
          managerInfo,
          guardiansApproved,
          verifierInfo,
        });
      }
    },
    [onManagerAddressAndQueryResult, pin, walletInfo],
  );
}
