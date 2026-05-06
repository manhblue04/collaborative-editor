import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Tabs, Alert, Typography } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import useAuthStore from '../store/authStore';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, register, loading, error, clearError } = useAuthStore();
  const [tab, setTab] = useState('login');

  const handleLogin = async (values) => {
    const ok = await login(values.email, values.password);
    if (ok) navigate('/dashboard');
  };

  const handleRegister = async (values) => {
    const ok = await register(values.name, values.email, values.password);
    if (ok) {
      const ok2 = await login(values.email, values.password);
      if (ok2) navigate('/dashboard');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-2xl shadow-lg shadow-blue-200">
            CE
          </div>
          <Title level={2} className="!mb-1">
            CollabEdit
          </Title>
          <Text type="secondary">Collaborative document editing in real-time</Text>
        </div>

        <Card className="!shadow-xl !border-0" styles={{ body: { padding: 28 } }}>
          <Tabs
            activeKey={tab}
            onChange={(k) => {
              setTab(k);
              clearError();
            }}
            centered
            items={[
              {
                key: 'login',
                label: 'Sign In',
                children: (
                  <>
                    {error && tab === 'login' && (
                      <Alert
                        message={error}
                        type="error"
                        showIcon
                        closable
                        onClose={clearError}
                        className="!mb-4"
                      />
                    )}
                    <Form
                      layout="vertical"
                      onFinish={handleLogin}
                      requiredMark={false}
                      autoComplete="off"
                    >
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: 'Email is required' },
                          { type: 'email', message: 'Invalid email' },
                        ]}
                      >
                        <Input
                          size="large"
                          prefix={<MailOutlined className="!text-gray-400" />}
                          placeholder="you@example.com"
                        />
                      </Form.Item>
                      <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: 'Password is required' }]}
                      >
                        <Input.Password
                          size="large"
                          prefix={<LockOutlined className="!text-gray-400" />}
                          placeholder="Enter password"
                        />
                      </Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        size="large"
                        loading={loading}
                      >
                        Sign In
                      </Button>
                    </Form>
                  </>
                ),
              },
              {
                key: 'register',
                label: 'Register',
                children: (
                  <>
                    {error && tab === 'register' && (
                      <Alert
                        message={error}
                        type="error"
                        showIcon
                        closable
                        onClose={clearError}
                        className="!mb-4"
                      />
                    )}
                    <Form
                      layout="vertical"
                      onFinish={handleRegister}
                      requiredMark={false}
                      autoComplete="off"
                    >
                      <Form.Item
                        label="Full Name"
                        name="name"
                        rules={[
                          { required: true, message: 'Name is required' },
                          { min: 2, message: 'At least 2 characters' },
                        ]}
                      >
                        <Input
                          size="large"
                          prefix={<UserOutlined className="!text-gray-400" />}
                          placeholder="John Doe"
                        />
                      </Form.Item>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: 'Email is required' },
                          { type: 'email', message: 'Invalid email' },
                        ]}
                      >
                        <Input
                          size="large"
                          prefix={<MailOutlined className="!text-gray-400" />}
                          placeholder="you@example.com"
                        />
                      </Form.Item>
                      <Form.Item
                        label="Password"
                        name="password"
                        rules={[
                          { required: true, message: 'Password is required' },
                          { min: 6, message: 'At least 6 characters' },
                        ]}
                      >
                        <Input.Password
                          size="large"
                          prefix={<LockOutlined className="!text-gray-400" />}
                          placeholder="At least 6 characters"
                        />
                      </Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        block
                        size="large"
                        loading={loading}
                      >
                        Create Account
                      </Button>
                    </Form>
                  </>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
