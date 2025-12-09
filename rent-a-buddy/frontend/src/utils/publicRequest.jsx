import axiosClient from './axiosClient';

export const getPublic = async (path) => {
  return await axiosClient.get(path);
};

export const postPublic = async (path, data) => {
  return await axiosClient.post(path, data);
};

export const putPublic = async (path, data) => {
  return await axiosClient.put(path, data);
};

export const patchPublic = async (path, data) => {
  return await axiosClient.patch(path, data);
};

export const delPublic = async (path) => {
  return await axiosClient.delete(path);
};

export const postFormDataPublic = async (path, formData) => {
  return await axiosClient.post(path, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};