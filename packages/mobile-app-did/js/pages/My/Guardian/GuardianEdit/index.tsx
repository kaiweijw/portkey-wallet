import GStyles from 'assets/theme/GStyles';
import CommonButton from 'components/CommonButton';
import { TextL, TextM, TextS } from 'components/CommonText';
import Svg from 'components/Svg';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { pTd } from 'utils/unit';
import navigationService from 'utils/navigationService';
import PageContainer from 'components/PageContainer';
import { pageStyles } from './style';
import ListItem from 'components/ListItem';
import CommonInput from 'components/CommonInput';
import { checkEmail } from '@portkey-wallet/utils/check';
import { useGuardiansInfo } from 'hooks/store';
import { LOGIN_TYPE_LIST } from 'constants/misc';
import { PRIVATE_GUARDIAN_ACCOUNT } from '@portkey-wallet/constants/constants-ca/guardian';
import { ApprovalType, VerificationType, OperationTypeEnum, VerifierItem } from '@portkey-wallet/types/verifier';
import { INIT_HAS_ERROR, INIT_NONE_ERROR } from 'constants/common';
import GuardianTypeSelectOverlay from '../components/GuardianTypeSelectOverlay';
import VerifierSelectOverlay from '../components/VerifierSelectOverlay';
import ActionSheet from 'components/ActionSheet';
import { ErrorType } from 'types/common';
import { UserGuardianItem } from '@portkey-wallet/store/store-ca/guardians/type';
import { FontStyles } from 'assets/theme/styles';
import Loading from 'components/Loading';
import CommonToast from 'components/CommonToast';
import useRouterParams from '@portkey-wallet/hooks/useRouterParams';
import { LoginType } from '@portkey-wallet/types/types-ca/wallet';
import { useAppDispatch } from 'store/hooks';
import { setPreGuardianAction } from '@portkey-wallet/store/store-ca/guardians/actions';
import { VerifierImage } from 'pages/Guardian/components/VerifierImage';
import { verification } from 'utils/api';
import fonts from 'assets/theme/fonts';
import PhoneInput from 'components/PhoneInput';
import Touchable from 'components/Touchable';
import {
  AppleAuthentication,
  useAppleAuthentication,
  useGoogleAuthentication,
  useVerifyToken,
} from 'hooks/authentication';
import GuardianAccountItem from '../components/GuardianAccountItem';
import { request } from '@portkey-wallet/api/api-did';
import verificationApiConfig from '@portkey-wallet/api/api-did/verification';
import { useCurrentWalletInfo, useOriginChainId } from '@portkey-wallet/hooks/hooks-ca/wallet';
import { usePhoneCountryCode } from '@portkey-wallet/hooks/hooks-ca/misc';
import { checkIsLastLoginAccount } from '@portkey-wallet/utils/guardian';
import { cancelLoginAccount } from 'utils/guardian';
import { useGetCurrentCAContract } from 'hooks/contract';
import myEvents from 'utils/deviceEvent';
import { ChainId } from '@portkey-wallet/types';
import { useRefreshGuardiansList } from 'hooks/guardian';

type RouterParams = {
  guardian?: UserGuardianItem;
  isEdit?: boolean;
  accelerateChainId?: ChainId;
};

type thirdPartyInfoType = {
  id: string;
  accessToken: string;
};

type TypeItemType = typeof LOGIN_TYPE_LIST[number];

