import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Lock, Share2, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { registerUser, loginUser } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { INDIAN_STATES_LIST } from '../services/taxonomyTree';

interface ReferralRegisterPageProps {
  initialRefCode?: string;
  onSuccessNavigate?: (role: string) => void;
}

export const ReferralRegisterPage: React.FC<ReferralRegisterPageProps> = ({
  initialRefCode = '',
  onSuccessNavigate
}) => {
  const { user, login: contextLogin, logout } = useAuth();

  // Extract Referral Code from URL if available
  const [sponsorCode, setSponsorCode] = useState<string>('');
  
  // Registration Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [stateCode, setStateCode] = useState('KA');
  const [role] = useState<'STUDENT'>('STUDENT');

  // UI Feedback & Processing State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryRef = urlParams.get('ref') || initialRefCode;
    if (queryRef) {
      setSponsorCode(queryRef.trim().toUpperCase());
    } else {
      setSponsorCode('REF-STUDENT');
    }
  }, [initialRefCode]);

  const handleLogoutAndRegisterNew = () => {
    logout();
    setErrorMsg('');
    setSuccessMsg(`Session logged out! Fill the form below to register a new account under sponsor '${sponsorCode}'.`);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const mobileRegex = /^[6-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg('Please enter a valid Full Name (minimum 2 characters).');
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

    setIsSubmitting(true);
    const res = await registerUser({
      name: name.trim(),
      mobile: mobile.trim(),
      password,
      email: email.trim(),
      role,
      stateCode,
      referredBy: sponsorCode ? sponsorCode.trim() : undefined
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccessMsg(`🎉 Account created successfully under Sponsor ${sponsorCode}! Logging you in...`);
      
      // Auto Login freshly created user
      const loginRes = await loginUser(email.trim(), password);
      if (loginRes.success && loginRes.data && loginRes.data.user && loginRes.data.token) {
        contextLogin(loginRes.data.user, loginRes.data.token);
        if (onSuccessNavigate) {
          onSuccessNavigate(loginRes.data.user.role);
        } else {
          window.location.href = '/';
        }
      } else {
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      }
    } else {
      setErrorMsg(res.message || 'Registration failed. Mobile or Email may already be registered.');
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', padding: '10px 16px 40px 16px' }}>
      {/* Top Referral Invitation Hero Card */}
      <div
        className="glass-card"
        style={{
          padding: '28px',
          borderRadius: '20px',
          marginBottom: '24px',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(245, 158, 11, 0.15) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-amber" style={{ padding: '4px 12px', fontSize: '0.78rem', fontWeight: '800' }}>
                <Share2 size={13} style={{ marginRight: '4px' }} /> EXCLUSIVE REFERRAL INVITATION
              </span>
              <span className="badge badge-emerald" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                <ShieldCheck size={13} style={{ marginRight: '4px' }} /> VERIFIED SPONSOR LINK
              </span>
            </div>
            
            <h1 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '4px 0', letterSpacing: '-0.5px' }}>
              Join EduVerse E-Learning Platform
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '560px', lineHeight: '1.4' }}>
              Register using your sponsor invitation link to access state-wise competitive exam batches, live practice MCQs, and binary affiliate rewards!
            </p>
          </div>

          {/* Glowing Sponsor Badge */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '2px dashed #F59E0B',
              textAlign: 'center',
              minWidth: '200px'
            }}
          >
            <div style={{ fontSize: '0.72rem', color: '#FBBF24', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              INVITATION CODE
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#FFF', letterSpacing: '1px', marginTop: '2px' }}>
              {sponsorCode || 'REF-STUDENT'}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#34D399', fontWeight: '700', marginTop: '4px' }}>
              ✓ Linked to Binary Network
            </div>
          </div>
        </div>
      </div>

      {/* Logged-In User Active Session Banner */}
      {user && (
        <div
          className="glass-card"
          style={{
            padding: '14px 20px',
            borderRadius: '14px',
            marginBottom: '20px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#FBBF24' }}>
            👤 Logged in as <strong>{user.name} ({user.role})</strong>. Creating a new student account below will automatically switch your session.
          </div>
          <button
            className="btn-rose"
            onClick={handleLogoutAndRegisterNew}
            style={{ padding: '5px 12px', fontSize: '0.78rem' }}
          >
            Switch / Clear Current Session
          </button>
        </div>
      )}

      {/* Main Dedicated Registration Card (ALWAYS RENDERED) */}
      <div className="glass-card" style={{ padding: '32px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="var(--primary-accent)" />
              Create Your New Student Account
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
              Fill in your details below to register under sponsor <strong style={{ color: '#FBBF24' }}>{sponsorCode}</strong>.
            </p>
          </div>

          {/* Feedback Alert Banners */}
          {errorMsg && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', color: '#FB7185', fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34D399', fontSize: '0.85rem', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shamshad Verma"
                    required
                    style={{ paddingLeft: '38px', padding: '9px 12px 9px 38px', fontSize: '0.88rem' }}
                  />
                  <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Account Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. student@gmail.com"
                    required
                    style={{ paddingLeft: '38px', padding: '9px 12px 9px 38px', fontSize: '0.88rem' }}
                  />
                  <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  10-Digit Mobile Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9800000000"
                    required
                    style={{ paddingLeft: '38px', padding: '9px 12px 9px 38px', fontSize: '0.88rem' }}
                  />
                  <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Password (min 6 characters) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set password..."
                    required
                    style={{ paddingLeft: '38px', padding: '9px 12px 9px 38px', fontSize: '0.88rem' }}
                  />
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>
                  Target State (Level 1 Preference) *
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    className="form-input"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    style={{ paddingLeft: '38px', padding: '9px 12px 9px 38px', fontSize: '0.88rem' }}
                  >
                    {INDIAN_STATES_LIST.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                  <MapPin size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#FBBF24', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Share2 size={14} /> Sponsor Invitation Code *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={sponsorCode}
                    onChange={(e) => setSponsorCode(e.target.value.toUpperCase())}
                    placeholder="e.g. REF-RLMD5"
                    style={{ paddingLeft: '38px', padding: '9px 12px', fontSize: '0.88rem', color: '#FBBF24', fontWeight: '800' }}
                  />
                  <Share2 size={16} color="#FBBF24" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '8px' }}>
              <button
                type="submit"
                className="btn-emerald"
                disabled={isSubmitting}
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem', fontWeight: '800', borderRadius: '12px' }}
              >
                {isSubmitting ? 'Creating Account...' : `Register & Join Under ${sponsorCode}`}
                {!isSubmitting && <ArrowRight size={18} style={{ marginLeft: '6px' }} />}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <a href="/" style={{ color: '#818CF8', fontWeight: '700', textDecoration: 'none' }}>
              Login via Management Gateway
            </a>
          </div>
        </div>
    </div>
  );
};
