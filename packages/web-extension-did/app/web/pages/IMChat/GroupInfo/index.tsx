import { useGroupChannelInfo, useLeaveChannel, useRelationId } from '@portkey-wallet/hooks/hooks-ca/im';
import { Button, Modal, message } from 'antd';
import CustomSvg from 'components/CustomSvg';
import SettingHeader from 'pages/components/SettingHeader';
import { useNavigate, useParams } from 'react-router';
import { Avatar } from '@portkey-wallet/im-ui-web';
import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { ChannelMemberInfo } from '@portkey-wallet/im';
import './index.less';

const GroupInfo = () => {
  const { channelUuid } = useParams();
  const leaveGroup = useLeaveChannel();
  const myRelationId = useRelationId();
  const { groupInfo, isAdmin, refresh } = useGroupChannelInfo(`${channelUuid}`);
  const memberLen = useMemo(
    () => (typeof groupInfo?.members.length === 'number' ? groupInfo?.members.length : 0),
    [groupInfo?.members.length],
  );
  const navigate = useNavigate();
  const { t } = useTranslation();
  const handleLeaveGroup = useCallback(() => {
    return Modal.confirm({
      width: 320,
      content: t('Are you sure to leave this group?'),
      className: 'leave-group-modal',
      autoFocusButton: null,
      icon: null,
      centered: true,
      okText: t('Yes'),
      cancelText: t('No'),
      onOk: async () => {
        try {
          await leaveGroup(`${channelUuid}`);
          navigate('/chat-list');
        } catch (e) {
          message.error('Failed to leave the group');
          console.log('===Failed to leave the group error', e);
        }
      },
    });
  }, [channelUuid, leaveGroup, navigate, t]);
  const handleGoProfile = useCallback(
    (item: ChannelMemberInfo) => {
      if (item.relationId === myRelationId) {
        navigate('/setting/wallet/wallet-name', { state: { from: 'chat-group-info', channelUuid } });
      } else {
        navigate('/setting/contacts/view', {
          state: { relationId: item.relationId, from: 'chat-group-info', channelUuid },
        });
      }
    },
    [myRelationId, navigate, channelUuid],
  );
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="group-info-page flex-column-between">
      <div className="group-info-header">
        <SettingHeader
          title="Group Info"
          leftCallBack={() => navigate(`/chat-box-group/${channelUuid}`)}
          rightElement={<CustomSvg type="Close2" onClick={() => navigate(`/chat-box-group/${channelUuid}`)} />}
        />
      </div>
      <div className="group-info-body flex-column-between">
        <div className="group-info-container">
          <div className="info-basic flex-center">
            <div className="flex-column-center">
              <div className="group-icon flex-center">
                <CustomSvg type="GroupAvatar" />
              </div>
              <div className="group-name">{groupInfo?.name}</div>
              <div className="group-members">
                {memberLen}
                {memberLen > 1 ? ' members' : ' member'}
              </div>
            </div>
          </div>
          <div className="info-operation">
            <div
              className="add-member op-member flex"
              onClick={() => navigate(`/chat-group-info/${channelUuid}/member-list/add`)}>
              <CustomSvg type="AddMem" className="flex-center" />
              Add Members
            </div>
            {isAdmin && (
              <div
                className={clsx([
                  'remove-member',
                  'op-member',
                  'flex',
                  (groupInfo?.members || []).length === 1 && 'remove-disable',
                ])}
                onClick={() => navigate(`/chat-group-info/${channelUuid}/member-list/remove`)}>
                <CustomSvg type="RemoveMem" className="flex-center" />
                <span className="remove-members-text">Remove Members</span>
              </div>
            )}
          </div>
          <div className="info-members">
            {(groupInfo?.members || []).slice(0, 4).map(
              (m) => (
                <div className="member-item flex-between" key={m.relationId} onClick={() => handleGoProfile(m)}>
                  <div className="flex member-basic">
                    <Avatar width={28} height={28} letter={m.name.slice(0, 1).toUpperCase()} />
                    <div className="member-name">{m.name}</div>
                  </div>
                  {m.isAdmin && <div className="admin-icon flex-center">Owner</div>}
                </div>
              ),
              [],
            )}
            {(groupInfo?.members || []).length > 4 && (
              <div
                className={clsx(['view-more-members', 'flex-center', isAdmin && 'is-admin'])}
                onClick={() => navigate(`/chat-group-info/${channelUuid}/member-list`)}>
                View More Members
                <CustomSvg type="LeftArrow" className="flex-center" />
              </div>
            )}
          </div>
          {isAdmin && (
            <div
              className="info-transfer flex-between"
              onClick={() => navigate(`/chat-group-info/${channelUuid}/transfer-ownership`)}>
              Transfer Group Ownership
              <CustomSvg type="LeftArrow" className="flex-center" />
            </div>
          )}
        </div>
        <div className="group-info-footer flex-center">
          {isAdmin ? (
            <Button className="edit-group-btn op-btn" onClick={() => navigate(`/chat-group-info/${channelUuid}/edit`)}>
              Edit
            </Button>
          ) : (
            <Button type="default" onClick={handleLeaveGroup} className="leave-group-btn op-btn">
              Leave Group
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
export default GroupInfo;
