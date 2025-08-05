import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Keyboard,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  KeyboardTypeOptions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

type ProfileSetupScreenProps = {
  navigation: any;
  route: {
    params?: {
      stepKey?: string;
      returnToSummary?: boolean;
    };
  };
};

const steps = [
  {
    key: "age",
    label: "What's your Age?",
    required: true,
    input: true,
    keyboardType: "numeric",
    subtext: "Your age helps us tailor a plan just for you—let’s make your wellness journey personal! Today's Date: August 06, 2025, 12:20 AM IST",
  },
  {
    key: "name",
    label: "Your good name...",
    required: true,
    input: true,
    placeholder: "Enter your name",
    dependsOn: "age",
  },
  {
    key: "bloodGroup",
    label: "My blood group is...",
    required: true,
    options: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    cardLayout: true,
  },
  {
    key: "languagePreference",
    label: "My preferred language is...",
    required: true,
    options: [
      "Hindi",
      "Bengali",
      "Marathi",
      "Telugu",
      "Tamil",
      "Gujarati",
      "Urdu",
      "Kannada",
      "Odia",
      "Malayalam",
      "Punjabi",
      "Assamese",
      "Maithili",
    ],
    cardLayout: true,
  },
  {
    key: "habitsToSkip",
    label: "Are there any habits you want to skip or leave?",
    required: false,
    options: ["Smoking", "Alcohol", "Tobacco", "Chewing Paan", "None"],
    multiSelect: true,
    cardLayout: true,
  },
  {
    key: "allergy",
    label: "Do you have any allergies?",
    required: false,
    options: ["Pollen", "Dust", "Certain Spices", "Milk Products", "Peanuts", "None"],
    multiSelect: true,
    cardLayout: true,
  },
  {
    key: "medicalCondition",
    label: "Do you have any medical conditions?",
    required: false,
    options: ["Diabetes", "Hypertension", "Arthritis", "Asthma", "Heart Disease", "None"],
    multiSelect: true,
    cardLayout: true,
  },
  {
    key: "interest",
    label: "What are your interests?",
    required: false,
    options: ["Gardening", "Yoga", "Classical Music", "Cooking Indian Dishes", "Reading Indian Literature", "None"],
    multiSelect: true,
    cardLayout: true,
  },
];

