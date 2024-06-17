import { useCallback, useState } from 'react';
import { request } from '@portkey-wallet/api/api-did';
import { useEffectOnce } from '@portkey-wallet/hooks';
import { handleErrorMessage, handleLoopFetch } from '@portkey-wallet/utils';
import { ChainId } from '@portkey-wallet/types';

export enum MintStatusEnum {
  NONE = 'NONE',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  SUCCESS = 'SUCCESS',
}

export const useGetMintRecentStatus = () => {
  const [recentStatus, setRecentStatus] = useState<MintStatusEnum | null>(null);
  const [itemId, setItemId] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMintRecentStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request.mint.getMintRecentStatus();
      setRecentStatus(res.status);
      setItemId(res.itemId);
    } catch (e) {
      setError(handleErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffectOnce(() => {
    getMintRecentStatus();
  });

  return {
    itemId,
    recentStatus,
    loading,
    error,
    getMintRecentStatus,
  };
};

export const useGetMintStatus = () => {
  const [loading, setLoading] = useState(false);

  const getMintStatus = useCallback(async (itemId: string) => {
    setLoading(true);
    try {
      const res = await request.mint.getMintRecentStatus({ params: { itemId } });
      return { data: res.status, error: null };
    } catch (e) {
      return { data: null, error: handleErrorMessage(e) };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    getMintStatus,
  };
};

export type TMintInfo = {
  collectionInfo: {
    imageUrl: string;
    collectionName: string;
    chainId: ChainId;
    symbol: string;
  };
  tokenId: string;
};

export const useGetMintInfo = () => {
  const [mintInfo, setMintInfo] = useState<TMintInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getMintInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await request.mint.getMintInfo();
      setMintInfo(res);
      return { data: res, error: null };
    } catch (e) {
      setError(handleErrorMessage(e));
      return { data: null, error: handleErrorMessage(e) };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffectOnce(() => {
    getMintInfo();
  });

  return {
    mintInfo,
    loading,
    error,
    getMintInfo,
  };
};

export const useGetMintDetail = () => {
  const [loading, setLoading] = useState(false);

  const getMintDetail = useCallback(async (itemId: string) => {
    setLoading(true);
    try {
      const res = await request.mint.getMintDetail({ params: { itemId } });
      return { data: res, error: null };
    } catch (e) {
      return { data: null, error: handleErrorMessage(e) };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    getMintDetail,
  };
};

export type TMintConfirmParams = {
  imageUrl: string;
  name: string;
  tokenId: string;
  description: string;
};

export const useLoopMintStatus = () => {
  return useCallback(async (itemId: string) => {
    const creationStatus = await handleLoopFetch({
      fetch: () => {
        return request.mint.getMintStatus({
          params: { itemId },
        });
      },
      times: 10,
      interval: 2000,
      checkIsContinue: _creationStatusResult => {
        return _creationStatusResult?.status === MintStatusEnum.PENDING;
      },
    });
    return creationStatus.state;
  }, []);
};

export const useConfirmMint = () => {
  const [loading, setLoading] = useState(false);
  const loopMintStatus = useLoopMintStatus();

  const confirmMint = useCallback(
    async (params: TMintConfirmParams) => {
      setLoading(true);
      let itemId: string;
      try {
        const res = await request.mint.confirmMint({ params });
        itemId = res.itemId;
      } catch (error) {
        setLoading(false);
        return { itemId: null, error: handleErrorMessage(error) };
      }

      try {
        const status = await loopMintStatus(itemId);
        return { itemId, status };
      } catch (error) {
        return { itemId, error: handleErrorMessage(error) };
      } finally {
        setLoading(false);
      }
    },
    [loopMintStatus],
  );

  return {
    loading,
    confirmMint,
  };
};

export const useConfirmMintAgain = () => {
  const [loading, setLoading] = useState(false);
  const loopMintStatus = useLoopMintStatus();

  const confirmMint = useCallback(
    async (itemId: string) => {
      setLoading(true);
      try {
        await request.mint.confirmMintAgain({ params: { itemId } });
      } catch (error) {
        setLoading(false);
        return { itemId, error: handleErrorMessage(error) };
      }

      try {
        const status = await loopMintStatus(itemId);
        return { itemId, status };
      } catch (error) {
        return { itemId, error: handleErrorMessage(error) };
      } finally {
        setLoading(false);
      }
    },
    [loopMintStatus],
  );

  return {
    loading,
    confirmMint,
  };
};
