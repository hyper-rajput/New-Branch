import React, { useEffect } from "react";
import { View, Text, StyleSheet, SafeAreaView,Alert } from "react-native";
import { checkLoginStatus, fetchAndStoreUserDetails } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const navigateToLogin = async () => {
      try {
        const isLoggedIn = await checkLoginStatus();

        if (isLoggedIn) {
          const account_type:any = await AsyncStorage.getItem('account_type');
          navigation.replace(account_type === 'family' ? "FamilyDashboard":"Dashboard");
        } else {
          navigation.replace("LoginScreen");
        }
      } catch (error) {
        navigation.replace("LoginScreen");
      }
    };

    const timer = setTimeout(navigateToLogin, 500);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={[styles.circle, styles.blueCircle]} />
        <View style={[styles.circle, styles.purpleCircle]} />
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>LUMIA</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#A8D5BA",
    justifyContent: "center",
  },
  innerContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  circle: {
    position: "absolute",
    borderRadius: 200,
  },
  blueCircle: {
    width: 300,
    height: 300,
    backgroundColor: "#90CAF9",
    top: -50,
    left: -50,
  },
  purpleCircle: {
    width: 250,
    height: 250,
    backgroundColor: "#B39DDB",
    bottom: -50,
    right: -50,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  logoText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#388E3C",
  },
});

export default SplashScreen;
