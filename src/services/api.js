import axios from "axios";
import EncryptedStorage from 'react-native-encrypted-storage';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from 'react-native';

const BASE_URL = "http://lumia-env.eba-smvczc8e.us-east-1.elasticbeanstalk.com";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 5000, // 5 seconds timeout
});

// Helper to save auth tokens securely
const saveAuthTokens = async ({ idToken, refreshToken, expiresIn }) => {
  const expiryTime = (Date.now() + parseInt(expiresIn) * 1000).toString();

  try {
    await EncryptedStorage.setItem("authTokens", JSON.stringify({
      idToken,
      refreshToken,
      expiryTime,
    }));
    console.log("Auth tokens saved securely.");
  } catch (error) {
    console.error("Failed to save auth tokens:", error);
  }
};

// Helper to get auth tokens
const getAuthTokens = async () => {
  try {
    const tokens = await EncryptedStorage.getItem("authTokens");
    return tokens ? JSON.parse(tokens) : null;
  } catch (error) {
    console.error("Failed to retrieve auth tokens:", error);
    return null;
  }
};

// Helper to remove auth tokens
const removeAuthTokens = async () => {
  try {
    await EncryptedStorage.removeItem("authTokens");
    console.log("Auth tokens removed.");
  } catch (error) {
    console.error("Failed to remove auth tokens:", error);
  }
};

/**
 * Helper to extract user-friendly error messages from Axios error objects.
 * This version is more aggressive in looking for the error message in various places.
 * @param {object} err - The Axios error object.
 * @returns {string} A user-friendly error message.
 */
const extractApiErrorMessage = (err) => {
  // Always log the full error object for debugging. This is the most crucial step!
  console.error("Original API Error Object for Debugging:", JSON.stringify(err, null, 2));

  // Default message in case nothing specific is found
  let userFriendlyMessage = 'An unexpected error occurred. Please try again.';

  // 1. Handle network errors first (no response from server)
  if (axios.isAxiosError(err) && !err.response) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // 2. Check for various common locations of error messages in the response data
  const responseData = err?.response?.data;

  // Prioritize explicit error fields
  if (responseData) {
    // Check for common Firebase-like error objects (backend proxying Firebase)
    if (responseData.error && typeof responseData.error.message === 'string') {
      const firebaseError = responseData.error.message;
      switch (firebaseError) {
        case 'INVALID_EMAIL': return 'The email address is not valid.';
        case 'EMAIL_EXISTS': return 'This email address is already in use by another account.';
        case 'OPERATION_NOT_ALLOWED': return 'Email/password authentication is not enabled. Please contact support.';
        case 'WEAK_PASSWORD': return 'The password is too weak. Please choose a stronger password.';
        case 'EMAIL_NOT_FOUND': return 'No user found with this email. Please check your email or register.';
        case 'INVALID_PASSWORD': return 'Invalid password. Please try again.';
        case 'USER_DISABLED': return 'This user account has been disabled.';
        case 'TOO_MANY_ATTEMPTS_TRY_LATER': return 'Too many login attempts. Please try again later.';
        case 'INVALID_REFRESH_TOKEN':
        case 'CREDENTIAL_TOO_OLD_LOGIN_AGAIN': return 'Your session has expired. Please log in again.';
        default:
          // Try to clean up Firebase specific codes (e.g., "auth/email-already-in-use")
          if (firebaseError.includes('/')) {
            return firebaseError.split('/')[1]?.replace(/-/g, ' ') || 'An authentication error occurred.';
          }
          return firebaseError.replace(/_/g, ' ') || 'An unknown Firebase error occurred.';
      }
    }

    // Check for general backend error fields
    if (typeof responseData.detail === 'string') {
      return responseData.detail;
    }
    if (Array.isArray(responseData.detail)) {
        return responseData.detail.join('\n');
    }
    if (typeof responseData.message === 'string') {
      return responseData.message;
    }
    // If the error message is directly the string in the data object itself (less common but possible)
    if (typeof responseData === 'string' && responseData.includes('INVALID_EMAIL')) {
        return responseData; // e.g., if response.data is just "INVALID_EMAIL"
    }
  }

  // 3. Fallback to Axios error.message, attempting to parse it
  if (err.message) {
    // This is where "404:INVALID_EMAIL" likely lives. Let's make this more robust.
    const message = err.message;

    // Regex to capture "HTTP_CODE: MESSAGE" or just "MESSAGE"
    const parsedMessage = message.match(/^(?:(\d{3}):\s*)?(.*)$/);
    let extractedErrorText = message; // Default to full message if no match

    if (parsedMessage && parsedMessage[2]) {
        extractedErrorText = parsedMessage[2]; // Take the part after the colon and status code
    } else if (parsedMessage && parsedMessage[1] && !parsedMessage[2]) {
        // Handle case where it's just "404:" or "400:" without a specific message after
        extractedErrorText = `Server responded with status ${parsedMessage[1]}.`;
    }

    // Now, map the extracted error text to user-friendly messages
    switch (extractedErrorText) {
      case 'INVALID_EMAIL': return 'The email address is not valid.';
      case 'EMAIL_EXISTS': return 'This email is already in use.';
      case 'INVALID_PASSWORD': return 'Invalid password. Please try again.';
      case 'EMAIL_NOT_FOUND': return 'No user found with this email.';
      case 'USER_DISABLED': return 'This user account has been disabled.';
      case 'OPERATION_NOT_ALLOWED': return 'Authentication method not enabled. Please contact support.';
      case 'TOO_MANY_ATTEMPTS_TRY_LATER': return 'Too many attempts. Please try again later.';
      case 'INVALID_REFRESH_TOKEN':
      case 'CREDENTIAL_TOO_OLD_LOGIN_AGAIN': return 'Your session has expired. Please log in again.';
      default:
        // Generic Axios messages like "Request failed with status code 400"
        if (message.includes('status code')) {
            return `Server error (${err.response?.status || 'unknown'}). Please try again.`;
        }
        return extractedErrorText.replace(/_/g, ' ') || userFriendlyMessage; // Fallback to raw extracted text
    }
  }

  return userFriendlyMessage;
};

