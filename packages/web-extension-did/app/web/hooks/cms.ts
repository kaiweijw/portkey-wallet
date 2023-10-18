import { useBuyButtonShow, useEntrance } from '@portkey-wallet/hooks/hooks-ca/cms';
import { IEntranceMatchValueConfig } from '@portkey-wallet/types/types-ca/cms';

import { VersionDeviceType } from '@portkey-wallet/types/types-ca/device';

const useEntranceConfig = (): IEntranceMatchValueConfig => {
  return {
    deviceType: String(VersionDeviceType.Extension),
    version: async () => {
      return process.env.SDK_VERSION?.slice(1) || '';
    },
  };
};

export const useExtensionEntrance = (isInit = false) => {
  const config = useEntranceConfig();
  return useEntrance(config, isInit);
};

export const useExtensionBuyButtonShow = () => {
  const config = useEntranceConfig();
  return useBuyButtonShow(config);
};