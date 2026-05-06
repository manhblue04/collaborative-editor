import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Modal,
  Form,
  Input,
  Empty,
  Skeleton,
  Tag,
  Dropdown,
  Typography,
  App as AntdApp,
} from 'antd';
import {
  PlusOutlined,
  FileTextOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CrownFilled,
} from '@ant-design/icons';
import useDocumentStore from '../store/documentStore';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import { formatDate } from '../utils/helpers';

const { Title, Text, Paragraph } = Typography;

export default function DashboardPage() {
  const navigate = useNavigate();
  useAuth(true);
  const { modal, message } = AntdApp.useApp();
  const {
    documents,
    loading,
    fetchDocuments,
    createDocument,
    deleteDocument,
    updateDocument,
  } = useDocumentStore();

  const [createOpen, setCreateOpen] = useState(false);
  const [renameDoc, setRenameDoc] = useState(null);
  const [createForm] = Form.useForm();
  const [renameForm] = Form.useForm();

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreate = async ({ title }) => {
    const doc = await createDocument(title || 'Untitled Document');
    if (doc) {
      setCreateOpen(false);
      createForm.resetFields();
      navigate(`/documents/${doc.id}`);
    }
  };

  const handleRename = async ({ title }) => {
    if (!renameDoc) return;
    await updateDocument(renameDoc.id, { title });
    setRenameDoc(null);
    renameForm.resetFields();
    message.success('Document renamed');
  };

  const handleDelete = (doc) => {
    modal.confirm({
      title: 'Delete document?',
      content: `"${doc.title}" will be permanently deleted.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        const ok = await deleteDocument(doc.id);
        if (ok) message.success('Document deleted');
      },
    });
  };

  const roleColor = {
    owner: 'gold',
    editor: 'blue',
    viewer: 'default',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Title level={2} className="!mb-1">
              My Documents
            </Title>
            <Text type="secondary">
              Create and manage your collaborative documents
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            New Document
          </Button>
        </div>

        {loading && !documents.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16">
            <Empty
              image={<FileTextOutlined style={{ fontSize: 64, color: '#d1d5db' }} />}
              styles={{ image: { height: 80 } }}
              description={
                <div className="text-gray-500">
                  <div className="text-lg font-medium text-gray-900 mb-1">
                    No documents yet
                  </div>
                  <div className="text-sm">
                    Create your first document to start collaborating
                  </div>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateOpen(true)}
              >
                Create Document
              </Button>
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => {
              const menuItems = [
                doc.role === 'owner' && {
                  key: 'rename',
                  icon: <EditOutlined />,
                  label: 'Rename',
                  onClick: ({ domEvent }) => {
                    domEvent.stopPropagation();
                    setRenameDoc(doc);
                    renameForm.setFieldsValue({ title: doc.title });
                  },
                },
                doc.role === 'owner' && {
                  key: 'delete',
                  icon: <DeleteOutlined />,
                  label: 'Delete',
                  danger: true,
                  onClick: ({ domEvent }) => {
                    domEvent.stopPropagation();
                    handleDelete(doc);
                  },
                },
              ].filter(Boolean);

              return (
                <Card
                  key={doc.id}
                  hoverable
                  onClick={() => navigate(`/documents/${doc.id}`)}
                  className="!transition-all"
                  styles={{ body: { padding: 18 } }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <FileTextOutlined style={{ fontSize: 18 }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Paragraph
                          className="!mb-1 !font-semibold !text-gray-900"
                          ellipsis
                        >
                          {doc.title}
                        </Paragraph>
                        <Text type="secondary" className="!text-xs">
                          {formatDate(doc.updatedAt || doc.createdAt)}
                        </Text>
                      </div>
                    </div>

                    {menuItems.length > 0 && (
                      <Dropdown
                        menu={{ items: menuItems }}
                        trigger={['click']}
                        placement="bottomRight"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<MoreOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Tag
                      color={roleColor[doc.role]}
                      icon={doc.role === 'owner' ? <CrownFilled /> : null}
                      className="!m-0"
                    >
                      {doc.role}
                    </Tag>
                    {doc.collaborators?.length > 0 && (
                      <Text type="secondary" className="!text-xs">
                        {doc.collaborators.length} collaborator
                        {doc.collaborators.length > 1 ? 's' : ''}
                      </Text>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <Modal
        title="Create New Document"
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          createForm.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreate}
          requiredMark={false}
          className="!mt-4"
        >
          <Form.Item label="Document Title" name="title">
            <Input placeholder="Untitled Document" autoFocus size="large" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create
            </Button>
          </div>
        </Form>
      </Modal>

      <Modal
        title="Rename Document"
        open={!!renameDoc}
        onCancel={() => {
          setRenameDoc(null);
          renameForm.resetFields();
        }}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={renameForm}
          layout="vertical"
          onFinish={handleRename}
          requiredMark={false}
          className="!mt-4"
        >
          <Form.Item
            label="New Title"
            name="title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input autoFocus size="large" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setRenameDoc(null)}>Cancel</Button>
            <Button type="primary" htmlType="submit">
              Rename
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
