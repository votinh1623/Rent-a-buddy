import axiosClient from './axiosClient';

export const get = async (path) => {
  return await axiosClient.get(path);
};

export const post = async (path, data) => {
  return await axiosClient.post(path, data);
};

export const put = async (path, data) => {
  return await axiosClient.put(path, data);
};

export const patch = async (path, data) => {
  return await axiosClient.patch(path, data);
};

export const del = async (path) => {
  return await axiosClient.delete(path);
};

export const postFormData = async (path, formData) => {
  return await axiosClient.post(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const putFormData = async (path, formData) => {
  return await axiosClient.put(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const patchFormData = async (path, formData) => {
  return await axiosClient.patch(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};