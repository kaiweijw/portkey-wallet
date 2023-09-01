import React, { useCallback, useMemo } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import PageContainer from 'components/PageContainer';
import { defaultColors } from 'assets/theme';
import GStyles from 'assets/theme/GStyles';
import { pTd } from 'utils/unit';
import { TextL } from 'components/CommonText';
import Chats from '../components/Chats';
import Svg from 'components/Svg';
import Touchable from 'components/Touchable';
import ChatOverlay from '../components/ChatOverlay';
import navigationService from 'utils/navigationService';
import { ChatOperationsEnum, ChatTabName } from '@portkey-wallet/constants/constants-ca/chat';
import CommonAvatar from 'components/CommonAvatar';
import { FontStyles } from 'assets/theme/styles';
import {
  useMuteChannel,
  usePinChannel,
  useHideChannel,
  useChannelItemInfo,
  useIsStranger,
} from '@portkey-wallet/hooks/hooks-ca/im';
import ActionSheet from 'components/ActionSheet';
import { useCurrentChannelId } from '../context/hooks';
import CommonToast from 'components/CommonToast';
import { handleErrorMessage } from '@portkey-wallet/utils';
import { fetchContactListAsync } from '@portkey-wallet/store/store-ca/contact/actions';
import { useAppCommonDispatch } from '@portkey-wallet/hooks';
import useLockCallback from '@portkey-wallet/hooks/useLockCallback';
import Loading from 'components/Loading';
import { useAddStrangerContact } from '@portkey-wallet/hooks/hooks-ca/contact';
import { screenWidth } from '@portkey-wallet/utils/mobile/device';
import type { ListItemType } from '../components/ChatOverlay/chatPopover';
import myEvents from 'utils/deviceEvent';
import FloatingActionButton from '../components/FloatingActionButton';

