import React from 'react';
import OverlayModal from '@portkey-wallet/rn-components/components/OverlayModal';
import { Keyboard, ScrollView, View } from 'react-native';
import Touchable from '@portkey-wallet/rn-components/components/Touchable';
import styles from './styles';
import GStyles from 'assets/theme/GStyles';
import CommonSvg from '@portkey-wallet/rn-components/components/Svg';
import { TextL } from '@portkey-wallet/rn-components/components/CommonText';
import { pTd } from 'utils/unit';
import { useLanguage } from 'i18n/hooks';
import { ModalBody } from '@portkey-wallet/rn-components/components/ModalBody';

type ValueType = string | number;
type DefaultValueType = string;

type ItemTypeBase<T extends ValueType = DefaultValueType> = {
  value: T;
  [key: string]: any;
};

type SelectListProps<ItemType extends ItemTypeBase<ItemValueType>, ItemValueType extends ValueType> = {
  value?: ItemValueType;
  list: Array<ItemType>;
  callBack: (item: ItemType) => void;
  labelAttrName?: string;
};

const SelectList = <ItemType extends ItemTypeBase<ItemValueType>, ItemValueType extends ValueType>({
  list,
  callBack,
  value,
  labelAttrName = 'value',
}: SelectListProps<ItemType, ItemValueType>) => {
  const { t } = useLanguage();

  return (
    <ModalBody title={t('Select Guardians Type')} modalBodyType="bottom">
      <ScrollView alwaysBounceVertical={false}>
        {list.map(item => {
          return (
            <Touchable
              key={item.value}
              onPress={() => {
                OverlayModal.hide();
                callBack(item);
              }}>
              <View style={[GStyles.paddingLeft(20), styles.itemRow]}>
                <View style={styles.itemContent}>
                  {item.icon && <CommonSvg icon={item.icon} size={pTd(32)} iconStyle={styles.leftIcon} />}
                  <TextL>{item[labelAttrName]}</TextL>
                  {value !== undefined && value === item.value && (
                    <CommonSvg iconStyle={styles.itemIcon} icon="selected" size={pTd(24)} />
                  )}
                </View>
              </View>
            </Touchable>
          );
        })}
      </ScrollView>
    </ModalBody>
  );
};

const showList = <ItemType extends ItemTypeBase<ItemValueType>, ItemValueType extends ValueType = DefaultValueType>(
  params: SelectListProps<ItemType, ItemValueType>,
) => {
  Keyboard.dismiss();
  OverlayModal.show(<SelectList<ItemType, ItemValueType> {...params} />, {
    position: 'bottom',
  });
};

export default {
  showList,
};
