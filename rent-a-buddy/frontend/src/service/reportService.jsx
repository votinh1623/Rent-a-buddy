import { post, get, put, del, postFormData } from '@/utils/request';

const API_ENDPOINT = 'reports';

export const createReport = async (data) => {
  if (data instanceof FormData) {
    return postFormData(API_ENDPOINT, data);
  }

  return post(API_ENDPOINT, data);
};

export const getAllReports = async (status, targetType, page = 1, pageSize = 5) => {
  const params = new URLSearchParams();
  if (status) {
    params.append('status', status);
  }
  if (targetType) {
    params.append('targetType', targetType);
  }

  params.append('page', page);
  params.append('limit', pageSize);
  return get(`${API_ENDPOINT}/admin?${params.toString()}`);
};

export const updateReportStatus = async (reportId, status) => {
  return put(`${API_ENDPOINT}/admin/${reportId}`, { status });
};

export const adminDeleteComment = async (postId, commentId) => {
  return del(`posts/admin/${postId}/comments/${commentId}`);
};