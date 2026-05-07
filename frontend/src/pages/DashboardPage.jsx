import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useDocumentStore from '../store/documentStore';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import { useToast } from '../components/common/Toast';
import { formatDate } from '../utils/helpers';
import {
  FiPlus,
  FiFileText,
  FiTrash2,
  FiEdit3,
  FiUsers,
  FiEye,
  FiShield,
  FiSearch,
} from 'react-icons/fi';

function DocRoleBadge({ role }) {
  const config = {
    owner: {
      icon: FiShield,
      label: 'Owner',
      className: 'bg-purple-100 text-purple-700',
    },
    editor: {
      icon: FiEdit3,
      label: 'Editor',
      className: 'bg-blue-100 text-blue-700',
    },
    viewer: {
      icon: FiEye,
      label: 'Viewer',
      className: 'bg-gray-100 text-gray-600',
    },
  };

  const c = config[role] || config.viewer;
  const Icon = c.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.className}`}
    >
      <Icon size={10} />
      {c.label}
    </span>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth(true);
  const toast = useToast();
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
  const [filter, setFilter] = useState('all'); // all | owned | shared
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const doc = await createDocument(newTitle || 'Untitled Document');
    if (doc) {
      setShowCreate(false);
      setNewTitle('');
      toast.success('Document created');
      navigate(`/documents/${doc.id}`);
    }
  };

  const handleDelete = async (id, title, e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${title}"?`)) {
      const success = await deleteDocument(id);
      if (success) toast.success('Document deleted');
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (renameId && renameTitle.trim()) {
      await updateDocument(renameId, { title: renameTitle });
      toast.success('Document renamed');
      setRenameId(null);
      setRenameTitle('');
    }
  };

  // Filter & search
  const filteredDocs = documents.filter((doc) => {
    if (filter === 'owned' && doc.role !== 'owner') return false;
    if (filter === 'shared' && doc.role === 'owner') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        doc.title?.toLowerCase().includes(q) ||
        doc.ownerName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const ownedCount = documents.filter((d) => d.role === 'owner').length;
  const sharedCount = documents.filter((d) => d.role !== 'owner').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
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

          {/* Filter & Search Bar */}
          {documents.length > 0 && (
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
                {[
                  { key: 'all', label: `All (${documents.length})` },
                  { key: 'owned', label: `Owned (${ownedCount})` },
                  { key: 'shared', label: `Shared (${sharedCount})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      filter === tab.key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        {loading && !documents.length ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-gray-100"
              >
                <div className="p-5">
                  <div className="h-4 w-2/3 rounded bg-gray-200" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-gray-100" />
                  <div className="mt-6 h-3 w-1/2 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white py-20">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 mb-4">
              <FiFileText className="h-8 w-8 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No documents yet</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-xs text-center">
              Create your first document to start collaborating with your team
            </p>
            <Button onClick={() => setShowCreate(true)} className="mt-6">
              <FiPlus className="mr-2 h-4 w-4" />
              Create Document
            </Button>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16">
            <FiSearch className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500">No documents match your search</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                className="group cursor-pointer rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all duration-200 hover:shadow-md hover:ring-primary-200 hover:-translate-y-0.5 animate-fade-in"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <DocRoleBadge role={doc.role} />
                    </div>
                    <h3 className="truncate text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(doc.updatedAt || doc.createdAt)}
                    </p>
                  </div>
                  <FiFileText className="ml-3 h-5 w-5 shrink-0 text-gray-300 group-hover:text-primary-400 transition-colors" />
                </div>

                {/* Owner info */}
                {doc.role !== 'owner' && doc.ownerName && (
                  <p className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <FiUsers size={11} />
                    <span>by {doc.ownerName}</span>
                  </p>
                )}

                {/* Actions */}
                {(doc.role === 'owner' || doc.role === 'editor') && (
                  <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    {doc.role === 'owner' && (
                      <button
                        onClick={(e) => handleDelete(doc.id, doc.title, e)}
                        className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
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

      {/* Rename Modal */}
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
