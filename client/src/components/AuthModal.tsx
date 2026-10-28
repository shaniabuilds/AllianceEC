import React, { useState } from 'react';
import { X, ShieldCheck, Phone, Lock, KeyRound, Upload, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { loginUser, registerUser, verifyOTP } from '../services/authService';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login: contextLogin } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'OTP' | 'KYC'>('LOGIN');

  // Form Fields
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otpVal, setOtpVal] = useState('');

  // UI Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [kycSuccess, setKycSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!mobile) { setErrorMsg('Enter Mobile Number or User ID'); return; }
    if (!password) { setErrorMsg('Enter Password'); return; }

    setIsSubmitting(true);
    const res = await loginUser(mobile, password);
    setIsSubmitting(false);

    if (res.success && res.data) {
      if (res.data.requiresOtp) {
        setSuccessMsg(`Password verified! OTP code: ${res.data.otpSimulated || ''}`);
        setMode('OTP');
      } else if (res.data.user && res.data.token) {
        contextLogin(res.data.user, res.data.token);
        onClose();
      }
    } else {
      setErrorMsg(res.message || 'Login failed. Invalid credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name) { setErrorMsg('Enter Full Name'); return; }
    if (!mobile || mobile.length < 10) { setErrorMsg('Enter valid 10-digit mobile number'); return; }
    if (!password || password.length < 6) { setErrorMsg('Password must be at least 6 characters'); return; }

    setIsSubmitting(true);
    const res = await registerUser({ name, mobile, password, role: 'STUDENT' });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg('OTP sent to your mobile. Please verify below.');
      setMode('OTP');
    } else {
      setErrorMsg(res.message || 'Registration failed.');
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!otpVal || otpVal.length !== 6) { setErrorMsg('Enter 6-digit OTP'); return; }

    setIsSubmitting(true);
    const res = await verifyOTP(mobile, otpVal);
    setIsSubmitting(false);

    if (res.success && res.data) {
      contextLogin(res.data.user, res.data.token);
      setMode('KYC');
    } else {
      setErrorMsg(res.message || 'Invalid OTP code.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '32px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div className="badge badge-primary" style={{ marginBottom: '8px' }}>
              <ShieldCheck size={12} /> AUTHENTICATION MODULE
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800' }}>
              {mode === 'LOGIN' && 'Sign In to EduVerse'}
              {mode === 'REGISTER' && 'Create Free Account'}
              {mode === 'OTP' && 'Verify 6-Digit OTP'}
              {mode === 'KYC' && 'KYC Verification Center'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: 'var(--text-secondary)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Alert Banners */}
        {errorMsg && (
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', color: '#FB7185', fontSize: '0.85rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34D399', fontSize: '0.85rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Mode Switch Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => { setMode('LOGIN'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'LOGIN' ? 'var(--primary-gradient)' : 'transparent',
              color: mode === 'LOGIN' ? '#FFF' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Login
          </button>
          <button
            onClick={() => { setMode('REGISTER'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'REGISTER' ? 'var(--primary-gradient)' : 'transparent',
              color: mode === 'REGISTER' ? '#FFF' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Register
          </button>
          <button
            onClick={() => { setMode('KYC'); setErrorMsg(''); setSuccessMsg(''); }}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              background: mode === 'KYC' ? 'var(--emerald-gradient)' : 'transparent',
              color: mode === 'KYC' ? '#FFF' : 'var(--text-secondary)',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            KYC Upload
          </button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Mobile Number / User ID
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="e.g. 9876543210"
                  style={{ paddingLeft: '44px' }}
                />
                <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password..."
                  style={{ paddingLeft: '44px' }}
                />
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px' }}
            >
              <KeyRound size={18} />
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name..."
                  style={{ paddingLeft: '44px' }}
                />
                <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="10-digit mobile number"
                  style={{ paddingLeft: '44px' }}
                />
                <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                Password (min 6 characters)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set password..."
                  style={{ paddingLeft: '44px' }}
                />
                <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px' }}
            >
              {isSubmitting ? 'Registering...' : 'Register Account'}
            </button>
          </form>
        )}

        {/* OTP FORM */}
        {mode === 'OTP' && (
          <form onSubmit={handleVerifyOtpSubmit} style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px' }}>
              Enter the 6-digit OTP code sent to mobile <strong style={{ color: '#FFF' }}>+91 {mobile}</strong> (Use: <span style={{ color: '#34D399' }}>123456</span>)
            </p>
            <input
              type="text"
              maxLength={6}
              value={otpVal}
              onChange={(e) => setOtpVal(e.target.value)}
              placeholder="123456"
              className="form-input"
              style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: '800', letterSpacing: '8px', marginBottom: '24px' }}
            />

            <button
              type="submit"
              className="btn-emerald"
              disabled={isSubmitting}
              style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
            >
              <CheckCircle2 size={18} />
              {isSubmitting ? 'Verifying...' : 'Confirm OTP & Proceed'}
            </button>
          </form>
        )}

        {/* KYC FORM */}
        {mode === 'KYC' && (
          <div>
            {kycSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(16,185,129,0.1)', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.3)' }}>
                <CheckCircle2 size={48} color="#34D399" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '1.3rem', color: '#34D399', marginBottom: '8px' }}>KYC Document Submitted!</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                  Your document has been sent to Super Admin for verification.
                </p>
                <button className="btn-primary" onClick={onClose}>
                  Close Window
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
                    Document Type
                  </label>
                  <select className="form-input">
                    <option value="AADHAAR">Aadhaar Card (Front & Back)</option>
                    <option value="PAN">PAN Card</option>
                  </select>
                </div>

                <div style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '14px',
                  padding: '24px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  cursor: 'pointer'
                }}>
                  <Upload size={32} color="var(--primary-accent)" style={{ marginBottom: '8px' }} />
                  <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>Upload Document Scan (Max 2MB HD Image)</div>
                </div>

                <button
                  className="btn-emerald"
                  onClick={() => setKycSuccess(true)}
                  style={{ width: '100%', justifyContent: 'center', padding: '14px', marginTop: '8px' }}
                >
                  Submit for Admin KYC Approval
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
