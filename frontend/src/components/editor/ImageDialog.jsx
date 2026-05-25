import { useState, useRef } from 'react';
import { Modal, Input, Tabs, message } from 'antd';

export default function ImageDialog({ open, onClose, editor }) {
  const [url, setUrl] = useState('');
  const [tab, setTab] = useState('upload');
  const fileRef = useRef(null);

  const insertImage = (src) => {
    if (!src) return;
    editor.chain().focus().setImage({ src }).run();
    setUrl('');
    onClose();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      message.error('Please select an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => insertImage(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <Modal
      title="Insert Image"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          {
            key: 'upload',
            label: 'Upload',
            children: (
              <div className="py-4">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFile}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            ),
          },
          {
            key: 'url',
            label: 'URL',
            children: (
              <div className="py-4 flex gap-2">
                <Input
                  placeholder="https://example.com/image.png"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onPressEnter={() => insertImage(url)}
                />
                <button
                  type="button"
                  className="px-4 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 shrink-0"
                  onClick={() => insertImage(url)}
                >
                  Insert
                </button>
              </div>
            ),
          },
        ]}
      />
    </Modal>
  );
}