const ChatGroupDetailsPage = () => {
  const dispatch = useAppCommonDispatch();

  const pinChannel = usePinChannel();
  const muteChannel = useMuteChannel();
  const hideChannel = useHideChannel();
  const addStranger = useAddStrangerContact();
  const currentChannelId = useCurrentChannelId();
  const currentChannelInfo = useChannelItemInfo(currentChannelId || '');

  const isStranger = useIsStranger(currentChannelInfo?.toRelationId || '');

  const toRelationId = useMemo(() => currentChannelInfo?.toRelationId, [currentChannelInfo?.toRelationId]);
  const displayName = useMemo(() => currentChannelInfo?.displayName, [currentChannelInfo?.displayName]);
  const pin = useMemo(() => currentChannelInfo?.pin, [currentChannelInfo?.pin]);
  const mute = useMemo(() => currentChannelInfo?.mute, [currentChannelInfo?.mute]);

  const addContact = useLockCallback(async () => {
    try {
      await addStranger(toRelationId || '');
      CommonToast.success('Contact Added');
      dispatch(fetchContactListAsync());
    } catch (error) {
      CommonToast.fail(handleErrorMessage(error));
    }
  }, [addStranger, dispatch, toRelationId]);

  const handleList = useMemo((): ListItemType[] => {
    const list: ListItemType[] = [
      {
        title: ChatOperationsEnum.PROFILE,
        iconName: 'chat-profile',
        onPress: () => {
          navigationService.navigate('ChatContactProfile', {
            relationId: toRelationId,
          });
        },
      },
      {
        title: pin ? ChatOperationsEnum.UNPIN : ChatOperationsEnum.PIN,
        iconName: pin ? 'chat-unpin' : 'chat-pin',
        onPress: async () => {
          try {
            await pinChannel(currentChannelId || '', !pin);
          } catch (error) {
            CommonToast.fail(`Failed to ${pin ? 'unpin' : 'pin'} chat`);
          }
        },
      },
      {
        title: mute ? ChatOperationsEnum.UNMUTE : ChatOperationsEnum.MUTE,
        iconName: mute ? 'chat-unmute' : 'chat-mute',
        onPress: async () => {
          try {
            await muteChannel(currentChannelId || '', !mute);
          } catch (error) {
            CommonToast.fail(`Failed to ${mute ? 'unmute' : 'mute'} chat`);
          }
        },
      },
      {
        title: ChatOperationsEnum.DELETE_CHAT,
        iconName: 'chat-delete',
        onPress: () => {
          ActionSheet.alert({
            title: 'Delete chat?',
            buttons: [
              {
                title: 'Cancel',
                type: 'outline',
              },
              {
                title: 'Confirm',
                type: 'primary',
                onPress: async () => {
                  try {
                    Loading.show();
                    await hideChannel(currentChannelId || '');
                    navigationService.navigate('Tab');
                  } catch (error) {
                    CommonToast.fail(`Failed to delete chat`);
                  } finally {
                    Loading.hide();
                  }
                },
              },
            ],
          });
        },
      },
    ];

    if (isStranger)
      list.push({
        title: ChatOperationsEnum.ADD_CONTACT,
        iconName: 'chat-add-contact',
        onPress: () => addContact(),
      });

    return list;
  }, [addContact, currentChannelId, hideChannel, isStranger, mute, muteChannel, pin, pinChannel, toRelationId]);

  const onPressMore = useCallback(
    async (event: GestureResponderEvent) => {
      const { pageY } = event.nativeEvent;

      const top: number =
        (await new Promise(_resolve => {
          event.target.measure((x, y, width, height, pageX, topY) => {
            _resolve(topY);
          });
        })) || 0;
      ChatOverlay.showChatPopover({
        list: handleList,
        formatType: 'dynamicWidth',
        customPosition: { right: pTd(8), top: (top || pageY) + 30 },
        customBounds: {
          x: screenWidth - pTd(20),
          y: pageY,
          width: 0,
          height: 0,
        },
      });
    },
    [handleList],
  );

  const leftDom = useMemo(
    () => (
      <View style={[GStyles.flexRow, GStyles.itemCenter, GStyles.paddingLeft(pTd(16))]}>
        <Touchable
          style={GStyles.marginRight(pTd(20))}
          onPress={() => {
            navigationService.navigate('Tab');
            myEvents.navToBottomTab.emit({ tabName: ChatTabName });
          }}>
          <Svg size={pTd(20)} icon="left-arrow" color={defaultColors.bg1} />
        </Touchable>
        <Touchable
          style={[GStyles.flexRow, GStyles.itemCenter]}
          onPress={() => {
            navigationService.navigate('ChatContactProfile', {
              relationId: toRelationId,
              contact: {
                name: currentChannelInfo?.displayName,
              },
            });
          }}>
          <CommonAvatar title={displayName} avatarSize={pTd(32)} style={FontStyles.size16} />
          <TextL
            style={[FontStyles.font2, GStyles.marginRight(pTd(4)), GStyles.marginLeft(pTd(8)), FontStyles.weight500]}>
            {displayName}
          </TextL>
        </Touchable>

        {mute && <Svg size={pTd(16)} icon="chat-mute" color={defaultColors.bg1} />}
      </View>
    ),
    [currentChannelInfo?.displayName, displayName, mute, toRelationId],
  );
  return (
    <PageContainer
      noCenterDom
      hideTouchable
      safeAreaColor={['blue', 'gray']}
      scrollViewProps={{ disabled: true }}
      containerStyles={styles.container}
      leftDom={leftDom}
      rightDom={
        <Touchable style={[GStyles.marginRight(pTd(16))]} onPress={onPressMore}>
          <Svg size={pTd(20)} icon="more" color={defaultColors.bg1} />
        </Touchable>
      }>
      <FloatingActionButton shouldShowFirstTime={isStranger} onPressButton={addContact} />
      <Chats />
    </PageContainer>
  );
};

export default ChatGroupDetailsPage;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: defaultColors.bg4,
    flex: 1,
    ...GStyles.paddingArg(0),
  },
});
