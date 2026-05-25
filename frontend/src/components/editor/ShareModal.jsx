import { useEffect, useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  List,
  Avatar,
  Tag,
  Spin,
  Empty,
  Divider,
  App as AntdApp,
  Typography,
} from 'antd';
import { UserOutlined, CrownFilled, DeleteOutlined, LinkOutlined, CopyOutlined } from '@ant-design/icons';
import { documentService } from '../../services/documentService';
import { getInitials } from '../../utils/helpers';

const { Text } = Typography;
const roleColor = { owner: 'gold', editor: 'blue', viewer: 'default' };

export default function ShareModal({ open, onClose, documentId, currentUserId, isOwner }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [form] = Form.useForm();
  const [linkForm] = Form.useForm();
  const { message } = AntdApp.useApp();

  const loadPermissions = async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const data = await documentService.getPermissions(documentId);
      setPermissions(data);
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadShareLink = async () => {
    if (!documentId || !isOwner) return;
    try {
      const data = await documentService.getShareLink(documentId);
      setShareLink(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (open) {
      loadPermissions();
      loadShareLink();
    }
  }, [open, documentId]);

  const handleShare = async (values) => {
    setSubmitting(true);
    try {
      await documentService.share(documentId, {
        email: values.email,
        role: values.role,
      });
      message.success(`Shared with ${values.email}`);
      form.resetFields();
      await loadPermissions();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to share');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (userId) => {
    try {
      await documentService.revokePermission(documentId, userId);
      message.success('Permission revoked');
      await loadPermissions();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to revoke');
    }
  };

  const handleGenerateLink = async (values) => {
    setLinkLoading(true);
    try {
      const data = await documentService.generateShareLink(documentId, values);
      setShareLink(data);
      message.success('Share link created');
      linkForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to create link');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleRevokeLink = async () => {
    setLinkLoading(true);
    try {
      await documentService.revokeShareLink(documentId);
      setShareLink(null);
      message.success('Share link revoked');
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to revoke link');
    } finally {
      setLinkLoading(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/join/${shareLink.token}`;
    navigator.clipboard.writeText(url).then(() => {
      message.success('Link copied to clipboard');
    });
  };

  return (
    <Modal
      title="Share Document"
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnHidden
    >
      {/* ── Share Link Section ── */}
      {isOwner && (
        <>
          <div className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
            <LinkOutlined /> Share Link
          </div>

          {shareLink ? (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Text className="!text-xs !text-blue-700">
                  Anyone with the link can join as <Tag color={roleColor[shareLink.role]} className="!text-xs">{shareLink.role}</Tag>
                  {shareLink.hasPassword && <Tag color="orange" className="!text-xs">Password protected</Tag>}
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  size="small"
                  value={`${window.location.origin}/join/${shareLink.token}`}
                  readOnly
                  className="!flex-1"
                />
                <Button size="small" icon={<CopyOutlined />} onClick={copyLink}>
                  Copy
                </Button>
                <Button size="small" danger onClick={handleRevokeLink} loading={linkLoading}>
                  Revoke
                </Button>
              </div>
            </div>
          ) : (
            <Form
              form={linkForm}
              layout="inline"
              onFinish={handleGenerateLink}
              initialValues={{ role: 'editor' }}
              className="!mb-3 !flex !flex-nowrap !gap-2"
            >
              <Form.Item name="role" className="!mr-0">
                <Select
                  size="small"
                  options={[
                    { value: 'editor', label: 'Editor' },
                    { value: 'viewer', label: 'Viewer' },
                  ]}
                  style={{ width: 110 }}
                />
              </Form.Item>
              <Form.Item name="password" className="!flex-1 !mr-0">
                <Input size="small" placeholder="Password (optional)" />
              </Form.Item>
              <Form.Item className="!mr-0">
                <Button size="small" type="primary" htmlType="submit" loading={linkLoading}>
                  Create Link
                </Button>
              </Form.Item>
            </Form>
          )}

          <Divider className="!my-3" />
        </>
      )}

      {/* ── Email Share Section ── */}
      {isOwner && (
        <Form
          form={form}
          layout="inline"
          onFinish={handleShare}
          initialValues={{ role: 'editor' }}
          className="!mb-4 !flex !flex-nowrap !gap-2"
        >
          <Form.Item
            name="email"
            className="!flex-1 !mr-0"
            rules={[
              { required: true, message: 'Required' },
              { type: 'email', message: 'Invalid email' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>
          <Form.Item name="role" className="!mr-0">
            <Select
              options={[
                { value: 'editor', label: 'Editor' },
                { value: 'viewer', label: 'Viewer' },
              ]}
              style={{ width: 110 }}
            />
          </Form.Item>
          <Form.Item className="!mr-0">
            <Button type="primary" htmlType="submit" loading={submitting}>
              Share
            </Button>
          </Form.Item>
        </Form>
      )}

      <div className="text-sm font-medium text-gray-700 mb-2">People with access</div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Spin />
        </div>
      ) : permissions.length === 0 ? (
        <Empty description="No collaborators" />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={permissions}
          renderItem={(p) => (
            <List.Item
              actions={[
                <Tag
                  key="role"
                  color={roleColor[p.role]}
                  icon={p.role === 'owner' ? <CrownFilled /> : null}
                >
                  {p.role}
                </Tag>,
                isOwner && p.role !== 'owner' && (
                  <Button
                    key="revoke"
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => handleRevoke(p.userId)}
                  />
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar icon={<UserOutlined />} className="!bg-blue-500">
                    {getInitials(p.name)}
                  </Avatar>
                }
                title={
                  <span>
                    {p.name}
                    {p.userId === currentUserId && (
                      <Tag className="!ml-2 !text-xs">You</Tag>
                    )}
                  </span>
                }
                description={p.email}
              />
            </List.Item>
          )}
        />
      )}
    </Modal>
  );
}