const GuardianEdit: React.FC = () => {
  const dispatch = useAppDispatch();
  const originChainId = useOriginChainId();
  const { caHash, address: managerAddress } = useCurrentWalletInfo();
  const getCurrentCAContract = useGetCurrentCAContract();
  const refreshGuardiansList = useRefreshGuardiansList();

  const { guardian: editGuardian, isEdit = false, accelerateChainId = originChainId } = useRouterParams<RouterParams>();

  const { verifierMap, userGuardiansList } = useGuardiansInfo();
  const verifierList = useMemo(() => (verifierMap ? Object.values(verifierMap) : []), [verifierMap]);

  const [selectedType, setSelectedType] = useState<TypeItemType>();
  const [selectedVerifier, setSelectedVerifier] = useState<VerifierItem>();
  const [account, setAccount] = useState<string>();
  const [guardianAccountError, setGuardianAccountError] = useState<ErrorType>({ ...INIT_HAS_ERROR });
  const [verifierError, setVerifierError] = useState<ErrorType>({ ...INIT_NONE_ERROR });
  const { localPhoneCountryCode: country } = usePhoneCountryCode();
  const { appleSign } = useAppleAuthentication();
  const { googleSign } = useGoogleAuthentication();
  const verifyToken = useVerifyToken();
  const [firstName, setFirstName] = useState<string>();

  const thirdPartyInfoRef = useRef<thirdPartyInfoType>();

  useEffect(() => {
    if (editGuardian) {
      setSelectedType(LOGIN_TYPE_LIST.find(item => item.value === editGuardian?.guardianType));
      if ([LoginType.Apple, LoginType.Google].includes(editGuardian.guardianType)) {
        setAccount(editGuardian.isPrivate ? PRIVATE_GUARDIAN_ACCOUNT : editGuardian.thirdPartyEmail);
      } else {
        setAccount(editGuardian.guardianAccount);
      }
      setSelectedVerifier(verifierList.find(item => item.name === editGuardian?.verifier?.name));
    }
  }, [editGuardian, verifierList]);

  const onAccountChange = useCallback((value: string) => {
    setAccount(value);
    setGuardianAccountError({ ...INIT_NONE_ERROR });
  }, []);

  const onChooseVerifier = useCallback((item: VerifierItem) => {
    setVerifierError({ ...INIT_NONE_ERROR });
    setSelectedVerifier(item);
  }, []);

  const checkCurGuardianRepeat = useCallback(
    (guardiansList: UserGuardianItem[]) => {
      if (!selectedType) return false;

      if (isEdit) {
        guardiansList = guardiansList.filter(guardian => guardian.key !== editGuardian?.key);
      }
      let isValid = true;
      let guardianAccount: string | undefined;
      if ([LoginType.Email, LoginType.Phone].includes(selectedType.value)) {
        if (selectedType.value === LoginType.Phone && !isEdit) {
          guardianAccount = `+${country?.code}${account}`;
        } else {
          guardianAccount = account;
        }
      } else {
        // LoginType.Apple & LoginType.Google
        guardianAccount = isEdit ? editGuardian?.guardianAccount : thirdPartyInfoRef.current?.id;
      }

      if (
        guardiansList.find(
          item => item.guardianType === selectedType?.value && item.guardianAccount === guardianAccount,
        )
      ) {
        isValid = false;
        setGuardianAccountError({ ...INIT_HAS_ERROR, errorMsg: 'The account already exists' });
      } else {
        setGuardianAccountError({ ...INIT_NONE_ERROR });
      }

      if (guardiansList.find(item => item.verifier?.id === selectedVerifier?.id)) {
        isValid = false;
        setVerifierError({ ...INIT_HAS_ERROR, errorMsg: 'The verifier already exists' });
      } else {
        setVerifierError({ ...INIT_NONE_ERROR });
      }

      return isValid;
    },
    [account, country?.code, editGuardian, isEdit, selectedType, selectedVerifier?.id],
  );

  const thirdPartyConfirm = useCallback(
    async (
      guardianAccount: string,
      thirdPartyInfo: thirdPartyInfoType,
      verifierInfo: VerifierItem,
      guardianType: LoginType,
    ) => {
      const rst = await verifyToken(guardianType, {
        accessToken: thirdPartyInfo.accessToken,
        id: thirdPartyInfo.id,
        verifierId: verifierInfo.id,
        chainId: originChainId,
        operationType: OperationTypeEnum.addGuardian,
      });
      Loading.hide();

      navigationService.navigate('GuardianApproval', {
        approvalType: ApprovalType.addGuardian,
        guardianItem: {
          isLoginAccount: false,
          verifier: verifierInfo,
          guardianAccount,
          guardianType,
        },
        verifierInfo: {
          ...rst,
          verifierId: verifierInfo.id,
        },
        verifiedTime: Date.now(),
        authenticationInfo: { [thirdPartyInfo.id]: thirdPartyInfo.accessToken },
        accelerateChainId,
      });
    },
    [verifyToken, originChainId, accelerateChainId],
  );

  const onConfirm = useCallback(async () => {
    if (selectedVerifier === undefined || selectedType === undefined) return;
    const guardianType = selectedType.value;
    let guardianAccount = account;
    let showGuardianAccount;
    if (guardianType === LoginType.Phone) {
      guardianAccount = `+${country.code}${account}`;
      showGuardianAccount = `+${country.code} ${account}`;
    }
    if (guardianType === LoginType.Email) {
      const guardianErrorMsg = checkEmail(account);
      if (guardianErrorMsg) {
        setGuardianAccountError({
          isError: true,
          errorMsg: guardianErrorMsg,
        });
        setVerifierError({ ...INIT_NONE_ERROR });
        return;
      }
    }

    const isValid = checkCurGuardianRepeat(userGuardiansList || []);
    if (!isValid) return;

    Loading.showOnce();
    const _userGuardiansList = await refreshGuardiansList();
    const isValid2 = checkCurGuardianRepeat(_userGuardiansList || []);
    if (!isValid2) {
      Loading.hide();
      return;
    }

    if ([LoginType.Apple, LoginType.Google].includes(guardianType)) {
      if (!thirdPartyInfoRef.current) return;
      try {
        Loading.showOnce();
        await thirdPartyConfirm(guardianAccount || '', thirdPartyInfoRef.current, selectedVerifier, guardianType);
      } catch (error) {
        CommonToast.failError(error);
      }
      Loading.hide();
      return;
    }

    ActionSheet.alert({
      title2: (
        <Text>
          <TextL>{`${selectedVerifier.name} will send a verification code to `}</TextL>
          <TextL style={fonts.mediumFont}>{showGuardianAccount || guardianAccount}</TextL>
          <TextL>{` to verify your ${guardianType === LoginType.Phone ? 'phone number' : 'email address'}.`}</TextL>
        </Text>
      ),
      buttons: [
        {
          title: 'Cancel',
          type: 'outline',
        },
        {
          title: 'Confirm',
          onPress: async () => {
            try {
              if ([LoginType.Email, LoginType.Phone].includes(guardianType)) {
                Loading.show();
                const req = await verification.sendVerificationCode({
                  params: {
                    type: LoginType[guardianType],
                    guardianIdentifier: guardianAccount,
                    verifierId: selectedVerifier.id,
                    chainId: originChainId,
                    operationType: OperationTypeEnum.addGuardian,
                  },
                });
                if (req.verifierSessionId) {
                  navigationService.navigate('VerifierDetails', {
                    guardianItem: {
                      isLoginAccount: false,
                      verifier: selectedVerifier,
                      guardianAccount,
                      guardianType: guardianType,
                    },
                    requestCodeResult: {
                      verifierSessionId: req.verifierSessionId,
                    },
                    verificationType: VerificationType.addGuardian,
                    accelerateChainId,
                  });
                } else {
                  throw new Error('send fail');
                }
              }
            } catch (error) {
              CommonToast.failError(error);
            }
            Loading.hide();
          },
        },
      ],
    });
  }, [
    selectedVerifier,
    selectedType,
    account,
    checkCurGuardianRepeat,
    userGuardiansList,
    refreshGuardiansList,
    country.code,
    thirdPartyConfirm,
    originChainId,
    accelerateChainId,
  ]);

  const onApproval = useCallback(async () => {
    const isValid = checkCurGuardianRepeat(userGuardiansList || []);
    if (!isValid || !editGuardian || !selectedVerifier) return;

    Loading.show();
    const _userGuardiansList = await refreshGuardiansList();
    const isValid2 = checkCurGuardianRepeat(_userGuardiansList || []);
    if (!isValid2) {
      Loading.hide();
      return;
    }

    dispatch(setPreGuardianAction(editGuardian));
    navigationService.navigate('GuardianApproval', {
      approvalType: ApprovalType.editGuardian,
      guardianItem: {
        ...editGuardian,
        verifier: selectedVerifier,
      },
    });
  }, [checkCurGuardianRepeat, dispatch, editGuardian, refreshGuardiansList, selectedVerifier, userGuardiansList]);

  const onRemove = useCallback(async () => {
    if (!editGuardian || !userGuardiansList) return;

    const isLastLoginAccount = checkIsLastLoginAccount(userGuardiansList, editGuardian);

    if (isLastLoginAccount) {
      ActionSheet.alert({
        title2: 'This guardian is the only login account and cannot be removed',
        buttons: [
          {
            title: 'OK',
          },
        ],
      });
      return;
    }

    const isLoginAccount = editGuardian.isLoginAccount;
    const result = await new Promise(resolve => {
      ActionSheet.alert({
        title: isLoginAccount ? undefined : 'Are you sure you want to remove this guardian?',
        title2: isLoginAccount
          ? `This guardian is set as a login account. Click "Confirm" to unset and remove this guardian`
          : undefined,
        message: isLoginAccount ? undefined : `Removing a guardian requires guardians' approval`,
        buttons: [
          {
            title: isLoginAccount ? 'Cancel' : 'Close',
            type: 'outline',
            onPress: () => {
              resolve(false);
            },
          },
          {
            title: isLoginAccount ? 'Confirm' : 'Send Request',
            onPress: () => {
              resolve(true);
            },
          },
        ],
      });
    });
    if (!result) return;

    if (editGuardian.isLoginAccount) {
      if (!managerAddress || !caHash) return;
      Loading.show();
      try {
        const caContract = await getCurrentCAContract();
        const req = await cancelLoginAccount(caContract, managerAddress, caHash, editGuardian);
        if (req && !req.error) {
          myEvents.refreshGuardiansList.emit();
        } else {
          CommonToast.fail(req?.error?.message || '');
          return;
        }
      } catch (error) {
        CommonToast.failError(error);
        return;
      } finally {
        Loading.hide();
      }
    }

    navigationService.navigate('GuardianApproval', {
      approvalType: ApprovalType.deleteGuardian,
      guardianItem: editGuardian,
    });
  }, [caHash, editGuardian, getCurrentCAContract, managerAddress, userGuardiansList]);

  const isConfirmDisable = useMemo(
    () => !selectedVerifier || !selectedType || !account,
    [account, selectedType, selectedVerifier],
  );

  const isApprovalDisable = useMemo(
    () => selectedVerifier?.id === editGuardian?.verifier?.id,
    [editGuardian, selectedVerifier],
  );

  const onChooseType = useCallback((_type: TypeItemType) => {
    setSelectedType(_type);
    setAccount(undefined);
    setFirstName(undefined);
    thirdPartyInfoRef.current = undefined;
    setGuardianAccountError({ ...INIT_NONE_ERROR });
  }, []);

  const onAppleSign = useCallback(async () => {
    Loading.show();
    let userInfo: AppleAuthentication;
    try {
      userInfo = await appleSign();
      thirdPartyInfoRef.current = {
        id: userInfo.user.id,
        accessToken: userInfo.identityToken || '',
      };
    } catch (error) {
      CommonToast.failError(error);
      Loading.hide();
      return;
    }

    Loading.show();
    try {
      const appleUserExtraInfo: {
        email: string;
        firstName: string | null;
        fullName: string | null;
        guardianType: string;
        id: string;
        isPrivate: boolean;
        lastName: string | null;
      } = await request.verify.getAppleUserExtraInfo({
        url: `${verificationApiConfig.getAppleUserExtraInfo.target}/${userInfo.user.id}`,
      });

      setFirstName(appleUserExtraInfo.firstName || undefined);
      if (appleUserExtraInfo.isPrivate) {
        setAccount(PRIVATE_GUARDIAN_ACCOUNT);
      } else {
        setAccount(appleUserExtraInfo.email || PRIVATE_GUARDIAN_ACCOUNT);
      }
    } catch (error) {
      if (!userInfo) return;
      setFirstName(userInfo.fullName?.givenName || undefined);
      if (userInfo.user.isPrivate) {
        setAccount(PRIVATE_GUARDIAN_ACCOUNT);
      } else {
        setAccount(userInfo.user.email);
      }
    }
    Loading.hide();
  }, [appleSign]);

  const onGoogleSign = useCallback(async () => {
    Loading.show();
    try {
      const userInfo = await googleSign();
      setAccount(userInfo.user.email);
      setFirstName(userInfo.user.givenName || undefined);
      thirdPartyInfoRef.current = {
        id: userInfo.user.id,
        accessToken: userInfo.accessToken,
      };
    } catch (error) {
      CommonToast.failError(error);
    }
    Loading.hide();
  }, [googleSign]);

  const renderGoogleAccount = useCallback(() => {
    return (
      <>
        <TextM style={pageStyles.accountLabel}>Guardian Google</TextM>
        {account ? (
          <>
            <View style={pageStyles.thirdPartAccount}>
              {firstName && <TextM style={pageStyles.firstNameStyle}>{firstName}</TextM>}
              <TextS style={[!!firstName && FontStyles.font3]} numberOfLines={1}>
                {account}
              </TextS>
            </View>
            <TextM>{guardianAccountError.errorMsg}</TextM>
          </>
        ) : (
          <Touchable onPress={onGoogleSign}>
            <View style={pageStyles.oAuthBtn}>
              <TextM style={[FontStyles.font4, fonts.mediumFont]}>Click Add Google Account</TextM>
            </View>
          </Touchable>
        )}
      </>
    );
  }, [account, firstName, guardianAccountError.errorMsg, onGoogleSign]);

  const renderAppleAccount = useCallback(() => {
    return (
      <>
        <TextM style={pageStyles.accountLabel}>Guardian Apple</TextM>
        {account ? (
          <>
            <View style={pageStyles.thirdPartAccount}>
              {firstName && <TextM style={pageStyles.firstNameStyle}>{firstName}</TextM>}
              <TextS style={[!!firstName && FontStyles.font3]} numberOfLines={1}>
                {account}
              </TextS>
            </View>
            <TextM>{guardianAccountError.errorMsg}</TextM>
          </>
        ) : (
          <Touchable onPress={onAppleSign}>
            <View style={pageStyles.oAuthBtn}>
              <TextM style={[FontStyles.font4, fonts.mediumFont]}>Click Add Apple ID</TextM>
            </View>
          </Touchable>
        )}
      </>
    );
  }, [account, firstName, guardianAccountError.errorMsg, onAppleSign]);

  const renderGuardianAccount = useCallback(() => {
    if (isEdit) {
      return (
        <View style={pageStyles.accountWrap}>
          <TextM style={pageStyles.accountLabel}>Guardian {LoginType[editGuardian?.guardianType || 0]}</TextM>
          <GuardianAccountItem guardian={editGuardian} />
          <TextM>{guardianAccountError.errorMsg}</TextM>
        </View>
      );
    }

    if (!selectedType) return <></>;

    switch (selectedType.value) {
      case LoginType.Email:
        return (
          <CommonInput
            disabled={isEdit}
            type="general"
            theme="white-bg"
            label={'Guardian email'}
            value={account}
            placeholder={'Enter email'}
            onChangeText={onAccountChange}
            errorMessage={guardianAccountError.isError ? guardianAccountError.errorMsg : ''}
            keyboardType="email-address"
          />
        );
      case LoginType.Phone:
        return (
          <PhoneInput
            label={'Guardian Phone'}
            theme="white-bg"
            value={account}
            errorMessage={guardianAccountError.isError ? guardianAccountError.errorMsg : ''}
            onChangeText={onAccountChange}
            selectCountry={country}
          />
        );
      case LoginType.Google:
        return renderGoogleAccount();
      case LoginType.Apple:
        return renderAppleAccount();
      default:
        break;
    }
    return <></>;
  }, [
    account,
    country,
    editGuardian,
    guardianAccountError.errorMsg,
    guardianAccountError.isError,
    isEdit,
    onAccountChange,
    renderAppleAccount,
    renderGoogleAccount,
    selectedType,
  ]);

  const goBack = useCallback(() => {
    if (isEdit) return navigationService.navigate('GuardianHome');
    navigationService.goBack();
  }, [isEdit]);

  return (
    <PageContainer
      safeAreaColor={['blue', 'gray']}
      titleDom={isEdit ? 'Edit Guardians' : 'Add Guardians'}
      leftCallback={goBack}
      containerStyles={pageStyles.pageWrap}
      scrollViewProps={{ disabled: true }}>
      <View style={pageStyles.contentWrap}>
        {!isEdit && (
          <>
            <TextM style={pageStyles.titleLabel}>{'Guardian Type'}</TextM>
            <ListItem
              onPress={() => {
                GuardianTypeSelectOverlay.showList({
                  list: LOGIN_TYPE_LIST,
                  labelAttrName: 'name',
                  value: selectedType?.value,
                  callBack: onChooseType,
                });
              }}
              titleStyle={[GStyles.flexRowWrap, GStyles.itemCenter]}
              titleTextStyle={[pageStyles.titleTextStyle, !selectedType && FontStyles.font7]}
              style={pageStyles.typeWrap}
              titleLeftElement={
                selectedType?.icon && <Svg icon={selectedType.icon} size={pTd(28)} iconStyle={pageStyles.typeIcon} />
              }
              title={selectedType?.name || 'Select guardian types'}
              rightElement={<Svg size={pTd(20)} icon="down-arrow" />}
            />
          </>
        )}

        {renderGuardianAccount()}

        <TextM style={pageStyles.titleLabel}>{'Verifier'}</TextM>
        <ListItem
          onPress={() => {
            VerifierSelectOverlay.showList({
              id: selectedVerifier?.id,
              callBack: onChooseVerifier,
              editGuardian: editGuardian,
            });
          }}
          titleLeftElement={
            selectedVerifier && (
              <VerifierImage
                style={pageStyles.verifierImageStyle}
                size={pTd(30)}
                label={selectedVerifier.name}
                uri={selectedVerifier.imageUrl}
              />
            )
          }
          titleStyle={[GStyles.flexRowWrap, GStyles.itemCenter]}
          titleTextStyle={[pageStyles.titleTextStyle, !selectedVerifier && FontStyles.font7]}
          style={pageStyles.verifierWrap}
          title={selectedVerifier?.name || 'Select guardian verifiers'}
          rightElement={<Svg size={pTd(20)} icon="down-arrow" />}
        />
        {verifierError.isError && <TextS style={pageStyles.errorTips}>{verifierError.errorMsg || ''}</TextS>}
      </View>

      <View>
        {isEdit ? (
          <>
            <CommonButton disabled={isApprovalDisable} type="primary" onPress={onApproval}>
              {'Send Request'}
            </CommonButton>
            <CommonButton
              style={pageStyles.removeBtnWrap}
              type="clear"
              onPress={onRemove}
              titleStyle={FontStyles.font12}>
              {'Remove'}
            </CommonButton>
          </>
        ) : (
          <CommonButton disabled={isConfirmDisable} type="primary" onPress={onConfirm}>
            {'Confirm'}
          </CommonButton>
        )}
      </View>
    </PageContainer>
  );
};

export default GuardianEdit;