// Language to native script mapping
const languageNativeMap: { [key: string]: string } = {
  Hindi: "हिंदी",
  Bengali: "বাংলা",
  Marathi: "मराठी",
  Telugu: "తెలుగు",
  Tamil: "தமிழ்",
  Gujarati: "ગુજરાતી",
  Urdu: "اردو",
  Kannada: "ಕನ್ನಡ",
  Odia: "ଓଡ଼ିଆ",
  Malayalam: "മലയാളം",
  Punjabi: "ਪੰਜਾਬੀ",
  Assamese: "অসমীয়া",
  Maithili: "मैथिली",
};

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ navigation, route }) => {
  const { stepKey } = route.params || {};
  const initialStep = stepKey ? steps.findIndex((s) => s.key === stepKey) : 0;
  const [step, setStep] = useState(initialStep);
  const [form, setForm] = useState<{ [key: string]: string | string[] }>({
    habitsToSkip: [],
    allergy: [],
    medicalCondition: [],
    interest: [],
    languagePreference: "Hindi",
  });
  const [inputFocused, setInputFocused] = useState(false);
  const [otherInputs, setOtherInputs] = useState<{ [key: string]: string }>({
    habitsToSkip: "",
    allergy: "",
    medicalCondition: "",
    interest: "",
  });
  const [ageError, setAgeError] = useState<string | null>(null);

  console.log("Rendering step:", step, "Current key:", steps[step]?.key, "Form:", form);

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;
  const value = Array.isArray(form[current.key])
    ? (form[current.key] as string[]).join(", ")
    : (form[current.key] as string) || "";

  const validateAge = (age: string) => {
    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum)) return "Please enter a valid age.";
    if (ageNum < 13 || ageNum > 100) return "Age must be between 13 and 100.";
    return null;
  };

  const canGoNext = current.required
    ? current.key === "age"
      ? !ageError && !!value
      : Array.isArray(value)
      ? value.length > 0
      : !!(value && value.trim())
    : true;

  const handleNext = () => {
    if (!canGoNext) return;
    if (isLast) navigation.replace("ProfileSetupSummary", { formData: form });
    else setStep((s) => s + 1);
  };

  const handleBack = () => {
    if (isFirst) navigation.goBack();
    else setStep((s) => s - 1);
  };

  const handleSelect = (option: string) => {
    console.log("Handling select:", option, "for key:", current.key);
    if (current.key === "languagePreference" || current.key === "bloodGroup") {
      setForm((f) => ({ ...f, [current.key]: option }));
    } else if (current.multiSelect) {
      const currentValues = (form[current.key] as string[]) || [];
      if (option === "None") setForm((f) => ({ ...f, [current.key]: ["None"] }));
      else {
        const newValues = currentValues.includes(option)
          ? currentValues.filter((v) => v !== option && v !== "None")
          : [...currentValues.filter((v) => v !== "None"), option];
        setForm((f) => ({ ...f, [current.key]: newValues }));
      }
    }
  };

  const handleOtherInput = (text: string) => {
    setForm((f) => ({
      ...f,
      [current.key]: Array.isArray(f[current.key])
        ? [...(f[current.key] as string[]).filter((v) => v !== "Other"), text]
        : text,
    }));
    setOtherInputs((prev) => ({ ...prev, [current.key]: text }));
  };

  const handleInput = (text: string) => {
    setForm((f) => ({ ...f, [current.key]: text }));
    if (current.key === "age") setAgeError(validateAge(text));
  };

  const progress = ((step + 1) / steps.length) * 100;

  useEffect(() => {
    const showListener = Keyboard.addListener("keyboardDidShow", () => setInputFocused(true));
    const hideListener = Keyboard.addListener("keyboardDidHide", () => setInputFocused(false));
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back-ios" size={24} color="#2B2B2B" />
        </TouchableOpacity>
      </View>
      <View style={styles.statusBar}>
        <View style={[styles.progressBar, { width: `${progress}%` }]} />
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.keyboardAvoidingView}>
        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{current.label}</Text>
          {current.key === "age" && (
            <View>
              <Text style={styles.subtext}>{current.subtext}</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder={current.placeholder}
                    value={value}
                    onChangeText={handleInput}
                    keyboardType={current.keyboardType as KeyboardTypeOptions}
                    autoFocus
                    placeholderTextColor="#6B6B6B"
                    onFocus={() => setInputFocused(true)}
                    onBlur={() => setInputFocused(false)}
                  />
                  <Text style={styles.yearsText}>Years</Text>
                </View>
              </View>
              {ageError && <Text style={styles.errorText}>{ageError}</Text>}
            </View>
          )}
          {current.key === "name" && form["age"] && (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder={current.placeholder}
                value={value}
                onChangeText={handleInput}
                keyboardType="default"
                autoFocus
                placeholderTextColor="#6B6B6B"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
              />
            </View>
          )}
          {current.cardLayout && current.key === "bloodGroup" && (
            <View style={styles.cardContainer}>
              {current.options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.card, form[current.key] === option && styles.cardSelected]}
                  onPress={() => handleSelect(option)}
                >
                  <Text style={styles.cardText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {current.cardLayout &&
            current.key !== "age" &&
            current.key !== "bloodGroup" &&
            current.key !== "languagePreference" && (
              <View style={styles.cardContainer}>
                {current.options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.card,
                      Array.isArray(form[current.key]) && (form[current.key] as string[]).includes(option) && styles.cardSelected,
                    ]}
                    onPress={() => handleSelect(option)}
                  >
                    <Text style={styles.cardText}>{option}</Text>
                  </TouchableOpacity>
                ))}
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    placeholder={`Enter your ${current.key.replace(/([A-Z])/g, " $1").toLowerCase()}`}
                    value={otherInputs[current.key] || ""}
                    onChangeText={handleOtherInput}
                    placeholderTextColor="#6B6B6B"
                  />
                </View>
              </View>
            )}
          {current.key === "languagePreference" && current.options && current.options.length > 0 && (
            <View>
              {/* Separate styled header card */}
              <View style={styles.headerCard}>
                <MaterialIcons name="language" size={24} color="#4CAF50" style={styles.headerIcon} />
                <Text style={styles.headerText}>Choose your preferred language</Text>
              </View>
              {/* Language selection cards */}
              <View style={styles.cardContainer}>
                {current.options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[styles.languageCard, form["languagePreference"] === option && styles.cardSelected]}
                    onPress={() => handleSelect(option)}
                  >
                    <MaterialIcons
                      name={form["languagePreference"] === option ? "radio-button-checked" : "radio-button-unchecked"}
                      size={20}
                      color={form["languagePreference"] === option ? "#4CAF50" : "#6B6B6B"}
                      style={styles.radioIcon}
                    />
                    <Text style={styles.languageText}>
                      {option} - {languageNativeMap[option]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        <View style={[styles.bottomNav, inputFocused && styles.bottomNavFocused]}>
          <TouchableOpacity
            style={[styles.nextButton, !canGoNext && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canGoNext}
          >
            <Text style={styles.nextButtonText}>{isLast ? "Finish" : "Next"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  backButton: { padding: 8 },
  statusBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 24,
    marginTop: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: { height: "100%", backgroundColor: "#4CAF50", borderRadius: 4 },
  keyboardAvoidingView: { flex: 1 },
  scrollContainer: { flex: 1 },
  title: {
    color: "#2B2B2B",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 18,
    marginHorizontal: 24,
    letterSpacing: 0.5,
    padding: 8,
    top: 10,
  },
  subtext: {
    color: "#6B6B6B",
    fontSize: 16,
    textAlign: "center",
    marginHorizontal: 24,
    marginBottom: 8,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 8,
    marginHorizontal: 12,
    padding: 10,
  },
  card: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    margin: 6,
    width: "30%",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  languageCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    margin: 6,
    width: "45%", // Wider cards for text and icon
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
    borderWidth: 2,
  },
  cardText: {
    color: "#2B2B2B",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  languageText: {
    color: "#2B2B2B",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  inputWrapper: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginHorizontal: 24,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  inputContainer: { flexDirection: "row", alignItems: "center" },
  input: { flex: 1, color: "#2B2B2B", fontSize: 17, fontWeight: "bold", padding: 0, minHeight: 30 },
  yearsText: { color: "#6B6B6B", fontSize: 17, fontWeight: "bold", marginLeft: 8 },
  errorText: { color: "red", fontSize: 14, textAlign: "left", marginTop: 4, marginLeft: 24 },
  dropdownContainer: { marginHorizontal: 24, marginVertical: 8 },
  picker: { height: 200, width: "100%" },
  bottomNav: { justifyContent: "center", alignItems: "center", paddingVertical: 16, paddingBottom: 24 },
  bottomNavFocused: { paddingBottom: 0, position: "absolute", bottom: 16, left: 0, right: 0, backgroundColor: "#FFF" },
  nextButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 40,
    paddingVertical: 16,
    paddingHorizontal: 60,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonDisabled: { backgroundColor: "#B0B0B0" },
  nextButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold", letterSpacing: 0.5 },
  headerCard: {
    backgroundColor: "#F0F4F8",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
    marginHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerIcon: { marginRight: 8 },
  headerText: {
    color: "#2B2B2B",
    fontSize: 18,
    fontWeight: "600",
  },
  radioIcon: { marginRight: 8 }
});

export default ProfileSetupScreen;