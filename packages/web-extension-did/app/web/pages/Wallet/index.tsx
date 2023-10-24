import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { useCommonState, useWalletInfo } from 'store/Provider/hooks';
import WalletPopup from './Popup';
import { MenuItemInfo } from 'pages/components/MenuList';
import WalletPrompt from './Prompt';
import { IExitWalletProps } from './components/ExitWallet';
import { BaseHeaderProps } from 'types/UI';
import { IWalletEntryProps } from './components/WalletEntry';

export interface IWalletProps extends IExitWalletProps, BaseHeaderProps, IWalletEntryProps {
  menuList: MenuItemInfo[];
  select?: string;
  onClose?: () => void;
}

export default function Wallet() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { isPrompt, isNotLessThan768 } = useCommonState();
  const { walletAvatar, walletName, userId } = useWalletInfo();
  const [exitVisible, setExitVisible] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<string>('');

  const AutoLockLabel = 'auto-lock';
  const SwitchNetworksLabel = 'switch-networks';
  const AboutUsLabel = 'about-us';

  const clickAvatar = useCallback(() => {
    navigate('/setting/wallet/wallet-name');
  }, [navigate]);

  const MenuList: MenuItemInfo[] = useMemo(
    () => [
      {
        element: 'Auto-lock',
        key: AutoLockLabel,
        click: () => {
          setSelectedItem(AutoLockLabel);
          navigate('/setting/wallet/auto-lock');
        },
      },
      {
        element: 'Switch Networks',
        key: SwitchNetworksLabel,
        click: () => {
          setSelectedItem(SwitchNetworksLabel);
          navigate('/setting/wallet/switch-networks');
        },
      },
      {
        element: 'About Us',
        key: AboutUsLabel,
        click: () => {
          setSelectedItem(AboutUsLabel);
          navigate('/setting/wallet/about-us');
        },
      },
    ],

    [navigate],
  );

  useEffect(() => {
    if (isPrompt && pathname === '/setting/wallet') {
      setSelectedItem('');
    } else if (isPrompt && MenuList) {
      MenuList.forEach((item) => {
        if (pathname.includes(String(item.key))) {
          setSelectedItem(String(item.key));
        }
      });
    }
  }, [MenuList, isPrompt, pathname, walletName]);

  const title = t('Wallet');
  const exitText = t('Exit Wallet');
  const goBack = useCallback(() => navigate('/setting'), [navigate]);
  const onExit = () => {
    setExitVisible(true);
  };
  const onCancelExit = () => {
    setExitVisible(false);
  };

  return isNotLessThan768 ? (
    <WalletPrompt
      headerTitle={title}
      exitText={exitText}
      exitVisible={exitVisible}
      select={selectedItem}
      walletAvatar={walletAvatar}
      walletName={walletName}
      portkeyId={userId || ''}
      clickAvatar={clickAvatar}
      menuList={MenuList}
      onExit={onExit}
      onCancelExit={onCancelExit}
    />
  ) : (
    <WalletPopup
      headerTitle={title}
      exitText={exitText}
      exitVisible={exitVisible}
      walletAvatar={walletAvatar}
      walletName={walletName}
      portkeyId={userId || ''}
      clickAvatar={clickAvatar}
      menuList={MenuList}
      goBack={goBack}
      onExit={onExit}
      onCancelExit={onCancelExit}
    />
  );
}
