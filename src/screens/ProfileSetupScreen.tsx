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
      "Odia",
      "Bengali",
      "Marathi",
      "Telugu",
      "Tamil",
      "Gujarati",
      "Malayalam",
      "Kannada",
      "Urdu",
      "Punjabi",
      "Assamese",
    ],
    cardLayout: true,
  },
  {
    key: "habitsToSkip",
    label: "Are there any habits you want to skip or leave?",
    required: false,
    options: [
      "Smoking", "Alcohol", "Tobacco", "Chewing Paan", "Junk Food", "Sugary Drinks", "None"
    ],
    multiSelect: true,
    cardLayout: true,
  },
  {
    key: "allergy",
    label: "Do you have any allergies?",
    required: false,
    options: [
      "Pollen", "Dust", "Certain Spices", "Milk Products", "Peanuts", "Seafood", "Eggs", "Gluten", "None"
    ],
    multiSelect: true,
    cardLayout: true,
  },
  {
    key: "medicalCondition",
    label: "Do you have any medical conditions?",
    required: false,
    options: [
      "Diabetes", "Hypertension", "Arthritis", "Asthma", "Heart Disease", "Thyroid", "Obesity", "Cholesterol", "None"
    ],
    multiSelect: true,
    cardLayout: true,
  },
  {
    key: "interest",
    label: "What are your interests?",
    required: false,
    options: [
      "Gardening", "Yoga", "Classical Music", "Cooking Indian Dishes", "Reading Indian Literature", "Painting", "Traveling", "Photography", "Meditation", "None"
    ],
    multiSelect: true,
    cardLayout: true,
  },
];

// Language to native script mapping
const languageNativeMap: { [key: string]: string } = {
  Hindi: "हिंदी",
  Odia: "ଓଡ଼ିଆ",
  Bengali: "বাংলা",
  Marathi: "मराठी",
  Telugu: "తెలుగు",
  Tamil: "தமிழ்",
  Gujarati: "ગુજરાતી",
  Malayalam: "മലയാളം",
  Kannada: "ಕನ್ನಡ",
  Urdu: "اردو",
  Punjabi: "ਪੰਜਾਬੀ",
  Assamese: "অসমীয়া",
};

