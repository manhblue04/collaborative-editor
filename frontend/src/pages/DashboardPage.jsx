import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDocumentStore from '../store/documentStore';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { formatDate } from '../utils/helpers';
import { FiPlus, FiFileText, FiTrash2, FiEdit3 } from 'react-icons/fi';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth(true);
  const {
    documents,
    loading,
    fetchDocuments,
    createDocument,
    deleteDocument,
    updateDocument,
  } = useDocumentStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [renameId, setRenameId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const doc = await createDocument(newTitle || 'Untitled Document');
    if (doc) {
      setShowCreate(false);
      setNewTitle('');
      navigate(`/documents/${doc.id}`);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument(id);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (renameId && renameTitle.trim()) {
      await updateDocument(renameId, { title: renameTitle });
      setRenameId(null);
      setRenameTitle('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage your collaborative documents
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} size="md">
            <FiPlus className="mr-2 h-4 w-4" />
            New Document
          </Button>
        </div>

        {loading && !documents.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-gray-100"
              >
                <div className="p-5">
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16">
            <FiFileText className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">No documents yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first document to start collaborating
            </p>
            <Button onClick={() => setShowCreate(true)} className="mt-6">
              <FiPlus className="mr-2 h-4 w-4" />
              Create Document
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                className="group cursor-pointer rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-primary-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(doc.updatedAt || doc.createdAt)}
                    </p>
                  </div>
                  <FiFileText className="ml-3 h-5 w-5 shrink-0 text-gray-300 group-hover:text-primary-400 transition-colors" />
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenameId(doc.id);
                      setRenameTitle(doc.title);
                    }}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                    title="Rename"
                  >
                    <FiEdit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(doc.id, e)}
                    className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Modal
        isOpen={showCreate}
        onClose={() => {
          setShowCreate(false);
          setNewTitle('');
        }}
        title="Create New Document"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Document Title"
            placeholder="Untitled Document"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowCreate(false);
                setNewTitle('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!renameId}
        onClose={() => {
          setRenameId(null);
          setRenameTitle('');
        }}
        title="Rename Document"
      >
        <form onSubmit={handleRename} className="space-y-4">
          <Input
            label="New Title"
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setRenameId(null);
                setRenameTitle('');
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Rename</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
