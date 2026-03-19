import { create } from 'zustand';
import { documentService } from '../services/documentService';

const useDocumentStore = create((set, get) => ({
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,

  fetchDocuments: async () => {
    set({ loading: true, error: null });
    try {
      const data = await documentService.getAll();
      set({ documents: data, loading: false });
    } catch (err) {
      set({
        error: err.response?.data?.error || 'Failed to fetch documents',
        loading: false,
      });
    }
  },

  fetchDocument: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await documentService.getById(id);
      set({ currentDocument: data, loading: false });
      return data;
    } catch (err) {
      set({
        error: err.response?.data?.error || 'Failed to fetch document',
        loading: false,
      });
      return null;
    }
  },

  createDocument: async (title) => {
    set({ loading: true, error: null });
    try {
      const data = await documentService.create(title);
      set((state) => ({
        documents: [data, ...state.documents],
        loading: false,
      }));
      return data;
    } catch (err) {
      set({
        error: err.response?.data?.error || 'Failed to create document',
        loading: false,
      });
      return null;
    }
  },

  updateDocument: async (id, payload) => {
    try {
      await documentService.update(id, payload);
      set((state) => ({
        documents: state.documents.map((d) =>
          d.id === id ? { ...d, ...payload } : d
        ),
        currentDocument:
          state.currentDocument?.id === id
            ? { ...state.currentDocument, ...payload }
            : state.currentDocument,
      }));
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to update document' });
    }
  },

  deleteDocument: async (id) => {
    try {
      await documentService.remove(id);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== id),
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to delete document' });
      return false;
    }
  },

  clearCurrent: () => set({ currentDocument: null }),
  clearError: () => set({ error: null }),
}));

export default useDocumentStore;
