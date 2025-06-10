import axios from "axios";
import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from "@react-native-async-storage/async-storage";


const BASE_URL = "http://lumia-env.eba-smvczc8e.us-east-1.elasticbeanstalk.com";
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

export const fetchAndStoreUserDetails = async () => {
  try {
    // Retrieve the stored token (assumes you already saved it somewhere like on login)
  const tokens = await EncryptedStorage.getItem("authTokens");
  if (!tokens) throw new Error("Missing token. Please log in.");

        const parsedTokens = JSON.parse(tokens);
        idToken = parsedTokens.idToken;

  const response = await api.post("/user-detail", {
    idToken
  });

    if (response.data.status === 'success') {
      const userDetails = response.data.data;

      // Save each field to AsyncStorage (or save as a single object)
      await AsyncStorage.setItem('userDetails', JSON.stringify(userDetails));

      console.log('User details saved:', userDetails);
      return userDetails;
    } else {
      throw new Error('Failed to fetch user details');
    }
  } catch (error) {
    console.error('Error fetching user details:', error.message);
    throw error;
  }
};

export const saveReminder = async (medicine) => {
  try {
    const tokens = await getAuthTokens();
    const idToken = tokens?.idToken;

    if (!idToken) {
      Alert.alert("Authentication Error", "Could not retrieve user session. Please log in again.");
      throw new Error("ID token not available.");
    }
    

const payload = {
      idToken,
      reminder_id: medicine.id,
      medicine_name: medicine.name,
      pill_details: medicine.dosage,
      time: medicine.time.toISOString(),
      end_date: medicine.duration.toISOString(),
      amount_per_box: medicine.amountPerBox.toString(),
      current_quantity: medicine.currentQuantity.toString(),
      take_medicine_alert: medicine.enableTakeAlert.toString(),
      ring_phone: medicine.ringPhone.toString(),
      send_message: medicine.sendMessage.toString(),
      refill_reminder: medicine.refillReminder.toString(),
      set_day_before_refill: medicine.refillDays.toString(),
      set_refill_date: medicine.refillDate.toISOString(),
      start_from_today: medicine.startFromToday.toString(),
    };

    const response = await api.post("/set-medicine-reminder", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    
if (!response.status == 200) {
  Alert.alert("Server Error", "Unexpected response status: " + response.status);
  throw new Error("Unexpected server response");
}
    return response.data;
  } catch (error) {
    const errorData = error.response?.data || { message: error.message };
    Alert.alert("API call error (saveReminder):", error);
  }
};