import React, { useMemo, useState } from 'react';
import OverlayModal from '@portkey-wallet/rn-components/components/OverlayModal';
import { Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import Touchable from '@portkey-wallet/rn-components/components/Touchable';
import Svg from '@portkey-wallet/rn-components/components/Svg';
import { TextL, TextM } from '@portkey-wallet/rn-components/components/CommonText';
import { pTd } from 'utils/unit';
import { useLanguage } from 'i18n/hooks';
import CommonInput from '@portkey-wallet/rn-components/components/CommonInput';
import { useGStyles } from 'assets/theme/useGStyles';
import { ModalBody } from '@portkey-wallet/rn-components/components/ModalBody';
import { defaultColors } from 'assets/theme';
import CommonAvatar from '@portkey-wallet/rn-components/components/CommonAvatar';
import { chainShowText } from '@portkey-wallet/utils';
import { FontStyles } from 'assets/theme/styles';
import { IRampCryptoItem } from '@portkey-wallet/ramp';

type ItemType = IRampCryptoItem;

type SelectListProps = {
  value?: string; // `${network}_${symbol}`
  list: Array<ItemType>;
  callBack: (item: ItemType) => void;
};

const SelectList = ({ list, callBack, value }: SelectListProps) => {
  const { t } = useLanguage();
  const gStyle = useGStyles;
  const [keyWord, setKeyWord] = useState<string>('');

  const _list = useMemo(() => {
    const _keyWord = keyWord?.trim();
    return _keyWord === '' ? list : list.filter(item => item.symbol === _keyWord);
  }, [keyWord, list]);

  return (
    <ModalBody style={gStyle.overlayStyle} title={t('Select Crypto')} modalBodyType="bottom">
      <View style={styles.titleWrap}>
        <CommonInput
          containerStyle={styles.titleInputWrap}
          inputContainerStyle={styles.titleInputWrap}
          inputStyle={styles.titleInput}
          leftIconContainerStyle={styles.titleIcon}
          value={keyWord}
          placeholder={t('Search crypto')}
          onChangeText={setKeyWord}
        />
      </View>
      {_list.length ? (
        <ScrollView alwaysBounceVertical={false}>
          {_list.map(item => {
            return (
              <Touchable
                key={`${item.network}_${item.symbol}`}
                onPress={() => {
                  OverlayModal.hide();
                  callBack(item);
                }}>
                <View style={styles.itemRow}>
                  <CommonAvatar hasBorder title={item.symbol} avatarSize={pTd(32)} imageUrl={item.icon || ' '} />
                  <View style={styles.itemContent}>
                    <View>
                      <TextL>{item.symbol}</TextL>
                      <TextM style={FontStyles.font7}>{`${chainShowText(item.chainId)} ${item.chainId}`}</TextM>
                    </View>

                    {value !== undefined && value === `${item.network}_${item.symbol}` && (
                      <Svg iconStyle={styles.itemIcon} icon="selected" size={pTd(24)} />
                    )}
                  </View>
                </View>
              </Touchable>
            );
          })}
        </ScrollView>
      ) : (
        <TextL style={styles.noResult}>{t('No results found')}</TextL>
      )}
    </ModalBody>
  );
};

const showList = (params: SelectListProps) => {
  Keyboard.dismiss();
  OverlayModal.show(<SelectList {...params} />, {
    position: 'bottom',
    enabledNestScrollView: true,
  });
};

export default {
  showList,
};

const styles = StyleSheet.create({
  titleWrap: {
    paddingHorizontal: pTd(16),
    marginBottom: pTd(8),
  },
  titleLabel: {
    textAlign: 'center',
    marginVertical: pTd(16),
  },
  titleInputWrap: {
    height: pTd(44),
  },
  titleInput: {
    fontSize: pTd(14),
  },
  titleIcon: {
    marginLeft: pTd(16),
  },
  itemRow: {
    height: pTd(72),
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: defaultColors.border6,
    marginHorizontal: pTd(20),
  },
  itemContent: {
    flex: 1,
    height: pTd(72),
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: pTd(16),
  },
  itemIcon: {
    position: 'absolute',
    right: 0,
  },
  noResult: {
    lineHeight: pTd(22),
    textAlign: 'center',
    marginVertical: pTd(60),
    color: defaultColors.font7,
  },
});
