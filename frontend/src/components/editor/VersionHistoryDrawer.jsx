import { useEffect, useState, useCallback } from 'react';
import * as Y from 'yjs';
import {
  Drawer,
  Button,
  List,
  Tag,
  Tooltip,
  Input,
  Modal,
  Spin,
  Empty,
  Typography,
  App as AntdApp,
} from 'antd';
import {
  ClockCircleOutlined,
  SaveOutlined,
  RollbackOutlined,
  RobotOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { versionService } from '../../services/versionService';
import { formatDate } from '../../utils/helpers';

const { Text, Paragraph } = Typography;

/**
 * Render một bản preview read-only từ yjsState (base64)
 * bằng cách extract text thô từ Y.XmlFragment
 */
function VersionPreviewModal({ open, onClose, documentId, versionId, label }) {
  const [loading, setLoading] = useState(false);
  const [previewText, setPreviewText] = useState('');

  useEffect(() => {
    if (!open || !versionId) return;
    setLoading(true);
    versionService
      .getState(documentId, versionId)
      .then((base64) => {
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const ydoc = new Y.Doc();
        Y.applyUpdate(ydoc, bytes);
        // Lấy text thô từ XmlFragment (Tiptap dùng 'default')
        const fragment = ydoc.getXmlFragment('default');
        const text = fragment.toString();
        // Bỏ các XML tag, chỉ giữ nội dung văn bản
        const plain = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        setPreviewText(plain || '(Tài liệu trống)');
        ydoc.destroy();
      })
      .catch(() => setPreviewText('Không thể tải nội dung preview.'))
      .finally(() => setLoading(false));
  }, [open, versionId, documentId]);

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <ClockCircleOutlined className="text-blue-500" />
          Preview: {label || 'Phiên bản tự động'}
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      destroyOnClose
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <Spin tip="Đang tải nội dung..." />
        </div>
      ) : (
        <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-gray-50 p-4">
          <Paragraph className="!whitespace-pre-wrap !text-gray-700 !text-sm">
            {previewText}
          </Paragraph>
        </div>
      )}
    </Modal>
  );
}

export default function VersionHistoryDrawer({ open, onClose, documentId, canEdit, onBeforeRestore, onRestoreSuccess }) {
  const { message, modal } = AntdApp.useApp();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [restoring, setRestoring] = useState(null); // versionId đang restore
  const [preview, setPreview] = useState(null); // { versionId, label }

  const loadVersions = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    try {
      const data = await versionService.list(documentId);
      setVersions(data);
    } catch {
      message.error('Không thể tải lịch sử phiên bản.');
    } finally {
      setLoading(false);
    }
  }, [documentId, message]);

  useEffect(() => {
    if (open) loadVersions();
  }, [open, loadVersions]);

  const handleSaveVersion = async () => {
    setSaving(true);
    try {
      await versionService.save(documentId, labelInput.trim());
      message.success('Đã lưu phiên bản!');
      setLabelInput('');
      await loadVersions();
    } catch (err) {
      message.error(err.response?.data?.error || 'Lưu phiên bản thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = (version) => {
    modal.confirm({
      title: 'Khôi phục phiên bản này?',
      content: (
        <span>
          Tài liệu sẽ được khôi phục về{' '}
          <strong>{version.label || 'phiên bản tự động'}</strong>
          {' '}({formatDate(version.createdAt)}).
          <br />
          Bản hiện tại sẽ được lưu tự động trước khi ghi đè.
        </span>
      ),
      okText: 'Khôi phục',
      okType: 'danger',
      cancelText: 'Huỷ',
      onOk: async () => {
        setRestoring(version._id);
        try {
          message.loading({ content: 'Đang khôi phục...', key: 'restore', duration: 0 });

          // BƯỚC 1: Disconnect provider + destroy Y.Doc local TRƯỚC khi gọi API
          onBeforeRestore?.();

          // BƯỚC 2: Gọi API restore
          await versionService.restore(documentId, version._id);

          // BƯỚC 3: Đóng drawer và reload trang
          onClose();
          message.success({ content: 'Khôi phục thành công!', key: 'restore', duration: 1.5 });
          onRestoreSuccess?.();
        } catch (err) {
          message.error({
            content: err.response?.data?.error || 'Khôi phục thất bại.',
            key: 'restore',
          });
          setRestoring(null);
        }
      },
    });
  };

  return (
    <>
      <Drawer
        title={
          <span className="flex items-center gap-2 text-base font-semibold">
            <ClockCircleOutlined className="text-blue-500" />
            Lịch sử phiên bản
          </span>
        }
        open={open}
        onClose={onClose}
        width={360}
        styles={{ body: { padding: 0 } }}
      >
        {/* ── Lưu thủ công ── */}
        {canEdit && (
          <div className="border-b border-gray-100 p-4">
            <Text className="!text-xs !text-gray-500 !mb-2 !block">
              Lưu phiên bản hiện tại
            </Text>
            <div className="flex gap-2">
              <Input
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="Nhãn tuỳ chọn (vd: Bản nháp v1)"
                size="small"
                onPressEnter={handleSaveVersion}
                maxLength={60}
              />
              <Button
                type="primary"
                size="small"
                icon={<SaveOutlined />}
                loading={saving}
                onClick={handleSaveVersion}
              >
                Lưu
              </Button>
            </div>
          </div>
        )}

        {/* ── Danh sách version ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Spin />
            </div>
          ) : versions.length === 0 ? (
            <Empty
              className="!py-12"
              description={
                <Text type="secondary" className="!text-sm">
                  Chưa có phiên bản nào được lưu
                </Text>
              }
            />
          ) : (
            <List
              dataSource={versions}
              renderItem={(v) => (
                <List.Item
                  className="!px-4 !py-3 hover:!bg-gray-50 transition-colors"
                  actions={[
                    <Tooltip key="preview" title="Xem nội dung">
                      <Button
                        type="text"
                        size="small"
                        icon={<ClockCircleOutlined />}
                        onClick={() => setPreview({ versionId: v._id, label: v.label })}
                      />
                    </Tooltip>,
                    canEdit && (
                      <Tooltip key="restore" title="Khôi phục">
                        <Button
                          type="text"
                          size="small"
                          danger
                          icon={<RollbackOutlined />}
                          loading={restoring === v._id}
                          onClick={() => handleRestore(v)}
                        />
                      </Tooltip>
                    ),
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                        {v.isAuto ? (
                          <RobotOutlined className="text-sm" />
                        ) : (
                          <UserOutlined className="text-sm" />
                        )}
                      </div>
                    }
                    title={
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Text className="!text-sm !font-medium !text-gray-800">
                          {v.label || (
                            <span className="italic text-gray-400">
                              {v.isAuto ? 'Tự động lưu' : 'Không có nhãn'}
                            </span>
                          )}
                        </Text>
                        {v.isAuto && (
                          <Tag className="!text-[10px] !py-0 !leading-4" color="default">
                            Auto
                          </Tag>
                        )}
                      </div>
                    }
                    description={
                      <div className="flex flex-col gap-0.5">
                        <Text className="!text-xs !text-gray-400">
                          {formatDate(v.createdAt)}
                        </Text>
                        {v.createdBy && (
                          <Text className="!text-xs !text-gray-400">
                            bởi {v.createdBy.name}
                          </Text>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </div>
      </Drawer>

      {/* Preview modal */}
      {preview && (
        <VersionPreviewModal
          open={!!preview}
          onClose={() => setPreview(null)}
          documentId={documentId}
          versionId={preview.versionId}
          label={preview.label}
        />
      )}
    </>
  );
}
