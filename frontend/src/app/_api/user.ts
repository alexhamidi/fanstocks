import axios, { AxiosResponse } from "axios";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
import { Credentials } from "../_models/types";
// Define a function to handle the response

export const getCurrentUser = async () => {
  const response = await axios.get(`${BACKEND_URL}/api/me`, {
    withCredentials: true,
  });
  return response.data;
};

export const loginUser = async (credentials: Credentials) => {
  const response = await axios.post(`${BACKEND_URL}/api/login`, credentials, {
    headers: { "Content-Type": "application/json" },
    withCredentials: true,
  });
  return response.data;
};

export const registerUser = async (credentials: Credentials) => {
  const response = await axios.post(
    `${BACKEND_URL}/api/register`,
    credentials,
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: true,
    },
  );
  return response.data;
};

export const logoutUser = async () => {
  const response = await axios.post(
    `${BACKEND_URL}/api/logout`,
    {},
    { withCredentials: true },
  );
  return response.data;
};
