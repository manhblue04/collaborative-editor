import api from './api';

export const versionService = {
  /** Lấy danh sách version (không kèm state) */
  async list(documentId) {
    const { data } = await api.get(`/documents/${documentId}/versions`);
    return data;
  },

  /** Lưu version thủ công với nhãn tuỳ chọn */
  async save(documentId, label = '') {
    const { data } = await api.post(`/documents/${documentId}/versions`, { label });
    return data;
  },

  /** Lấy yjsState (base64) của một version cụ thể để preview */
  async getState(documentId, versionId) {
    const { data } = await api.get(`/documents/${documentId}/versions/${versionId}/state`);
    return data.state; // base64 string
  },

  /** Khôi phục document về version cũ */
  async restore(documentId, versionId) {
    const { data } = await api.post(
      `/documents/${documentId}/versions/${versionId}/restore`
    );
    return data;
  },
};