// ... (rest of your API functions remain the same as the previous response)

// Create new user
export const createUser = async (email, password, account_type) => {
    try {
      console.log("Attempting to create user...");
      const response = await api.post("/create-user", { email, password, account_type });
      console.log("User creation response:", response.data);

      if (response.status >= 200 && response.status < 300 && (response.data.status === 'success' || response.data.idToken)) {
        console.log("User created successfully. Attempting to log in...");
        const loginResponse = await loginUser(email, password, account_type);
        return loginResponse;
      } else {
        const errorMessage = response.data.message || 'Failed to create user due to an unknown server response.';
        Alert.alert("Account Creation Failed", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = extractApiErrorMessage(err);
      Alert.alert("Account Creation Failed", errorMessage);
      throw new Error(errorMessage);
    }
};

// Login user with error handling
export const loginUser = async (email, password, account_type) => {
    try {
      console.log("Attempting to log in user...");
      const response = await api.post("/login", { email, password, account_type });
      console.log("Login response:", response.data);

      if (response.data && response.data.idToken && response.data.refreshToken && response.data.expiresIn) {
        await saveAuthTokens(response.data);
        return response.data;
      } else {
        const errorMessage = response.data.message || 'Login failed. Invalid or incomplete response from server.';
        Alert.alert("Login Failed", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      const errorMessage = extractApiErrorMessage(err);
      Alert.alert("Login Failed", errorMessage);
      throw new Error(errorMessage);
    }
};

// ... (rest of your functions: logout, refreshFirebaseToken, checkLoginStatus, saveUserDetails, fetchAndStoreUserDetails)
// These functions will use the updated extractApiErrorMessage
export const logout = async () => {
    console.log("Attempting to log out...");
    try {
      await removeAuthTokens();
      await AsyncStorage.removeItem("userDetails");
      console.log("User successfully logged out and data cleared.");
    } catch (error) {
      console.error("Error during logout:", error);
      Alert.alert("Logout Error", "Failed to log out completely. Please try restarting the app.");
    }
};

const refreshFirebaseToken = async () => {
    console.log("Attempting to refresh Firebase token...");
    try {
      const tokens = await getAuthTokens();
      if (!tokens || !tokens.refreshToken) {
        console.warn("No refresh token found for refreshing.");
        return false;
      }

      const response = await api.post("/refresh-token", { refreshToken: tokens.refreshToken });

      if (response.data && response.data.idToken && response.data.refreshToken && response.data.expiresIn) {
        await saveAuthTokens(response.data);
        console.log("Firebase token refreshed successfully!");
        return true;
      } else {
        console.warn("Token refresh failed: Invalid response from server.", response.data);
        await logout();
        return false;
      }
    } catch (error) {
      const errorMessage = extractApiErrorMessage(error);
      console.error("Error refreshing Firebase token:", errorMessage, error);
      if (errorMessage.includes("expired") || errorMessage.includes("INVALID_REFRESH_TOKEN")) {
          await logout();
          Alert.alert("Session Expired", "Your session has expired. Please log in again.");
      } else {
          Alert.alert("Session Refresh Failed", errorMessage);
      }
      return false;
    }
};

export const checkLoginStatus = async () => {
    console.log("Checking login status...");
    const tokens = await getAuthTokens();

    if (!tokens || !tokens.idToken || !tokens.expiryTime) {
      console.log("No valid tokens found.");
      return false;
    }

    const idTokenExpiryTime = parseInt(tokens.expiryTime);
    const currentTime = Date.now();

    const isIdTokenValid = currentTime < idTokenExpiryTime;
    console.log(`ID Token valid: ${isIdTokenValid} (Expires: ${new Date(idTokenExpiryTime).toLocaleString()})`);

    if (isIdTokenValid) {
      console.log("User is logged in (ID token is valid).");
      return true;
    } else {
      console.log("ID token expired. Attempting to refresh...");
      const refreshed = await refreshFirebaseToken();
      if (refreshed) {
        console.log("Token refreshed, user is logged in.");
        return true;
      } else {
        console.log("Token refresh failed. User is not logged in.");
        return false;
      }
    }
};

export const saveUserDetails = async (profileData) => {
    console.log("Attempting to save user details...");
    const tokens = await getAuthTokens();
    if (!tokens || !tokens.idToken) {
      Alert.alert("Authentication Required", "Please log in to save your details.");
      throw new Error("Missing ID token. Please log in.");
    }

    const { idToken } = tokens;

    const cleanedProfileData = Object.fromEntries(
      Object.entries(profileData).filter(([_, value]) => value !== undefined && value !== null)
    );

    try {
      const response = await api.post("/user-details", {
        idToken,
        ...cleanedProfileData
      });
      console.log("User details saved response:", response.data);
      return response.data;
    } catch (err) {
      const errorMessage = extractApiErrorMessage(err);
      Alert.alert("Save Details Failed", errorMessage);
      throw new Error(errorMessage);
    }
};

export const fetchAndStoreUserDetails = async () => {
    console.log("Attempting to fetch and store user details...");
    let idToken;
    try {
      const tokens = await getAuthTokens();
      if (!tokens || !tokens.idToken) {
        Alert.alert("Authentication Required", "Please log in to fetch your details.");
        throw new Error("Missing ID token. Please log in.");
      }
      idToken = tokens.idToken;

      const response = await api.post("/user-detail", { idToken });

      if (response.data && response.data.status === 'success' && response.data.data) {
        const userDetails = response.data.data;
        await AsyncStorage.setItem('userDetails', JSON.stringify(userDetails));
        console.log("User details fetched and stored successfully:", userDetails);
        return userDetails;
      } else {
        const errorMessage = response.data.message || 'Failed to fetch user details. Invalid response.';
        Alert.alert("Fetch Details Failed", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      const errorMessage = extractApiErrorMessage(error);
      console.error('Error fetching user details:', errorMessage, error);
      Alert.alert("Fetch Details Failed", errorMessage);
      throw error;
    }
};
export const saveMedicinesApi = async (medicinesArray) => {
     const tokens = await getAuthTokens();
    const idToken = tokens?.idToken;
  if (!idToken) {
    Alert.alert("Authentication Error", "Could not retrieve user session. Please log in again.");
    throw new Error("ID token not available.");
  }

   const payload = {
      idToken: idToken, // The code implies an idToken is needed, though not directly shown in the 'newMedicine' object
      medicines: medicinesArray.map(m => ({ // Map to match your desired payload structure
        id: m.id,
        medicine_name: m.name,
        dosage: m.dosage, // Assuming dosage needs 'mg' appended for the payload
        initial_quantity: m.initialQuantity, // Convert to string as per example
        daily_intake: m.dailyIntake, // Convert to string as per example
        timestamp: m.timestamp
      }))
    };

  try {

      const response = await api.post("/save-medicines", payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.status == 200) {
      // const errorData = await response.json();
      Alert.alert("Failed to save medicines:");
    }

    return await response.data;
  } catch (error) {
    Alert.alert("API Error", `Failed to save medicines: ${error.message}`);
    throw error;
  }
};



export const saveHealthMetricsApi = async (healthMetrics) => {
  try {
    const tokens = await getAuthTokens();
    const idToken = tokens?.idToken;

    if (!idToken) {
      Alert.alert("Authentication Error", "Could not retrieve user session. Please log in again.");
      throw new Error("ID token not available.");
    }

    const payload = {
      idToken,
      health_metrics: healthMetrics.map(m => ({ // Map to match your desired payload structure
        id: m.id,
        metric: m.type,
        data: m.value, // Convert to string as per example
        timestamp: m.timestamp
      }))
    };

    const response = await api.post("/save-health-metrics", payload, {
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
    Alert.alert("API call error (saveHealthMetricsApi):", error);
  }
};

export const GetHealthMetricsApi = async () => {
  try {
    const tokens = await getAuthTokens();
    const idToken = tokens?.idToken;

    if (!idToken) {
      // It's good to throw an error here to prevent further execution
      // and allow the calling function to handle the authentication failure.
      Alert.alert("Authentication Required", "Your session has expired or is invalid. Please log in again.");
      throw new Error("ID token not available for health metrics API call.");
    }

    // IMPORTANT: Confirm with your backend how the ID token should be sent.
    // This assumes the backend expects the ID token directly as the JSON body.
    // If your backend expects a JSON object like { "idToken": "yourToken" },
    // you should change the body to { idToken: idToken }.
    const response = await api.post("/get-health-metric", { idToken: idToken }, {
      headers: {
        "Content-Type": "application/json",
        // Consider adding Authorization header here if needed for your backend
        // 'Authorization': `Bearer ${idToken}`,
      },
    });

    // Check for a successful HTTP status code (200-299 range)
    if (response.status < 200 || response.status >= 300) {
      // This handles non-2xx responses from the server
      const serverErrorMessage = response.data?.message || "An unexpected server response occurred.";
      Alert.alert("Server Error", `Failed to fetch health metrics: ${serverErrorMessage} (Status: ${response.status})`);
      throw new Error(`Server error: ${serverErrorMessage} (Status: ${response.status})`);
    }

    // --- Critical part: Returning the correct data structure ---
    // Based on your previous response example:
    // response - [ { "id": "metric001", ... }, { "id": "metric003", ... } ]
    // This means the array of metrics is directly in `response.data`.
    // If your backend nests it like { "data": [{...}, {...}] }, then it should be `response.data.data`.
    
    // Assuming the health metrics array is directly in `response.data`
    if (Array.isArray(response.data)) {
      // Alert.alert("Raw API Response Data", JSON.stringify(response.data, null, 2));
        return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
        // Fallback for if it's nested under a 'data' key
        return response.data.data;
    } else {
        // If the data structure is unexpected, alert and throw an error
        Alert.alert("Data Format Error", "Received health metrics data in an unexpected format.");
        throw new Error("Unexpected data format from /get-health-metric endpoint.");
    }

  } catch (error) {
    let userMessage = "Something went wrong while fetching health metrics. Please try again.";
    console.error("Error in GetHealthMetricsApi:", error); // Log full error for debugging

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      userMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      // The request was made but no response was received
      userMessage = "No response from the server. Please check your internet connection.";
    } else if (error.message.includes("ID token not available")) {
      // Specific handling for the authentication error thrown earlier
      userMessage = "You need to log in to access health metrics.";
    }

    Alert.alert("Error Fetching Health Data", userMessage);
    // Re-throw the error so the calling component can also catch it if needed,
    // or return an empty array/null if you prefer to just show no data silently.
    throw error;
  }
};

export const GetMedicines = async () => {
  try {
    const tokens = await getAuthTokens();
    const idToken = tokens?.idToken;

    if (!idToken) {
      // It's good to throw an error here to prevent further execution
      // and allow the calling function to handle the authentication failure.
      Alert.alert("Authentication Required", "Your session has expired or is invalid. Please log in again.");
      throw new Error("ID token not available for health metrics API call.");
    }

    // IMPORTANT: Confirm with your backend how the ID token should be sent.
    // This assumes the backend expects the ID token directly as the JSON body.
    // If your backend expects a JSON object like { "idToken": "yourToken" },
    // you should change the body to { idToken: idToken }.
    const response = await api.post("/get-medicines", { idToken: idToken }, {
      headers: {
        "Content-Type": "application/json",
        // Consider adding Authorization header here if needed for your backend
        // 'Authorization': `Bearer ${idToken}`,
      },
    });

    // Check for a successful HTTP status code (200-299 range)
    if (response.status < 200 || response.status >= 300) {
      // This handles non-2xx responses from the server
      const serverErrorMessage = response.data?.message || "An unexpected server response occurred.";
      Alert.alert("Server Error", `Failed to fetch health metrics: ${serverErrorMessage} (Status: ${response.status})`);
      throw new Error(`Server error: ${serverErrorMessage} (Status: ${response.status})`);
    }

    // --- Critical part: Returning the correct data structure ---
    // Based on your previous response example:
    // response - [ { "id": "metric001", ... }, { "id": "metric003", ... } ]
    // This means the array of metrics is directly in `response.data`.
    // If your backend nests it like { "data": [{...}, {...}] }, then it should be `response.data.data`.
    
    // Assuming the health metrics array is directly in `response.data`
    if (Array.isArray(response.data)) {
      // Alert.alert("Raw API Response Data", JSON.stringify(response.data, null, 2));
        return response.data;
    } else if (response.data && Array.isArray(response.data.data)) {
        // Fallback for if it's nested under a 'data' key
        return response.data.data;
    } else {
        // If the data structure is unexpected, alert and throw an error
        Alert.alert("Data Format Error", "Received health metrics data in an unexpected format.");
        throw new Error("Unexpected data format from /get-health-metric endpoint.");
    }

  } catch (error) {
    let userMessage = "Something went wrong while fetching health metrics. Please try again.";
    console.error("Error in GetHealthMetricsApi:", error); // Log full error for debugging

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      userMessage = error.response.data?.message || `Server error: ${error.response.status}`;
    } else if (error.request) {
      // The request was made but no response was received
      userMessage = "No response from the server. Please check your internet connection.";
    } else if (error.message.includes("ID token not available")) {
      // Specific handling for the authentication error thrown earlier
      userMessage = "You need to log in to access health metrics.";
    }

    Alert.alert("Error Fetching Health Data", userMessage);
    // Re-throw the error so the calling component can also catch it if needed,
    // or return an empty array/null if you prefer to just show no data silently.
    throw error;
  }
};
export const deleteMedicineApi = async (medicineid) => {
  try {
    const tokens = await getAuthTokens();
    const idToken = tokens?.idToken;

    if (!idToken) {
      Alert.alert("Authentication Error", "Could not retrieve user session. Please log in again.");
      throw new Error("ID token not available.");
    }

    // The payload for a DELETE request is typically sent in the request body
    // However, some APIs expect identifiers in the URL or as query parameters.
    // Based on your desired payload structure, we'll send it as a data property
    // if your API client supports sending a body with DELETE, or as query params.

    // Assuming `api.deletet` (which should probably be `api.delete`)
    // supports sending a data payload as the second argument for DELETE requests.
    // If not, you might need to adjust your API client or backend.

    const response = await api.delete("/delete-medicine", {
      data: { // Use 'data' for the request body in Axios or similar clients
        idToken,
        medicine_id: medicineid
      },
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': `Bearer ${idToken}`, // Uncomment if your backend requires this
      },
    });

    if (response.status === 200) {
      // If the status is 200, it means the request was successful.
      // The previous code had an error here, alerting "Server Error" on success.
      console.log("Medicine deleted successfully:", response.data);
      return response.data; // Return data on success
    } else {
      // Handle other successful statuses if applicable (e.g., 204 No Content)
      Alert.alert("Deletion Failed", `Server responded with status: ${response.status}.`);
      throw new Error(`Unexpected server response with status: ${response.status}`);
    }
  } catch (error) {
    console.error("API call error (deleteMedicineApi):", error); // Log the full error
    const errorMessage = error.response?.data?.message || error.message || "An unknown error occurred.";
    Alert.alert("Deletion Error", errorMessage);
    throw error; // Re-throw the error for further handling up the call stack
  }
};