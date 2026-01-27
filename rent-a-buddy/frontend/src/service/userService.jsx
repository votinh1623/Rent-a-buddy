// src/service/userService.js
import { get, post } from "@/utils/request";
import { del, put, putFormData } from "../utils/request";

export const getProfile = async () => {
  return await get(`users/profile`);
};

export const getAllUsers = async (page = 1, limit = 10, search = "", role = "") => {
  try {
    const params = new URLSearchParams({ page, limit, search });
    if (role) params.append('role', role);
    const res = await get(`users?${params.toString()}`);
    return res;
  } catch (err) {
    console.error("Error fetching users:", err);
    throw err;
  }
};
export const searchUsers = async (page = 1, limit = 10, search = "") => {
  try {
    const params = new URLSearchParams({ page, limit, search });
    const res = await get(`users/search?${params.toString()}`);
    return res;
  } catch (err) {
    console.error("Error searching users:", err);
    throw err;
  }
};