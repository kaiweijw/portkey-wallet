import React from 'react';
import { StyleSheet, View, Text, Image, StyleProp, ViewStyle, TextInput, TouchableOpacity } from 'react-native';
import Svg from 'components/Svg';
import { defaultColors } from 'assets/theme';
import fonts from 'assets/theme/fonts';
import { pTd } from 'utils/unit';

interface FromCardProps {
  wrapStyle?: StyleProp<ViewStyle>;
  network: string;
  networkName: string;
  tokenSymbol: string;
  tokenIcon: string;
  onChangeText: (text: string) => void;
  onPress: () => void;
  showAmount: boolean;
}

export const FromCard: React.FC<FromCardProps> = ({
  wrapStyle,
  network,
  networkName,
  tokenIcon,
  tokenSymbol,
  onChangeText,
  onPress,
  showAmount,
}) => {
  const getNetworkImagePath = () => {
    switch (network) {
      case 'ETH':
        return require('assets/image/pngs/third-party-ethereum.png');
      case 'BSC':
        return require('assets/image/pngs/third-party-bnb.png');
      case 'TRX':
        return require('assets/image/pngs/third-party-tron.png');
      case 'ARBITRUM':
        return require('assets/image/pngs/third-party-arb.png');
      case 'Solana':
        return require('assets/image/pngs/third-party-solana.png');
      case 'MATIC':
        return require('assets/image/pngs/third-party-polygon.png');
      case 'OPTIMISM':
        return require('assets/image/pngs/third-party-op.png');
      case 'AVAXC':
        return require('assets/image/pngs/third-party-avax.png');
      default: {
        return require('assets/image/pngs/third-party-solana.png');
      }
    }
  };

  return (
    <View style={[styles.container, wrapStyle]}>
      <View style={styles.chainWrapper}>
        <Text style={styles.typeText}>From</Text>
        <Image style={styles.chainIconImage} source={getNetworkImagePath()} />
        <Text style={styles.chainNameText}>{networkName}</Text>
      </View>
      <View style={styles.contentWrapper}>
        <TouchableOpacity style={styles.tokenWrapper} onPress={onPress}>
          {tokenIcon && <Image style={styles.tokenIconImage} source={{ uri: tokenIcon }} />}
          <Text style={styles.tokenText}>{tokenSymbol}</Text>
          <Svg iconStyle={styles.arrowIcon} size={pTd(12)} icon={'down-arrow'} />
        </TouchableOpacity>
        {showAmount && (
          <View style={styles.mountWrapper}>
            <Text style={styles.mountDesc}>{'You Pay'}</Text>
            <TextInput
              style={styles.mountTextInput}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={defaultColors.font11}
              onChangeText={onChangeText}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: defaultColors.bg33,
    borderRadius: pTd(6),
    paddingHorizontal: pTd(12),
    paddingVertical: pTd(20),
  },
  chainWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeText: {
    color: defaultColors.font11,
    fontSize: pTd(12),
  },
  chainIconImage: {
    marginLeft: pTd(8),
    width: pTd(16),
    height: pTd(16),
    borderRadius: pTd(8),
  },
  chainNameText: {
    marginLeft: pTd(4),
    color: defaultColors.font5,
    fontSize: pTd(12),
  },
  contentWrapper: {
    marginTop: pTd(20),
    height: pTd(46),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIconImage: {
    width: pTd(28),
    height: pTd(28),
    borderRadius: pTd(14),
  },
  tokenText: {
    marginLeft: pTd(8),
    color: defaultColors.font5,
    fontSize: pTd(20),
    ...fonts.mediumFont,
  },
  arrowIcon: {
    marginLeft: pTd(12),
  },
  mountWrapper: {
    alignItems: 'flex-end',
    flex: 1,
    marginLeft: pTd(20),
  },
  mountText: {
    color: defaultColors.font5,
    fontSize: pTd(20),
    ...fonts.mediumFont,
  },
  mountTextInput: {
    marginTop: pTd(2),
    width: '100%',
    color: defaultColors.font5,
    fontSize: pTd(20),
    ...fonts.mediumFont,
    textAlign: 'right',
  },
  mountDesc: {
    fontSize: pTd(12),
    color: defaultColors.font11,
  },
});