import axios from "axios";
import EncryptedStorage from 'react-native-encrypted-storage';


const BASE_URL = "http://192.168.29.121:8000/";
const FIREBASE_API_KEY = "AIzaSyD8gecJk3z5GYZGdjyEmDL5fnpN_hYuPdg"; // Replace with your key

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
});

// Save auth tokens securely
const saveAuthTokens = async ({ idToken, refreshToken, expiresIn }) => {
  const expiryTime = (Date.now() + parseInt(expiresIn) * 1000).toString();

  await EncryptedStorage.setItem("authTokens", JSON.stringify({
    idToken,
    refreshToken,
    expiryTime,
  }));
};

// Create new user
export const createUser = async (email, password, account_type) => {
  const response = await api.post("/create-user", { email, password, account_type });
  await saveAuthTokens(response.data.user);
  return response.data;
};

// Login user
export const loginUser = async (email, password,account_type) => {
  const response = await api.post("/login", { email, password, account_type });
  await saveAuthTokens(response.data);
  return response.data;
};

// Refresh Firebase token
const refreshFirebaseToken = async () => {
  const tokens = await EncryptedStorage.getItem("authTokens");
  if (!tokens) return false;

  const { refreshToken } = JSON.parse(tokens);

  try {
    const res = await axios.post(
      `https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`,
      {
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }
    );

    await saveAuthTokens({
      idToken: res.data.id_token,
      refreshToken: res.data.refresh_token,
      expiresIn: res.data.expires_in,
    });

    return true;
  } catch (err) {
    if (
      err.response?.data?.error?.message === 'INVALID_REFRESH_TOKEN' ||
      err.response?.data?.error?.message === 'TOKEN_EXPIRED'
    ) {
      await logout();
      alert('Session expired. Please log in again.');
    }
    return false;
  }
};

export const logout = async () => {
  await EncryptedStorage.removeItem("authTokens");
};

export const checkLoginStatus = async () => {
  const tokens = await EncryptedStorage.getItem("authTokens");
  if (!tokens) return false;

  const { idToken, expiryTime } = JSON.parse(tokens);
  if (!idToken || !expiryTime) return false;

  const isValid = Date.now() < parseInt(expiryTime);
  return isValid || await refreshFirebaseToken();
};

// Save user profile
export const saveUserDetails = async (profileData) => {
  const tokens = await EncryptedStorage.getItem("authTokens");
  if (!tokens) throw new Error("Missing token. Please log in.");

  const { idToken } = JSON.parse(tokens);

  // Remove undefined/null fields
  const cleanedProfileData = Object.fromEntries(
    Object.entries(profileData).filter(([_, value]) => value != null)
  );

  const response = await api.post("/user-details", {
    idToken,
    ...cleanedProfileData
  });

  return response.data;
};
