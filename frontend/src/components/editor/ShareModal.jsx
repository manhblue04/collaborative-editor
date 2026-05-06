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
  App as AntdApp,
} from 'antd';
import { UserOutlined, CrownFilled, DeleteOutlined } from '@ant-design/icons';
import { documentService } from '../../services/documentService';
import { getInitials } from '../../utils/helpers';

const roleColor = { owner: 'gold', editor: 'blue', viewer: 'default' };

export default function ShareModal({ open, onClose, documentId, currentUserId, isOwner }) {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
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

  useEffect(() => {
    if (open) loadPermissions();
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

  return (
    <Modal
      title="Share Document"
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnHidden
    >
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
