import React, { memo } from 'react';
import { View, ViewStyle } from 'react-native';
import { pTd } from '../../utils/unit';
import { TextM, TextS } from '../CommonText';
import CommonAvatar from '../CommonAvatar';
import Touchable from '../Touchable';
import { makeStyles } from '../../theme';

export type NoDataPropsType = {
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
  data: {
    alias: string;
    balance?: string;
    chainId: string;
    imageUrl: string;
    symbol?: string;
    tokenContractAddress?: string;
    tokenId: string;
  };
  onPress?: () => void;
};

const NFTAvatar: React.FC<NoDataPropsType> = props => {
  const {
    style = {},
    disabled = false,
    data: { imageUrl, tokenId, alias },
    onPress,
  } = props;

  const outStyles = Array.isArray(style) ? style : [style];
  const styles = useStyles();
  return (
    <Touchable disabled={disabled} style={[styles.wrap, ...outStyles]} onPress={onPress}>
      {imageUrl && <CommonAvatar avatarSize={pTd(98)} shapeType="square" imageUrl={imageUrl} style={styles.img} />}
      <TextM
        numberOfLines={imageUrl ? 1 : 2}
        ellipsizeMode="tail"
        style={[styles.title, !!imageUrl && styles.titleNoPic]}>
        {alias}
      </TextM>
      <TextS style={[styles.id, !!imageUrl && styles.idNoPic]}>{`# ${tokenId}`}</TextS>
      {imageUrl && <View style={styles.mask} />}
    </Touchable>
  );
};
export default memo(NFTAvatar);

const useStyles = makeStyles(theme => {
  return {
    wrap: {
      width: pTd(98),
      height: pTd(98),
      ...theme.paddingArg(12, 8),
      borderRadius: pTd(8),
      overflow: 'hidden',
      // display: 'flex',
      // justifyContent: 'center',
      // alignItems: 'center',
      backgroundColor: theme.bg6,
    },
    img: {
      position: 'absolute',
      width: pTd(98),
      height: pTd(98),
    },
    title: {
      color: theme.font5,
      lineHeight: pTd(20),
    },
    titleNoPic: {
      zIndex: 100,
      position: 'absolute',
      color: theme.font2,
      left: pTd(8),
      bottom: pTd(20),
    },
    id: {
      position: 'absolute',
      bottom: pTd(12),
      left: pTd(8),
      lineHeight: pTd(16),
    },
    idNoPic: {
      zIndex: 100,
      position: 'absolute',
      bottom: pTd(4),
      color: theme.font2,
    },
    message: {
      color: theme.font7,
      lineHeight: pTd(22),
      textAlign: 'center',
    },
    mask: {
      position: 'absolute',
      width: pTd(98),
      height: pTd(40),
      bottom: 0,
      backgroundColor: 'black',
      opacity: 0.4,
      shadowOffset: {
        width: pTd(10),
        height: -pTd(10),
      },
      shadowRadius: pTd(6),
    },
  };
});
