import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Tag, Typography, Spin, App as AntdApp } from 'antd';
import { LinkOutlined, LockOutlined } from '@ant-design/icons';
import { documentService } from '../services/documentService';

const { Title, Text } = Typography;

export default function JoinPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { message } = AntdApp.useApp();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [password, setPassword] = useState('');
  const [requirePassword, setRequirePassword] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!token) return;
    // Only check link validity, don't join yet
    setLoading(true);
    documentService
      .joinByLink(token, {})
      .then(() => {
        // Link is valid and not password-protected, show join button
        setLoading(false);
      })
      .catch((err) => {
        if (err.response?.data?.requirePassword) {
          setRequirePassword(true);
          setLoading(false);
        } else if (err.response?.status === 403) {
          // Already joined or is owner - proceed to doc
          message.info('You already have access to this document');
          navigate('/dashboard', { replace: true });
        } else {
          setInvalid(true);
          setLoading(false);
        }
      });
  }, [token]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const data = await documentService.joinByLink(token, { password });
      message.success('Joined document successfully');
      navigate(`/documents/${data.documentId}`, { replace: true });
    } catch (err) {
      message.error(err.response?.data?.error || 'Failed to join');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  if (invalid) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">
        <Card className="!shadow-xl !border-0 w-full max-w-md" styles={{ body: { padding: 28 } }}>
          <div className="text-center">
            <Title level={4} className="!mb-2 !text-red-500">Invalid Link</Title>
            <Text type="secondary">This link is invalid or has been revoked.</Text>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">
      <Card className="!shadow-xl !border-0 w-full max-w-md" styles={{ body: { padding: 28 } }}>
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
            <LinkOutlined className="text-2xl text-blue-600" />
          </div>
          <Title level={3} className="!mb-1">Join Document</Title>
          <Text type="secondary">
            {requirePassword ? 'This link is password-protected' : "You've been invited to collaborate"}
          </Text>
        </div>

        {requirePassword ? (
          <div>
            <Input.Password
              size="large"
              prefix={<LockOutlined className="!text-gray-400" />}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handleJoin}
              className="!mb-3"
            />
            <Button type="primary" block size="large" loading={joining} onClick={handleJoin}>
              Join
            </Button>
          </div>
        ) : (
          <Button type="primary" block size="large" loading={joining} onClick={handleJoin}>
            Join Document
          </Button>
        )}
      </Card>
    </div>
  );
}
