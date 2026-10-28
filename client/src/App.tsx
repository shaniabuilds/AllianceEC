
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LogOut, User, ShieldAlert, GraduationCap, Sun, Moon, Loader2, Share2 } from 'lucide-react';

// React.lazy Dynamic Imports (Code Splitting for Optimal Performance)
const RoleLoginGateway = lazy(() => import('./components/portals/RoleLoginGateway').then(m => ({ default: m.RoleLoginGateway })));
const SuperAdminPortal = lazy(() => import('./components/portals/SuperAdminPortal').then(m => ({ default: m.SuperAdminPortal })));
const TeacherPortal = lazy(() => import('./components/portals/TeacherPortal').then(m => ({ default: m.TeacherPortal })));
const StudentPortal = lazy(() => import('./components/portals/StudentPortal').then(m => ({ default: m.StudentPortal })));
const ReferralRegisterPage = lazy(() => import('./components/ReferralRegisterPage').then(m => ({ default: m.ReferralRegisterPage })));
const ExecutiveMlmNetwork = lazy(() =>
  import('./components/portals/ExecutiveMlmNetwork').then((m: any) => ({
    default: m.ExecutiveMlmNetwork ?? m.default,
  }))
);

type AppRole = 'GUEST' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'EXECUTIVE';

/**
 * Premium Loading Skeleton Fallback Component for Suspense
 */
const PortalLoader: React.FC<{ portalName: string }> = ({ portalName }) => (
  <div
    className="glass-card"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '380px',
      gap: '16px',
      padding: '40px',
      textAlign: 'center',
      borderRadius: '20px',
      border: '1px solid rgba(99, 102, 241, 0.2)',
      background: 'rgba(255, 255, 255, 0.02)'
    }}
  >
    <div
      style={{
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'var(--primary-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFF',
        boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
      }}
    >
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
    </div>
    <div>
      <h3 style={{ fontSize: '1.15rem', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
        Loading {portalName}...
      </h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
        ⚡ Splitting code bundle & loading module on-demand for maximum performance.
      </p>
    </div>
  </div>
);

function AppContent(): React.JSX.Element {
  const { user, logout } = useAuth();

  // Theme State: Default is LIGHT
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Active Role State (Defaults to logged-in user role or GUEST)
  const [currentRole, setCurrentRole] = useState<AppRole>('GUEST');
  const [urlRefCode, setUrlRefCode] = useState<string | null>(null);
  const [isReferralMode, setIsReferralMode] = useState<boolean>(false);

  // Live Express Health API State
  const [backendUptime, setBackendUptime] = useState<string>('Online');
  const [dbStatus, setDbStatus] = useState<string>('CONNECTED');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get('ref');
    const isRegisterPath = window.location.pathname.includes('/register');
    if (refCode || isRegisterPath) {
      if (refCode) setUrlRefCode(refCode.trim());
      setIsReferralMode(true);
    }
  }, []);

  useEffect(() => {
    if (user) {
      setCurrentRole(user.role as AppRole);
    } else {
      setCurrentRole('GUEST');
    }
  }, [user]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/health`);
      const data = await res.json();
      if (data.status === 'OK') {
        setBackendUptime(data.uptime ? `${Math.floor(data.uptime)}s` : 'Online');
        setDbStatus(data.database === 'CONNECTED' ? 'MongoDB Atlas (Connected)' : 'Disconnected');
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentRole('GUEST');
  };

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'ADMIN':
        return (
          <span className="badge badge-rose" style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '0.82rem' }}>
            <ShieldAlert size={14} /> SUPER ADMIN PORTAL
          </span>
        );
      case 'TEACHER':
        return (
          <span className="badge badge-emerald" style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '0.82rem' }}>
            <GraduationCap size={14} /> TEACHER & EDUCATOR
          </span>
        );
      case 'STUDENT':
        return (
          <span className="badge badge-primary" style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '0.82rem' }}>
            <User size={14} /> STUDENT LEARNER
          </span>
        );
      case 'EXECUTIVE':
        return (
          <span className="badge badge-amber" style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '0.82rem' }}>
            <Share2 size={14} /> EXECUTIVE PORTAL
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Main Brand Navigation Bar */}
      <header style={{
        background: 'var(--bg-header)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
              padding: '3px',
              border: '1.5px solid #F59E0B'
            }}>
              <img src="/logo.png" alt="AllianceEC" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>

            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '0' }}>
                <span>Alliance</span>
                <span style={{ color: '#F59E0B' }}>EC</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Official E-Learning Platform
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Theme Toggle Button */}
            <button
              className="btn-secondary"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Toggle Light / Dark Theme"
            >
              {theme === 'dark' ? <Sun size={15} color="#FBBF24" /> : <Moon size={15} color="#818CF8" />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {currentRole !== 'GUEST' && (
              <>
                {getRoleBadge()}

                {/* Switch Role / Logout */}
                <button
                  className="btn-secondary"
                  onClick={handleLogout}
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  <LogOut size={16} /> Logout ({user?.name || currentRole})
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area: Render Current Portal with Suspense boundary for Lazy Loading */}
      <main style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '32px 24px' }}>
        {isReferralMode ? (
          <Suspense fallback={<PortalLoader portalName="Sponsor Registration Landing" />}>
            <ReferralRegisterPage
              initialRefCode={urlRefCode || ''}
              onSuccessNavigate={(registeredRole) => {
                setIsReferralMode(false);
                setCurrentRole(registeredRole as AppRole);
              }}
            />
          </Suspense>
        ) : (
          <>
            {currentRole === 'GUEST' && (
              <Suspense fallback={<PortalLoader portalName="Login Gateway" />}>
                <RoleLoginGateway onSelectRole={(role) => setCurrentRole(role)} />
              </Suspense>
            )}

            {currentRole === 'ADMIN' && (
              <Suspense fallback={<PortalLoader portalName="Super Admin Portal" />}>
                <SuperAdminPortal
                  onCheckBackendHealth={checkHealth}
                  backendUptime={backendUptime}
                  dbStatus={dbStatus}
                />
              </Suspense>
            )}

            {currentRole === 'TEACHER' && (
              <Suspense fallback={<PortalLoader portalName="Teacher & Educator Portal" />}>
                <TeacherPortal />
              </Suspense>
            )}

            {currentRole === 'STUDENT' && (
              <Suspense fallback={<PortalLoader portalName="Student Learning Portal" />}>
                <StudentPortal />
              </Suspense>
            )}

            {currentRole === 'EXECUTIVE' && (
              <Suspense fallback={<PortalLoader portalName="Executive Portal" />}>
                <ExecutiveMlmNetwork />
              </Suspense>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '24px',
        textAlign: 'center',
        background: 'rgba(9, 13, 22, 0.9)',
        color: 'var(--text-muted)',
        fontSize: '0.88rem'
      }}>
        <div>
          AllianceEC• Enterprise E-Learning Platform (Super Admin | Teacher | Student | Executive)
        </div>
      </footer>
    </div>
  );
}

export function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;