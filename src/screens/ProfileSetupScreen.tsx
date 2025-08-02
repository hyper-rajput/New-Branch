import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { saveUserDetails } from "../services/api";

type CustomDropdownProps = {
  label: string;
  value: string | string[];
  options: string[];
  onSelect: (val: any) => void;
  multiSelect?: boolean;
};

const CustomDropdown: React.FC<CustomDropdownProps> = ({ label, value, options, onSelect, multiSelect = false }) => {
  const [visible, setVisible] = useState(false);

  const isSelected = (option: string) => multiSelect && Array.isArray(value) && value.includes(option);

  return (
    <>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => {
          Keyboard.dismiss();
          setVisible(true);
        }}
      >
        <Text>{label}</Text>
        {/* Add dropdown content here based on visibility state */}
        {visible && (
          <View>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  onSelect(option);
                  setVisible(false);
                }}
              >
                <Text>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    </>
  );
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
  },
  {
    key: 'name',
    label: 'My name is...',
    required: true,
    input: true,
    placeholder: 'Enter your name',
  },
  {
    key: 'phone',
    label: 'My phone number is...',
    required: true,
    input: true,
    placeholder: 'Enter your 10-digit phone number',
    keyboardType: 'phone-pad',
    phoneValidation: true,
  },
  {
    key: 'bloodGroup',
    label: 'My blood group is...',
    required: true,
    options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  },
  {
    key: 'height',
    label: 'My height is...',
    required: true,
    heightUnit: true,
  },
  {
    key: 'weight',
    label: 'My weight is...',
    required: true,
    input: true,
    placeholder: 'Enter your weight',
    keyboardType: 'numeric',
    showUnit: 'kg',
  },
  {
    key: 'foodPreference',
    label: 'My food preference is...',
    required: true,
    options: [
      'Vegetarian',
      'Non-Vegetarian',
      'Eggitarian',
      'Vegan',
      'Jain',
      'Sattvic',
      'Pescatarian',
      'Lacto-Vegetarian',
      'Ovo-Vegetarian',
      'Other',
    ],
  },
  {
    key: 'interests',
    label: 'My interests are...',
    required: false,
    multiSelect: true,
    options: ['Music', 'Reading', 'Travel', 'Sports', 'Gardening', 'Cooking', 'Other'],
    showOtherInput: true,
  },
  {
    key: 'allergy',
    label: 'I have allergies to...',
    required: false,
    multiSelect: true,
    options: ['None', 'Pollen', 'Dust', 'Food', 'Medicine', 'Latex', 'Insect bites', 'Pet dander', 'Mold', 'Other'],
    showOtherInput: true,
  },
  {
    key: 'medicalCondition',
    label: 'I have these medical conditions...',
    required: false,
    multiSelect: true,
    options: ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'Arthritis', 'Thyroid', 'None', 'Other'],
    showOtherInput: true,
  },
  {
    key: 'medHistDuration',
    label: 'How long have you had your main condition?',
    required: false,
    input: true,
    placeholder: 'e.g. 5 years',
  },
  {
    key: 'medHistMedication',
    label: 'Are you on regular medication?',
    required: false,
    options: ['Yes', 'No'],
  },
  {
    key: 'medHistHospital',
    label: 'Any recent hospitalizations?',
    required: false,
    options: ['Yes', 'No'],
  },
];

// Rest of your ProfileSetupScreen component remains the same

const ProfileSetupScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  // Height step state
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<{ [key: string]: string | string[] }>({});
  const [saving, setSaving] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;
  const value = form[current.key] ?? (current.multiSelect ? [] : '');

  const canGoNext = current.required
    ? (Array.isArray(value) ? value.length > 0 : !!(value && (value as string).trim()))
    : true;

  const handleNext = async () => {
    if (!canGoNext) return;
    if (isLast) {
      setSaving(true);
      try {
        await saveUserDetails(form);
        Alert.alert('Success', 'Your profile has been saved!', [
          { text: 'OK', onPress: () => navigation.replace('Dashboard') },
        ]);
      } catch (e: any) {
        Alert.alert('Error', e?.message || 'Could not save profile.');
      } finally {
        setSaving(false);
      }
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) setStep((s) => s - 1);
    else navigation.goBack();
  };

  const handleSelect = (option: string | string[]) => {
    setForm((f) => ({ ...f, [current.key]: option }));
  };

  const handleInput = (text: string) => {
    setForm((f) => ({ ...f, [current.key]: text }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={28} color="#f6f4e9" />
        </TouchableOpacity>
        <Text style={styles.welcome}>Welcome to Lumia</Text>
        <TouchableOpacity style={styles.skipButton} onPress={() => navigation.replace('Dashboard')}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
  
      <View style={styles.stepperContainer}>
        {steps.map((s, idx) => (
          <React.Fragment key={s.key}>
            <View style={[styles.stepCircle, idx <= step && styles.stepCircleActive]} />
            {idx < steps.length - 1 && <View style={styles.stepLine} />}
          </React.Fragment>
        ))}
      </View>
      <Text style={styles.title}>{current.label}</Text>
      {/* Input rendering logic */}
      {current.input && !current.heightUnit ? (
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder={current.placeholder}
            value={typeof value === 'string' ? value : ''}
            onChangeText={text => {
              // Phone validation
              if (current.phoneValidation) {
                if (!/^\d{0,10}$/.test(text)) return;
              }
              // Weight validation
              if (current.key === 'weight' && !/^\d{0,3}$/.test(text)) return;
              handleInput(text);
            }}
            keyboardType={current.keyboardType as any || 'default'}
            autoFocus
            placeholderTextColor="#b2d8df"
            multiline={!!(current as any).multiline}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          {/* Show unit for weight */}
          {current.showUnit && (
            <Text style={styles.unitLabel}>{current.showUnit}</Text>
          )}
        </View>
      ) : current.heightUnit ? (
        <>
          <View style={styles.inputWrapper}>
            <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
              <TouchableOpacity
                style={[styles.unitSwitch, heightUnit === 'cm' && styles.unitSwitchActive]}
                onPress={() => setHeightUnit('cm')}
              >
                <Text style={styles.unitSwitchText}>cm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitSwitch, heightUnit === 'ft' && styles.unitSwitchActive]}
                onPress={() => setHeightUnit('ft')}
              >
                <Text style={styles.unitSwitchText}>ft/in</Text>
              </TouchableOpacity>
            </View>
          </View>
          {heightUnit === 'cm' ? (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter height"
                value={heightCm}
                onChangeText={text => {
                  if (!/^\d{0,3}$/.test(text)) return;
                  setHeightCm(text);
                  handleInput(text ? text + 'cm' : '');
                }}
                keyboardType="numeric"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholderTextColor="#b2d8df"
              />
              <Text style={styles.unitLabel}>cm</Text>
            </View>
          ) : (
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                
                value={heightFt}
                onChangeText={text => {
                  if (!/^\d{0,2}$/.test(text)) return;
                  setHeightFt(text);
                  handleInput(text && heightIn ? `${text}ft ${heightIn}in` : text ? `${text}ft` : heightIn ? `${heightIn}in` : '');
                }}
                keyboardType="numeric"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholderTextColor="#b2d8df"
              />
              <Text style={styles.unitLabel}>feet</Text>
              <TextInput
                style={[styles.input, { marginLeft: 8 }]}
                
                value={heightIn}
                onChangeText={text => {
                  if (!/^\d{0,2}$/.test(text)) return;
                  setHeightIn(text);
                  handleInput(heightFt && text ? `${heightFt}ft ${text}in` : heightFt ? `${heightFt}ft` : text ? `${text}in` : '');
                }}
                keyboardType="numeric"
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholderTextColor="#b2d8df"
              />
              <Text style={styles.unitLabel}>inches</Text>
            </View>
          )}
        </>
      ) : current.multiSelect ? (
        <View style={styles.optionsWrapper}>
          {current.options?.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, Array.isArray(value) && value.includes(option) && styles.optionButtonActive]}
              onPress={() => {
                let arr = Array.isArray(value) ? [...value] : [];
                if (arr.includes(option)) {
                  arr = arr.filter((v) => v !== option);
                } else {
                  arr.push(option);
                }
                handleSelect(arr);
              }}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionText, Array.isArray(value) && value.includes(option) && styles.optionTextActive]}>{option}</Text>
            </TouchableOpacity>
          ))}
          {/* Show text input for 'Other' if selected and showOtherInput is true */}
          {current.showOtherInput && Array.isArray(value) && value.includes('Other') && (
            <TextInput
              style={styles.input}
              placeholder={`Please specify your ${current.key}`}
              value={form[`${current.key}Other`] as string || ''}
              onChangeText={text => setForm(f => ({ ...f, [`${current.key}Other`]: text }))}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholderTextColor="#b2d8df"
            />
          )}
        </View>
      ) : (
        <View style={styles.optionsWrapper}>
          {current.options?.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.optionButton, value === option && styles.optionButtonActive]}
              onPress={() => handleSelect(option)}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionText, value === option && styles.optionTextActive]}>{option}</Text>
            </TouchableOpacity>
          ))}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // ...existing code...
  // ...existing code...
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 0,
    position: 'relative',
    minHeight: 40,
  },
  welcome: {
    color: '#f6f4e9',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    flex: 1,
    marginLeft: -28,
    letterSpacing: 0.5,
  },
  container: {
    flex: 1,
    backgroundColor: '#003512',
    paddingTop: 24,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  stepCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#b2d8df',
    marginHorizontal: 4,
    zIndex: 2,
  },
  stepCircleActive: {
    backgroundColor: 'white',
    borderColor: '#003512',
    borderWidth: 2,
  },
  stepLine: {
    height: 2,
    backgroundColor: '#b2d8df',
    flex: 1,
    alignSelf: 'center',
    marginHorizontal: -2,
    zIndex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginVertical: 12,
    marginHorizontal: 24,
    borderWidth: 1.5,
    borderColor: '#b2d8df',
  },
  input: {
    flex: 1,
    color: '#f6f4e9',
    fontSize: 20,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 0,
    minHeight: 48,
    fontWeight: '400',
  },
  unitLabel: {
    color: '#b2d8df',
    fontSize: 18,
    marginLeft: 8,
    marginRight: 8,
    fontWeight: '500',
  },
  unitSwitch: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: '#00e95c',
    marginHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#00e95c',
  },
  unitSwitchActive: {
    backgroundColor: 'white',
    borderColor: '#003512',
  },
  unitSwitchText: {
    color: '#262626',
    fontSize: 18,
    fontWeight: '700',
  },
  unitSwitchTextActive: {
    color: '#003512',
    fontSize: 18,
    fontWeight: '700',
  },
  backButton: {
    marginRight: 8,
    backgroundColor: 'transparent',
    padding: 4,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 2,
  },
  nextButton: {
    backgroundColor: '#d2fa52',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 100,
    alignItems: 'center',
    marginTop: 8,
  },
  nextButtonDisabled: {
    backgroundColor: 'white',
  },
  nextButtonText: {
    color: '#003512',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dropdown: {
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#b2d8df',
    borderRadius: 10,
    backgroundColor: 'transparent',
    color: '#f6f4e9',
    fontSize: 18,
  },
  optionsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 16,
    marginHorizontal: 12,
  },
  optionButton: {
    backgroundColor: '#00e95c',
    borderRadius: 23,
    paddingVertical: 12,
    paddingHorizontal: 28,
    margin: 8,
    borderWidth: 1.5,
    borderColor: '#00e95c',
    minWidth: 120,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionButtonActive: {
    backgroundColor: 'white',
    borderColor: '#003512',
    color: 'black',
  },
  optionText: {
    color: '#262626',
    fontSize: 20,
    fontWeight: '500',
  },
  optionTextActive: {
    color: 'black',
    fontWeight: '700',
  },
  title: {
    color: '#f6f4e9',
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 18,
    marginHorizontal: 16,
    letterSpacing: 0.5,
  },
  bottomNav: {
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  skipButton: {
    position: 'absolute',
    right: 10,
    top: 0,
    padding: 10,
    zIndex: 2,
  },
  skipButtonText: {
    color: '#d2fa52',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default ProfileSetupScreen;