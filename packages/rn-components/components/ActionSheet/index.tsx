import React, { ReactNode } from 'react';
import OverlayModal from '../OverlayModal';
import { View, Text, Keyboard, ImageBackground, ImageSourcePropType, ScrollView } from 'react-native';
import { styles } from './style/style';
import { TextL, TextM, TextTitle } from '../CommonText';
import ButtonRow, { ButtonRowProps } from '../ButtonRow';
import ButtonCol from '../ButtonCol';
import { pTd } from '../../utils/unit';
import Svg from '../Svg';
import Touchable from '../Touchable';
import { TextStyleType } from '../../theme/type';
import { useTheme } from '../../theme';
const show = (
  items: {
    title: string;
    onPress?: (v: any) => void;
  }[],
  cancelItem?: {
    title: string;
  },
) => {
  Keyboard.dismiss();
  OverlayModal.show(
    <>
      <View style={styles.sheetBox}>
        {items.map((item, index) => {
          const { title, onPress } = item;
          return (
            <Touchable
              key={index}
              style={styles.itemBox}
              onPress={() => {
                OverlayModal.hide();
                onPress?.(item);
              }}>
              <Text style={styles.itemText}>{title}</Text>
            </Touchable>
          );
        })}
      </View>
      {cancelItem && (
        <Touchable onPress={() => OverlayModal.hide()} style={styles.cancelBox}>
          <Text style={styles.cancelText}>{cancelItem.title}</Text>
        </Touchable>
      )}
    </>,
    {
      position: 'bottom',
    },
  );
};

type AlertBodyProps = {
  title?: string;
  title2?: ReactNode;
  message?: ReactNode;
  message2?: ReactNode;
  buttons?: ButtonRowProps['buttons'];
  autoClose?: boolean;
  messageList?: ReactNode[];
  buttonGroupDirection?: 'row' | 'column';
  isCloseShow?: boolean;
  messageStyle?: TextStyleType;
  titleStyle?: TextStyleType;
  bgImage?: ImageSourcePropType;
};

function AlertBody({
  title,
  message,
  buttons,
  message2,
  title2,
  autoClose = true,
  messageList,
  buttonGroupDirection = 'row',
  isCloseShow = false,
  messageStyle,
  titleStyle,
  bgImage,
}: AlertBodyProps) {
  const theme = useTheme();
  return (
    <View style={[styles.alertBox, styles.wrapStyle]}>
      {!!bgImage && <ImageBackground source={bgImage} style={styles.headerBackgroundBg} />}
      <View style={styles.alertBox}>
        {title ? <TextTitle style={[styles.alertTitle, titleStyle]}>{title}</TextTitle> : null}
        {typeof title2 === 'string' ? <TextL style={styles.alertTitle2}>{title2}</TextL> : title2}
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollViewStyle}
          contentContainerStyle={styles.scrollViewContainerStyle}>
          {typeof message === 'string' ? (
            message ? (
              <TextM style={[styles.alertMessage, messageStyle]}>{message}</TextM>
            ) : null
          ) : (
            message
          )}
          {typeof message2 === 'string' ? (
            message2 ? (
              <TextM style={[styles.alertMessage, messageStyle]}>{message2}</TextM>
            ) : null
          ) : (
            message2
          )}
          {messageList?.map((item, index) => {
            return typeof item === 'string' ? (
              item ? (
                <TextM key={index} style={[styles.alertMessage, messageStyle]}>
                  {item}
                </TextM>
              ) : null
            ) : (
              item
            );
          })}
        </ScrollView>
        {buttonGroupDirection === 'row' ? (
          <ButtonRow
            buttons={buttons?.map(i => ({
              ...i,
              onPress: () => {
                if (autoClose) OverlayModal.hide();
                i.onPress?.();
              },
            }))}
          />
        ) : (
          <ButtonCol
            buttons={buttons?.map(i => ({
              ...i,
              onPress: () => {
                if (autoClose) OverlayModal.hide();
                i.onPress?.();
              },
            }))}
          />
        )}
      </View>
      {isCloseShow && (
        <View
          onTouchEnd={() => {
            OverlayModal.hide();
          }}
          style={styles.closeWrap}>
          <Svg icon={'close'} size={pTd(12.5)} color={theme.font7} />
        </View>
      )}
    </View>
  );
}

const alert = (props: AlertBodyProps) => {
  Keyboard.dismiss();
  OverlayModal.show(<AlertBody {...props} />, {
    modal: true,
    type: 'zoomOut',
    position: 'center',
  });
};
export default {
  show,
  alert,
};