const MULTI_SELECT_OPTIONS = [
  // 9 options + None for uniformity
  ["Smoking", "Alcohol", "Tobacco", "Chewing Paan", "Junk Food", "Sugary Drinks", "Fast Food", "Caffeine", "None"],
  ["Pollen", "Dust", "Certain Spices", "Milk Products", "Peanuts", "Seafood", "Eggs", "Gluten", "None"],
  ["Diabetes", "Hypertension", "Arthritis", "Asthma", "Heart Disease", "Thyroid","Cholesterol", "Migraine", "None"],
  ["Gardening", "Yoga", "Music", "Cooking", "Reading", "Painting", "Photography", "Meditation", "None"]
];
const MULTI_SELECT_KEYS = ["habitsToSkip", "allergy", "medicalCondition", "interest"];

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
  const [multiSelectError, setMultiSelectError] = useState<string | null>(null);

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
      : current.multiSelect
        ? Array.isArray(form[current.key]) && (form[current.key] as string[]).length > 0 && !(form[current.key] as string[]).includes("")
        : Array.isArray(value)
          ? value.length > 0
          : !!(value && value.trim())
    : true;

  const handleNext = () => {
    if (!canGoNext) {
      if (current.multiSelect) {
        setMultiSelectError("Please select at least one option before proceeding.");
      }
      return;
    }
    setMultiSelectError(null);
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
  };23

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

  const isBigBoxLanguage = (language: string) => {
    const bigBoxLanguages = ["Gujarati", "Malayalam", "Kannada", "Assamese"];
    return bigBoxLanguages.includes(language);
  };

  const organizeLanguages = () => {
    const smallBoxLanguages = ["Hindi", "Urdu", "Tamil", "Odia", "Punjabi"];
    const bigBoxLanguages = ["Gujarati", "Malayalam", "Kannada", "Assamese", "Bengali", "Marathi", "Telugu"];

    return [
      ...smallBoxLanguages.slice(0, 4), // First 2 rows of small boxes
      ...bigBoxLanguages, // 4 rows of larger boxes
      ...smallBoxLanguages.slice(4), // Last row of small boxes
    ];
  };

  const organizedLanguages = organizeLanguages();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {!isFirst && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialIcons name="arrow-back-ios" size={24} color="#2B2B2B" />
          </TouchableOpacity>
        )}
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
              <View>
                <View style={styles.headerCard}>
                  <MaterialIcons name="list" size={24} color="#4CAF50" style={styles.headerIcon} />
                  <Text style={styles.headerText}>Choose your {current.key.replace(/([A-Z])/g, " $1").toLowerCase()}</Text>
                </View>
                <View style={styles.cardContainer}>
                  {(() => {
                    const options = MULTI_SELECT_OPTIONS[MULTI_SELECT_KEYS.indexOf(current.key)];
                    const normalOptions = options.filter(opt => opt !== "None");
                    const noneOption = options.find(opt => opt === "None");
                    const rows = [];
                    for (let i = 0; i < normalOptions.length; i += 2) {
                      const rowOptions = normalOptions.slice(i, i + 2);
                      rows.push(
                        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
                          {rowOptions.map(option => {
                            const isBig = option.length > 14;
                            return (
                              <TouchableOpacity
                                key={option}
                                style={[
                                  styles.card,
                                  Array.isArray(form[current.key]) && (form[current.key] as string[]).includes(option) && styles.cardSelected,
                                  { width: isBig ? "90%" : "45%", height: 60, flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 8 },
                                  isBig && { marginLeft: "5%" }
                                ]}
                                onPress={() => handleSelect(option)}
                              >
                                <MaterialIcons
                                  name={Array.isArray(form[current.key]) && (form[current.key] as string[]).includes(option) ? "check-box" : "check-box-outline-blank"}
                                  size={20}
                                  color={Array.isArray(form[current.key]) && (form[current.key] as string[]).includes(option) ? "#4CAF50" : "#6B6B6B"}
                                  style={[styles.radioIcon, { marginRight: 8 }]} // left most
                                />
                                <Text style={{ textAlign: "center", flex: 1 }}>{option}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      );
                    }
                    // None option at bottom row, centered
                    if (noneOption) {
                      rows.push(
                        <View key="none-row" style={{ width: "100%", alignItems: "center", marginTop: 8 }}>
                          <TouchableOpacity
                            style={[
                              styles.card,
                              Array.isArray(form[current.key]) && (form[current.key] as string[]).includes(noneOption) && styles.cardSelected,
                              { width: "60%", height: 60, flexDirection: "row", alignItems: "center", justifyContent: "center" }
                            ]}
                            onPress={() => handleSelect(noneOption)}
                          >
                            <MaterialIcons
                              name={Array.isArray(form[current.key]) && (form[current.key] as string[]).includes(noneOption) ? "check-box" : "check-box-outline-blank"}
                              size={20}
                              color={Array.isArray(form[current.key]) && (form[current.key] as string[]).includes(noneOption) ? "#4CAF50" : "#6B6B6B"}
                              style={[styles.radioIcon, { marginRight: 8 }]} // left most
                            />
                            <Text style={{ textAlign: "center", flex: 1 }}>{noneOption}</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    }
                    return rows;
                  })()}
                </View>
              </View>
            )}
          {current.key === "languagePreference" && current.options && current.options.length > 0 && (
            <View>
              <View style={styles.headerCard}>
                <MaterialIcons name="language" size={24} color="#4CAF50" style={styles.headerIcon} />
                <Text style={styles.headerText}>Choose your preferred language</Text>
              </View>
              <View style={styles.cardContainer}>
                {organizedLanguages.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.languageCard,
                      form["languagePreference"] === option && styles.cardSelected,
                      { height: 60 }, // Uniform height for all boxes
                      isBigBoxLanguage(option) && { width: "90%", justifyContent: "center" },
                      !isBigBoxLanguage(option) && { width: "45%" },
                    ]}
                    onPress={() => handleSelect(option)}
                  >
                    <MaterialIcons
                      name={form["languagePreference"] === option ? "radio-button-checked" : "radio-button-unchecked"}
                      size={20}
                      color={form["languagePreference"] === option ? "#4CAF50" : "#6B6B6B"}
                      style={styles.radioIcon}
                    />
                    <Text style={[styles.languageText, isBigBoxLanguage(option) && { textAlign: "center" }]}>
                      {option} - {languageNativeMap[option]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
        <View style={[styles.bottomNav, inputFocused && styles.bottomNavFocused]}>
          {multiSelectError && (
            <Text style={{ color: "red", fontSize: 15, marginBottom: 8, textAlign: "center" }}>{multiSelectError}</Text>
          )}
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
    justifyContent: "space-between",
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
  radioIcon: { marginRight: 8 },
  addMoreCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    margin: 6,
    width: "45%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  }
});

export default ProfileSetupScreen;