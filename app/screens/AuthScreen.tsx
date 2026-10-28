import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { loginWithCredentials, verifyEmailOtp, registerStudent } from '../services/authService';

export const AuthScreen: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // DUAL THEME SYSTEM: Default Light Mode (false)
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Dynamic Theme Colors
  const colors = {
    bgCanvas: isDarkMode ? '#0F172A' : '#F8FAFC',
    cardBg: isDarkMode ? '#1E293B' : '#FFFFFF',
    cardBorder: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : '#E2E8F0',
    textPrimary: isDarkMode ? '#FFFFFF' : '#0F172A',
    textSecondary: isDarkMode ? '#94A3B8' : '#475569',
    inputBg: isDarkMode ? '#0F172A' : '#F1F5F9',
    inputTextColor: isDarkMode ? '#FFFFFF' : '#0F172A',
    inputBorder: isDarkMode ? 'rgba(148, 163, 184, 0.2)' : '#CBD5E1',
    tabInactiveBg: isDarkMode ? 'rgba(15, 23, 42, 0.6)' : '#F1F5F9',
  };

  // Step state: 1 = Credentials, 2 = 6-Digit Email OTP
  const [step, setStep] = useState<1 | 2>(1);

  // Form Fields
  const [emailOrMobile, setEmailOrMobile] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [stateCode, setStateCode] = useState('GLOBAL');
  const [referredBy, setReferredBy] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Validation Regex
  const mobileRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const otpRegex = /^\d{6}$/;

  // Handle Step 1: Submit Credentials
  const handleCredentialsSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (mode === 'LOGIN') {
      if (!emailOrMobile.trim()) {
        setErrorMsg('Please enter your Mobile Number or Email Address.');
        return;
      }
      if (!password.trim()) {
        setErrorMsg('Please enter your account password.');
        return;
      }

      setLoading(true);
      const res = await loginWithCredentials(emailOrMobile.trim(), password.trim());
      setLoading(false);

      if (res.success && res.data) {
        if (res.data.requiresOtp && res.data.email) {
          setEmail(res.data.email);
          setStep(2);
          setSuccessMsg(`📩 6-Digit OTP sent to ${res.data.email}. Please verify below.`);
        } else if (res.data.token && res.data.user) {
          login(res.data.token, res.data.user);
        }
      } else {
        setErrorMsg(res.message || 'Login failed. Please check credentials.');
      }
    } else {
      // REGISTER
      if (!name.trim() || name.trim().length < 2) {
        setErrorMsg('Please enter a valid Full Name (at least 2 characters).');
        return;
      }
      if (!email.trim() || !emailRegex.test(email.trim())) {
        setErrorMsg('Please enter a valid Email Address (e.g. student@domain.com).');
        return;
      }
      if (!mobile.trim() || !mobileRegex.test(mobile.trim())) {
        setErrorMsg('Please enter a valid 10-digit Mobile Number starting with 6-9.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMsg('Password must be at least 6 characters long.');
        return;
      }

      setLoading(true);
      const res = await registerStudent({
        name: name.trim(),
        email: email.trim(),
        mobile: mobile.trim(),
        password: password.trim(),
        stateCode,
        referredBy: referredBy.trim() || undefined
      });
      setLoading(false);

      if (res.success && res.data) {
        setSuccessMsg(`🎉 Account registered successfully! Logging in...`);
        const loginRes = await loginWithCredentials(email.trim(), password.trim());
        if (loginRes.success && loginRes.data?.token && loginRes.data?.user) {
          login(loginRes.data.token, loginRes.data.user);
        }
      } else {
        setErrorMsg(res.message || 'Registration failed.');
      }
    }
  };

  // Handle Step 2: Verify 6-Digit Email OTP
  const handleVerifyOtpSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    if (!otp.trim() || !otpRegex.test(otp.trim())) {
      setErrorMsg('Please enter the 6-digit numeric OTP code sent to your email.');
      return;
    }

    setLoading(true);
    const res = await verifyEmailOtp(email.trim(), otp.trim());
    setLoading(false);

    if (res.success && res.data?.token && res.data?.user) {
      login(res.data.token, res.data.user);
    } else {
      setErrorMsg(res.message || 'Invalid or expired OTP code.');
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: colors.bgCanvas,
      }}
    >
      {/* Main Login / Register Card */}
      <View
        style={{
          width: '100%',
          maxWidth: 420,
          backgroundColor: colors.cardBg,
          borderRadius: 20,
          padding: 24,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 6,
        }}
      >
        {/* Header & Theme Switcher */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View
            style={{
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: '#6366F1', fontSize: 11, fontWeight: '700' }}>
              🎓 STUDENT LEARNING PORTAL
            </Text>
          </View>

          {/* 1-CLICK LIGHT / DARK THEME TOGGLE */}
          <TouchableOpacity
            onPress={() => setIsDarkMode(!isDarkMode)}
            style={{
              backgroundColor: isDarkMode ? '#334155' : '#E2E8F0',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
            }}
          >
            <Text style={{ color: isDarkMode ? '#FBBF24' : '#0F172A', fontSize: 11, fontWeight: '700' }}>
              {isDarkMode ? '🌙 Dark' : '☀️ Light'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <View
            style={{
              width: 84,
              height: 84,
              borderRadius: 42,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15,
              shadowRadius: 8,
              elevation: 4,
              marginBottom: 12,
              borderWidth: 2,
              borderColor: '#F59E0B',
            }}
          >
            <Image
              source={require('../assets/images/logo.png')}
              style={{ width: 56, height: 56 }}
              resizeMode="contain"
            />
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', letterSpacing: 0.3 }}>
            AllianceEC
          </Text>
          <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
            {step === 1
              ? mode === 'LOGIN'
                ? 'Sign in to access your live courses & practice tests'
                : 'Create a new Student account'
              : 'Verify 6-Digit Email OTP to Unlock Access'}
          </Text>
        </View>

        {/* Success Alert */}
        {!!successMsg && (
          <View
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              borderColor: 'rgba(16, 185, 129, 0.4)',
              borderWidth: 1,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '600' }}>{successMsg}</Text>
          </View>
        )}

        {/* Error Alert */}
        {!!errorMsg && (
          <View
            style={{
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              borderColor: 'rgba(244, 63, 94, 0.4)',
              borderWidth: 1,
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: '#F43F5E', fontSize: 13, fontWeight: '600' }}>{errorMsg}</Text>
          </View>
        )}

        {/* STEP 1: CREDENTIALS */}
        {step === 1 && (
          <View>
            {/* Mode Switcher Tabs */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: colors.tabInactiveBg,
                borderRadius: 12,
                padding: 4,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setMode('LOGIN');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: mode === 'LOGIN' ? '#6366F1' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: mode === 'LOGIN' ? '#FFFFFF' : colors.textSecondary, fontWeight: '700', fontSize: 14 }}>Student Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setMode('REGISTER');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: mode === 'REGISTER' ? '#10B981' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: mode === 'REGISTER' ? '#FFFFFF' : colors.textSecondary, fontWeight: '700', fontSize: 14 }}>New Register</Text>
              </TouchableOpacity>
            </View>

            {mode === 'LOGIN' ? (
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
                  Mobile Number / Email Address *
                </Text>
                <TextInput
                  value={emailOrMobile}
                  onChangeText={setEmailOrMobile}
                  placeholder="e.g. 9876543210 or student@example.com"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: colors.inputTextColor,
                    fontSize: 14,
                    marginBottom: 14,
                  }}
                />

                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
                  Account Password *
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: colors.inputTextColor,
                    fontSize: 14,
                    marginBottom: 20,
                  }}
                />

                <TouchableOpacity
                  onPress={handleCredentialsSubmit}
                  disabled={loading}
                  style={{
                    backgroundColor: '#6366F1',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
                      Sign In to App ➔
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // REGISTER FORM
              <View>
                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
                  Full Name *
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94A3B8"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: colors.inputTextColor,
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                />

                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
                  Email ID (For Account Access) *
                </Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="e.g. student@gmail.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: colors.inputTextColor,
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                />

                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
                  Mobile Number *
                </Text>
                <TextInput
                  value={mobile}
                  onChangeText={setMobile}
                  placeholder="e.g. 9876543210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: colors.inputTextColor,
                    fontSize: 14,
                    marginBottom: 12,
                  }}
                />

                <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 }}>
                  Create Password *
                </Text>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: colors.inputTextColor,
                    fontSize: 14,
                    marginBottom: 16,
                  }}
                />
                <Text style={{ color: '#F59E0B', fontSize: 13, fontWeight: '700', marginBottom: 6 }}>
                  Referral Sponsor Code (Optional)
                </Text>
                <TextInput
                  value={referredBy}
                  onChangeText={setReferredBy}
                  placeholder="e.g. REF-RLMD5 / EDU-99201"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  style={{
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: '#F59E0B',
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    color: '#F59E0B',
                    fontSize: 14,
                    fontWeight: '800',
                    marginBottom: 16,
                  }}
                />

                <TouchableOpacity
                  onPress={handleCredentialsSubmit}
                  disabled={loading}
                  style={{
                    backgroundColor: '#10B981',
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
                      Register Student Account ➔
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
        {step === 2 && (
          <View style={{ alignItems: 'center' }}>
            <View
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                paddingHorizontal: 16,
                paddingVertical: 6,
                borderRadius: 20,
                marginBottom: 12,
              }}
            >
              <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>
                ✉️ STEP 2: EMAIL OTP VERIFICATION
              </Text>
            </View>

            <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 16 }}>
              Enter the 6-digit verification code sent to{'\n'}
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>{email}</Text>
            </Text>

            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="1 2 3 4 5 6"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={6}
              style={{
                backgroundColor: colors.inputBg,
                borderWidth: 2,
                borderColor: '#6366F1',
                borderRadius: 14,
                paddingHorizontal: 20,
                paddingVertical: 14,
                color: '#6366F1',
                fontSize: 24,
                fontWeight: '800',
                letterSpacing: 8,
                textAlign: 'center',
                width: '100%',
                marginBottom: 20,
              }}
            />

            <TouchableOpacity
              onPress={handleVerifyOtpSubmit}
              disabled={loading}
              style={{
                backgroundColor: '#10B981',
                borderRadius: 12,
                paddingVertical: 14,
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15 }}>
                  Verify OTP & Unlock App 🔓
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setStep(1);
                setErrorMsg('');
                setSuccessMsg('');
              }}
            >
              <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '600' }}>
                ← Change Email / Back to Step 1
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};
