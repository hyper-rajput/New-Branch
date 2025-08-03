import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { saveUserDetails } from "../services/api";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type CustomDropdownProps = {
  label: string;
  value: string;
  options: string[];
  onSelect: (val: string) => void;
};

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, value, options, onSelect }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => {
          Keyboard.dismiss();
          setVisible(!visible);
        }}
      >
        <Text style={styles.dropdownText}>{value || label}</Text>
        <MaterialIcons name={visible ? "arrow-drop-up" : "arrow-drop-down"} size={24} color="#2B2B2B" />
      </TouchableOpacity>
      {visible && (
        <View style={styles.cardContainer}>
          {options.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.card,
                value === option ? styles.cardSelected : null,
              ]}
              onPress={() => {
                onSelect(option);
                setVisible(false);
              }}
            >
              <Text style={styles.cardText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

type RootStackParamList = {
  ProfileSetup: undefined;
  ProfileSetupSummary: { formData: { [key: string]: string | string[] } };
  Dashboard: undefined;
};

type ProfileSetupScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileSetup'>;
  route: {
    params?: {
      stepKey?: string;
      returnToSummary?: boolean;
    };
  };
};

const steps = [
  {
    key: 'age',
    label: 'My age is...',
    required: true,
    options: [
      '< 40 years old',
      '40-49',
      '50-59',
      '60-69',
      '70-79',
      '80-89',
      '> 90 years old',
    ],
    cardLayout: true,
  },
  {
    key: 'name',
    label: 'Your good name...',
    required: true,
    input: true,
    placeholder: 'Enter your name',
    dependsOn: 'age',
  },
  {
    key: 'bloodGroup',
    label: 'My blood group is...',
    required: true,
    options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    cardLayout: true,
  },
  {
    key: 'languagePreference',
    label: 'My preferred language is...',
    required: true,
    options: [
      'Hindi',
      'Bengali',
      'Marathi',
      'Telugu',
      'Tamil',
      'Gujarati',
      'Urdu',
      'Kannada',
      'Odia',
      'Malayalam',
      'Punjabi',
      'Assamese',
      'Maithili',
    ],
    cardLayout: false,
  },
  {
    key: 'habitsToSkip',
    label: 'Are there any habits you want to skip or leave?',
    required: false,
    options: ['Smoking', 'Alcohol', 'Tobacco', 'Chewing Paan', 'None'],
    multiSelect: true,
    cardLayout: true,
  },
  {
    key: 'allergy',
    label: 'Do you have any allergies?',
    required: false,
    options: ['Pollen', 'Dust', 'Certain Spices', 'Milk Products', 'Peanuts', 'None'],
    multiSelect: true,
    cardLayout: true,
  },
  {
    key: 'medicalCondition',
    label: 'Do you have any medical conditions?',
    required: false,
    options: ['Diabetes', 'Hypertension', 'Arthritis', 'Asthma', 'Heart Disease', 'None'],
    multiSelect: true,
    cardLayout: true,
  },
  {
    key: 'interest',
    label: 'What are your interests?',
    required: false,
    options: ['Gardening', 'Yoga', 'Classical Music', 'Cooking Indian Dishes', 'Reading Indian Literature', 'None'],
    multiSelect: true,
    cardLayout: true,
  },
];

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ navigation, route }) => {
  const { stepKey, returnToSummary } = route.params || {};
  const initialStep = stepKey ? steps.findIndex((s) => s.key === stepKey) : 0;
  const [step, setStep] = useState(initialStep);
  const [form, setForm] = useState<{ [key: string]: string | string[] }>({
    habitsToSkip: [],
    allergy: [],
    medicalCondition: [],
    interest: [],
  });
  const [saving, setSaving] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [otherInputs, setOtherInputs] = useState<{ [key: string]: string }>({
    habitsToSkip: '',
    allergy: '',
    medicalCondition: '',
    interest: '',
  }); // Track "Other" inputs for steps 5-8

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;
  const value = Array.isArray(form[current.key])
    ? (form[current.key] as string[]).join(', ')
    : (form[current.key] as string) || '';

  const options = current.options ? (current.options as string[]) : [];

  const keyboardType = 'input' in current ? current.input : 'default';
  const ageSelected = !!form['age'];
  const showNameStep = current.key === 'name' && ageSelected;
  const showOtherInput = [5, 6, 7, 8].includes(step + 1) && Array.isArray(value) && (value as string[]).includes('Other');

  const canGoNext = current.required
    ? (Array.isArray(value) ? value.length > 0 : !!(value && value.trim()))
    : true;

  const isStepCompleted = (index: number) => {
    const prevSteps = steps.slice(0, index).filter(s => s.key !== 'name' || form['age']);
    return prevSteps.every(s => {
      const val = form[s.key];
      return !s.required || (Array.isArray(val) ? val.length > 0 : !!(val && val.trim()));
    });
  };

  const handleNext = () => {
    if (!canGoNext) return;
    if (isLast) {
      if (returnToSummary) {
        navigation.replace('ProfileSetupSummary', { formData: form });
      } else {
        navigation.replace('Dashboard');
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (isFirst) {
      navigation.goBack();
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleStepClick = (index: number) => {
    if (isStepCompleted(index)) {
      setStep(index);
    } else {
      Alert.alert('Incomplete Steps', 'Please complete all previous steps before navigating.');
    }
  };

  const handleSelect = (option: string) => {
    if (current.key === 'languagePreference') {
      setForm((f) => ({ ...f, [current.key]: option }));
    } else if (current.key === 'bloodGroup') {
      setForm((f) => ({ ...f, [current.key]: option }));
    } else if (current.multiSelect) {
      const currentValues = (form[current.key] as string[]) || [];
      if (option === 'None') {
        setForm((f) => ({ ...f, [current.key]: ['None'] }));
      } else {
        const newValues = currentValues.includes(option)
          ? currentValues.filter((v) => v !== option && v !== 'None')
          : [...currentValues.filter((v) => v !== 'None'), option];
        setForm((f) => ({ ...f, [current.key]: newValues }));
      }
    } else {
      setForm((f) => ({ ...f, [current.key]: option }));
    }
  };

  const handleOtherInput = (text: string) => {
    setForm((f) => ({
      ...f,
      [current.key]: Array.isArray(f[current.key])
        ? [...(f[current.key] as string[]).filter(v => v !== 'Other'), text]
        : text,
    }));
    setOtherInputs((prev) => ({ ...prev, [current.key]: text }));
  };

  const handleInput = (text: string) => {
    setForm((f) => ({ ...f, [current.key]: text }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="#2B2B2B" />
        </TouchableOpacity>
        <Text style={styles.welcome}>Welcome to CareMitra</Text>
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('Dashboard')}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.stepperContainer}>
          {steps.map((s, idx) => (
            <React.Fragment key={s.key}>
              <TouchableOpacity
                style={[
                  styles.stepBox,
                  idx === step && styles.stepBoxActive,
                  !isStepCompleted(idx) && idx !== step && styles.stepBoxDisabled,
                ]}
                onPress={() => handleStepClick(idx)}
                disabled={!isStepCompleted(idx) && idx !== step}
              >
                {idx !== step && <Text style={styles.stepNumber}>{idx + 1}</Text>}
                {idx === step && (
                  <MaterialIcons name="edit" size={20} color="#F47C4B" style={styles.pencilIcon} />
                )}
              </TouchableOpacity>
              {idx < steps.length - 1 && <View style={styles.stepLine} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.title}>{current.label}</Text>

        {current.cardLayout && step === 0 && (
          <CustomDropdown
            label="My age is..."
            value={form['age'] || ''}
            options={steps[0].options}
            onSelect={handleSelect}
          />
        )}

        {showNameStep && (
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder={current.placeholder}
              value={value}
              onChangeText={handleInput}
              keyboardType={current.keyboardType as any || 'default'}
              autoFocus
              placeholderTextColor="#6B6B6B"
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
          </View>
        )}

        {current.cardLayout && step === 2 && (
          <View style={styles.cardContainer}>
            {current.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.card,
                  form[current.key] === option ? styles.cardSelected : null,
                ]}
                onPress={() => handleSelect(option)}
              >
                <Text style={styles.cardText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {current.cardLayout && step !== 0 && step !== 2 && step !== 3 && (
          <View style={styles.cardContainer}>
            {current.options.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.card,
                  Array.isArray(form[current.key]) && (form[current.key] as string[]).includes(option) ? styles.cardSelected : null,
                ]}
                onPress={() => handleSelect(option)}
              >
                <Text style={styles.cardText}>{option}</Text>
              </TouchableOpacity>
            ))}
            {showOtherInput && (
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={`Enter your ${current.key.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                  value={otherInputs[current.key] || ''}
                  onChangeText={handleOtherInput}
                  placeholderTextColor="#6B6B6B"
                />
              </View>
            )}
          </View>
        )}

        {current.key === 'languagePreference' && (
          <View>
            <CustomDropdown
              label="My preferred language is..."
              value={form['languagePreference'] || ''}
              options={current.options}
              onSelect={handleSelect}
            />
          </View>
        )}

        <View style={styles.bottomNav}>
          <TouchableOpacity
            style={[styles.nextButton, !canGoNext && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={!canGoNext || saving}
          >
            <Text style={styles.nextButtonText}>{isLast ? 'Finish' : 'Next'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF7E3',
  },
  scrollContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 24,
    paddingRight: 24,
    marginBottom: 8,
    position: 'relative',
  },
  welcome: {
    color: '#2B2B2B',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.5,
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 24,
    padding: 4,
    zIndex: 2,
  },
  skipButton: {
    position: 'absolute',
    right: 24,
    top: 24,
    padding: 10,
    zIndex: 2,
  },
  skipButtonText: {
    color: '#2B2B2B',
    fontSize: 17,
    fontWeight: 'bold',
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 18,
    marginHorizontal: 24,
    backgroundColor: '#FFF',
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  stepBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D6E6F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  stepBoxActive: {
    backgroundColor: '#FECF6A',
  },
  stepBoxDisabled: {
    opacity: 0.5,
  },
  stepNumber: {
    color: '#2B2B2B',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pencilIcon: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [{ translateX: -10 }, { translateY: -10 }],
  },
  stepLine: {
    height: 2,
    backgroundColor: '#D6E6F2',
    flex: 1,
    alignSelf: 'center',
    marginHorizontal: -2,
  },
  title: {
    color: '#2B2B2B',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 18,
    marginHorizontal: 24,
    letterSpacing: 0.5,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 8,
    marginHorizontal: 12,
  },
  card: {
    backgroundColor: '#D6E6F2',
    borderRadius: 12,
    paddingVertical: 14.4,
    paddingHorizontal: 16,
    margin: 8,
    width: '40%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: '#D6F2E6',
    borderColor: '#2B2B2B',
    borderWidth: 1,
  },
  cardText: {
    color: '#2B2B2B',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  inputWrapper: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 24,
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    flex: 1,
    color: '#2B2B2B',
    fontSize: 17,
    fontWeight: 'bold',
    padding: 0,
    minHeight: 48,
  },
  dropdownContainer: {
    marginHorizontal: 24,
    marginVertical: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownText: {
    flex: 1,
    color: '#2B2B2B',
    fontSize: 17,
    fontWeight: 'bold',
  },
  bottomNav: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#2B2B2B',
    borderRadius: 40,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default ProfileSetupScreen;