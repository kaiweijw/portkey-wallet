import { RampType } from '@portkey-wallet/ramp';
import { ChainId } from '@portkey-wallet/types';
import { ActivityItemType } from '@portkey-wallet/types/types-ca/activity';
import { IImInfo } from '@portkey-wallet/types/types-ca/contact';
import { ITransferLimitRouteState } from '@portkey-wallet/types/types-ca/paymentSecurity';
import { BaseToken, TokenItemShowType } from '@portkey-wallet/types/types-ca/token';
import { CaHolderInfo } from '@portkey-wallet/types/types-ca/wallet';
import { CustomAddressItem } from 'pages/Contacts/AddContact';
import { IProfileDetailDataProps } from './Profile';
import { ToAccount, SendStage } from 'pages/Send';

export enum FromPageEnum {
  register = 'register',
  login = 'login',
  guardiansAdd = 'guardiansAdd',
  guardiansEdit = 'guardiansEdit',
  guardiansDel = 'guardiansDel',
  guardiansLoginGuardian = 'guardiansLoginGuardian',
  removeManage = 'removeManage',
  setTransferLimit = 'setTransferLimit',
  chatSearch = 'chat-search',
  chatList = 'chat-list',
  chatBox = 'chat-box',
  chatBoxGroup = 'chat-box-group',
  chatGroupInfo = 'chat-group-info',
  chatMemberList = 'chat-member-list',
}

// Guardians
export type TGuardiansLocationState = {
  accelerateChainId?: ChainId;
};

// AddGuardian
export type TAddGuardianLocationState = {
  accelerateChainId?: ChainId;
  from?: string;
};

export type TAddGuardianLocationSearch = {
  accelerateChainId?: ChainId;
  from?: string;
};

// GuardianApproval
export type TGuardianApprovalFromPage =
  | FromPageEnum.guardiansAdd
  | FromPageEnum.guardiansEdit
  | FromPageEnum.guardiansDel
  | FromPageEnum.guardiansLoginGuardian
  | FromPageEnum.removeManage
  | FromPageEnum.setTransferLimit;

export type TGuardianApprovalLocationState = {
  previousPage: TGuardianApprovalFromPage;
  targetChainId?: ChainId;
  accelerateChainId?: ChainId;
  extra?: string;
  manageAddress?: string;
};

export type TGuardianApprovalLocationSearch = TGuardianApprovalLocationState;

// GuardianRecovery
export type TGuardianRecoveryFromPage =
  | FromPageEnum.guardiansAdd
  | FromPageEnum.guardiansEdit
  | FromPageEnum.guardiansDel
  | FromPageEnum.guardiansLoginGuardian;

export type TGuardianRecoveryLocationState = {
  from: TGuardianRecoveryFromPage;
  accelerateChainId?: ChainId;
  extra?: string;
};

// GuardianItem
export type TGuardianItemFromPage =
  | FromPageEnum.guardiansAdd
  | FromPageEnum.guardiansEdit
  | FromPageEnum.guardiansDel
  | FromPageEnum.guardiansLoginGuardian
  | FromPageEnum.removeManage
  | FromPageEnum.setTransferLimit;

export type TGuardianItemLocationState = {
  from: TGuardianItemFromPage;
};

export type TGuardianItemLocationSearch = TGuardianItemLocationState;

// VerifierAccount
export type TVerifierAccountFromPage =
  | FromPageEnum.register
  | FromPageEnum.login
  | FromPageEnum.guardiansAdd
  | FromPageEnum.guardiansEdit
  | FromPageEnum.guardiansDel
  | FromPageEnum.guardiansLoginGuardian
  | FromPageEnum.removeManage
  | FromPageEnum.setTransferLimit;

export type TVerifierAccountLocationState = {
  from: TVerifierAccountFromPage;
  targetChainId?: ChainId;
  accelerateChainId?: ChainId;
  extra?: string;
};

// SetTransferLimit
export type TSetTransferLimitLocationState = ITransferLimitRouteState;

export type TSetTransferLimitLocationSearch = ITransferLimitRouteState;

// RemoveOtherManage
export type TRemoveOtherManageLocationState = {
  manageAddress: string;
};

export type TRemoveOtherManageLocationSearch = TRemoveOtherManageLocationState;

// TransferSettingEdit
export type TTransferSettingEditLocationState = ITransferLimitRouteState & {
  fromSymbol?: string;
};

// TransferSetting
export type TTransferSettingLocationState = ITransferLimitRouteState;

// Transaction
export type ITransactionLocationState = {
  item: ActivityItemType;
  chainId?: string;
  from?: string;
};

// Ramp
export type TRampLocationState = {
  crypto: string;
  network: string;
  fiat: string;
  country: string;
  amount: string;
  side: RampType;
  tokenInfo?: TokenItemShowType;
};

// ChatListSearch
export type TChatListSearchLocationState = {
  search?: string;
};

// MemberList
export type TMemberListLocationState = {
  search?: string;
};

// NewChat
export type TNewChatLocationState = {
  search?: string;
};

// NFT
export type TNFTLocationState = {
  address: string;
  chainId: ChainId;
  symbol: string;
  totalSupply: string;
  collectionName?: string;
  collectionImageUrl?: string;
  tokenId: string;
  imageUrl?: string;
  balance: string;
  alias?: string;
};

// SetPin
export type TSetNewPinLocationState = {
  pin: string;
};

export type TRampPreviewLocationState = {
  crypto: string;
  network: string;
  fiat: string;
  country: string;
  amount: string;
  side: RampType;
  tokenInfo?: TTokenDetailLocationState;
};

export type TAddContactLocationState = {
  id?: string;
  addresses?: CustomAddressItem[];
  name?: string;
  imInfo?: Partial<IImInfo>;
};

export type TEditContactLocationState = {
  id: string;
  name?: string;
  caHolderInfo?: Partial<CaHolderInfo>;
  isShowRemark?: boolean;
  imInfo?: Partial<IImInfo>;
};

export type TFindMoreFromPage = FromPageEnum.chatSearch | FromPageEnum.chatList;

export type TFindMoreLocationState = {
  search?: string;
  from?: TFindMoreFromPage;
};

export type TViewContactLocationState = IProfileDetailDataProps & {
  id: string;
  name: string;
  portkeyId?: string;
  channelUuid?: string;
};

export type TReceiveLocationState = {
  chainId: ChainId;
  symbol: string;
  balance: string;
  imageUrl: string;
  address: string;
  balanceInUsd: string;
  decimals: string | number;
};

export type TSendLocationState = BaseToken & {
  chainId: ChainId;
  targetChainId?: ChainId;
  toAccount?: ToAccount;
  stage?: SendStage;
  amount?: string;
  balance?: string;
};

export type TRecentDetailLocationState = {
  chainId: ChainId;
  targetChainId: ChainId;
  targetAddress?: string;
  index?: string;
  name?: string;
  avatar?: string;
};

export type TTokenDetailLocationState = {
  symbol: string;
  chainId: ChainId;
  balance: string;
  decimals: number;
  tokenContractAddress: string;
  balanceInUsd?: string;
};

export type TWalletNameFromPage =
  | FromPageEnum.chatBox
  | FromPageEnum.chatBoxGroup
  | FromPageEnum.chatGroupInfo
  | FromPageEnum.chatMemberList;

export type TWalletNameLocationState = {
  from?: TWalletNameFromPage;
  channelUuid?: string;
  search?: string;
};
