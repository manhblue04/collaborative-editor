import { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services/userService';
import { documentService } from '../../services/documentService';
import { useToast } from '../common/Toast';
import { getInitials } from '../../utils/helpers';
import { debounce } from '../../utils/debounce';
import { FiSearch, FiX, FiUserPlus, FiTrash2, FiChevronDown } from 'react-icons/fi';

function RoleBadge({ role }) {
  const colors = {
    owner: 'bg-purple-100 text-purple-700 border-purple-200',
    editor: 'bg-blue-100 text-blue-700 border-blue-200',
    viewer: 'bg-gray-100 text-gray-600 border-gray-200',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
        colors[role] || colors.viewer
      }`}
    >
      {role}
    </span>
  );
}

function RoleSelect({ value, onChange, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="appearance-none rounded-lg border border-gray-200 bg-white py-1.5 pl-3 pr-8 text-xs font-medium text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 cursor-pointer"
      >
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </select>
      <FiChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
    </div>
  );
}

export default function SharePanel({ documentId, isOwner, onClose }) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [shareRole, setShareRole] = useState('editor');

  // Load existing permissions
  const loadPermissions = useCallback(async () => {
    try {
      setLoadingPerms(true);
      const data = await documentService.getPermissions(documentId);
      setPermissions(data);
    } catch (err) {
      toast.error('Failed to load permissions');
    } finally {
      setLoadingPerms(false);
    }
  }, [documentId, toast]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Search users by email (debounced)
  const doSearch = useCallback(
    debounce(async (query) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      try {
        setSearching(true);
        const results = await userService.searchByEmail(query);
        // Filter out users who already have permissions
        const existingUserIds = permissions.map((p) => p.userId);
        const filtered = results.filter((u) => !existingUserIds.includes(u.id));
        setSearchResults(filtered);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400),
    [permissions]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    doSearch(value);
  };

  const handleShare = async (userId, userName) => {
    try {
      await documentService.share(documentId, userId, shareRole);
      toast.success(`Shared with ${userName} as ${shareRole}`);
      setSearchQuery('');
      setSearchResults([]);
      loadPermissions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to share document');
    }
  };

  const handleRevoke = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName}'s access?`)) return;
    try {
      await documentService.revokeShare(documentId, userId);
      toast.success(`Removed ${userName}'s access`);
      loadPermissions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to revoke access');
    }
  };

  const handleUpdateRole = async (userId, userName, newRole) => {
    try {
      await documentService.share(documentId, userId, newRole);
      toast.success(`Updated ${userName}'s role to ${newRole}`);
      loadPermissions();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Share Document</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <FiX size={16} />
        </button>
      </div>

      {/* Search & Add */}
      {isOwner && (
        <div className="border-b border-gray-100 p-4">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by email..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>

          {/* Search Results */}
          {(searchResults.length > 0 || searching) && (
            <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-gray-100 bg-white">
              {searching ? (
                <div className="flex items-center justify-center py-4 text-sm text-gray-400">
                  Searching...
                </div>
              ) : (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors animate-fade-in"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-[10px] font-semibold text-white">
                        {getInitials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                      <RoleSelect value={shareRole} onChange={setShareRole} />
                      <button
                        onClick={() => handleShare(user.id, user.name)}
                        className="rounded-lg p-1.5 text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Share"
                      >
                        <FiUserPlus size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
              {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="py-4 text-center text-sm text-gray-400">
                  No users found
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Current Permissions */}
      <div className="flex-1 overflow-y-auto p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
          People with access ({permissions.length})
        </h4>

        {loadingPerms ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-3 w-24 rounded bg-gray-200" />
                  <div className="mt-1 h-2 w-32 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {permissions.map((perm) => (
              <div
                key={perm.userId}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{
                      background:
                        perm.role === 'owner'
                          ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                          : perm.role === 'editor'
                          ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                          : 'linear-gradient(135deg, #6b7280, #4b5563)',
                    }}
                  >
                    {getInitials(perm.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {perm.name}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{perm.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2 shrink-0">
                  {perm.role === 'owner' ? (
                    <RoleBadge role="owner" />
                  ) : isOwner ? (
                    <>
                      <RoleSelect
                        value={perm.role}
                        onChange={(newRole) =>
                          handleUpdateRole(perm.userId, perm.name, newRole)
                        }
                      />
                      <button
                        onClick={() => handleRevoke(perm.userId, perm.name)}
                        className="rounded-md p-1.5 text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                        title="Remove access"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <RoleBadge role={perm.role} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
