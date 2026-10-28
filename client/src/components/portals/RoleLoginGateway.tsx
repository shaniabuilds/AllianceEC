
import React, { useEffect, useState } from "react";

import {
  ShieldAlert,
  GraduationCap,
  Share2,
  Lock,
  Mail,
  Phone,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  BriefcaseBusiness,
} from "lucide-react";

import {
  loginUser,
  registerUser,
  verifyEmailOTP,
  getExecutiveRegistrationStatus,
  registerExecutive,
} from "../../services/authService";

import { useAuth } from "../../context/AuthContext";

type PortalRole = "ADMIN" | "TEACHER" | "STUDENT" | "EXECUTIVE";
type GatewayMode = "LOGIN" | "REGISTER" | "EMAIL_OTP";

interface RoleLoginGatewayProps {
  onSelectRole: (role: PortalRole) => void;
}

export const RoleLoginGateway: React.FC<RoleLoginGatewayProps> = ({
  onSelectRole,
}) => {
  const { login: contextLogin } = useAuth();

  const [mode, setMode] = useState<GatewayMode>("LOGIN");
  const [selectedRoleTab, setSelectedRoleTab] = useState<PortalRole>("ADMIN");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [simulatedOtpText, setSimulatedOtpText] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [setupCode, setSetupCode] = useState("");

  const [executiveRegistrationAllowed, setExecutiveRegistrationAllowed] =
    useState<boolean | null>(null);
  const [isCheckingExecutiveStatus, setIsCheckingExecutiveStatus] =
    useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExecutiveRegistrationStatus = async () => {
    setIsCheckingExecutiveStatus(true);

    try {
      const res = await getExecutiveRegistrationStatus();

      if (res.success && res.data) {
        const allowed = res.data.registrationAllowed === true;

        setExecutiveRegistrationAllowed(allowed);

        if (!allowed) {
          setMode("LOGIN");
          setSetupCode("");
        }
      } else {
        setExecutiveRegistrationAllowed(null);
      }
    } catch {
      setExecutiveRegistrationAllowed(null);
    } finally {
      setIsCheckingExecutiveStatus(false);
    }
  };

  useEffect(() => {
    if (selectedRoleTab === "EXECUTIVE") {
      void fetchExecutiveRegistrationStatus();
    }
  }, [selectedRoleTab]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const refCode = urlParams.get("ref");

    if (refCode) {
      setReferredBy(refCode.trim());
      setMode("REGISTER");
      setSelectedRoleTab("STUDENT");
      setSuccessMsg(
        `Referral link received! Registering a new Student account under sponsor '${refCode.trim()}'.`,
      );
    }
  }, []);

  const handleRoleTabChange = (role: PortalRole) => {
    setSelectedRoleTab(role);
    setErrorMsg("");
    setSuccessMsg("");
    setIdentifier("");
    setPassword("");
    setEmail("");
    setMobile("");
    setName("");
    setSetupCode("");

    if (role === "EXECUTIVE") {
      setMode("LOGIN");
    } else if (mode === "EMAIL_OTP") {
      setMode("LOGIN");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!identifier.trim()) {
      setErrorMsg("Please enter your account email address.");
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await loginUser(identifier.trim(), password);

      if (res.success && res.data) {
        if (res.data.requiresOtp) {
          setEmail(res.data.email || identifier.trim());
          setSimulatedOtpText(res.data.otpSimulated || "");
          setEmailOtp(res.data.otpSimulated || "");
          setSuccessMsg(
            `Password verified! 6-digit OTP sent to ${res.data.email || identifier.trim()}.`,
          );
          setMode("EMAIL_OTP");
          return;
        }

        if (res.data.user && res.data.token) {
          const userRole = res.data.user.role as PortalRole;

          if (userRole !== selectedRoleTab) {
            setErrorMsg(
              `Access denied. Your account role is ${userRole}. Please select the ${userRole} portal.`,
            );
            return;
          }

          contextLogin(res.data.user, res.data.token);
          onSelectRole(userRole);
        } else {
          setErrorMsg("Login response is incomplete. Please try again.");
        }
      } else {
        setErrorMsg(res.message || "Invalid email or password.");
      }
    } catch {
      setErrorMsg("Unable to log in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyEmailOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!emailOtp.trim() || !/^\d{6}$/.test(emailOtp.trim())) {
      setErrorMsg("Please enter the 6-digit email OTP code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await verifyEmailOTP(email, emailOtp.trim());

      if (res.success && res.data) {
        const { user, token } = res.data;
        const userRole = user.role as PortalRole;

        if (userRole !== selectedRoleTab) {
          setErrorMsg(
            `Access denied. Your account role is ${userRole}. Please select the ${userRole} portal.`,
          );
          return;
        }

        contextLogin(user, token);
        setSuccessMsg(`Email OTP verified! Welcome back, ${user.name}.`);
        onSelectRole(userRole);
      } else {
        setErrorMsg(res.message || "Invalid email OTP code.");
      }
    } catch {
      setErrorMsg("Unable to verify OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const mobileRegex = /^[6-9]\d{9}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      selectedRoleTab === "EXECUTIVE" &&
      executiveRegistrationAllowed !== true
    ) {
      setErrorMsg(
        "Executive registration is unavailable. Please refresh the page or log in if your account already exists.",
      );
      return;
    }

    if (!name.trim() || name.trim().length < 2) {
      setErrorMsg("Please enter a valid full name (minimum 2 characters).");
      return;
    }

    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!mobile.trim() || !mobileRegex.test(mobile.trim())) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (selectedRoleTab === "EXECUTIVE" && !setupCode.trim()) {
      setErrorMsg("Please enter the Executive setup code.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedRoleTab === "EXECUTIVE") {
        const res = await registerExecutive({
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          password,
          setupCode: setupCode.trim(),
        });

        if (res.success) {
          setMode("LOGIN");
          setIdentifier(email.trim());
          setPassword("");
          setSetupCode("");
          setName("");
          setMobile("");
          setEmail("");
          setExecutiveRegistrationAllowed(false);
          setSuccessMsg(
            res.message ||
              "Executive account registered successfully. Please log in.",
          );

          await fetchExecutiveRegistrationStatus();
          return;
        }

        setErrorMsg(
          res.message || "Executive registration failed. Please try again.",
        );

        setErrorMsg(
          res.message || "Executive registration failed. Please try again.",
        );

        await fetchExecutiveRegistrationStatus();

        return;
      }

      const res = await registerUser({
        name: name.trim(),
        mobile: mobile.trim(),
        password,
        email: email.trim(),
        role: selectedRoleTab,
        referredBy: referredBy ? referredBy.trim() : undefined,
      });

      if (res.success) {
        setSuccessMsg(
          `Account registered successfully as ${selectedRoleTab}! Logging in...`,
        );

        const loginRes = await loginUser(email.trim(), password);

        if (loginRes.success && loginRes.data?.user && loginRes.data?.token) {
          const userRole = loginRes.data.user.role as PortalRole;

          if (userRole !== selectedRoleTab) {
            setErrorMsg(
              `Account created, but the returned role (${userRole}) does not match the selected portal.`,
            );
            return;
          }

          contextLogin(loginRes.data.user, loginRes.data.token);
          onSelectRole(userRole);
        } else {
          setMode("LOGIN");
          setIdentifier(email.trim());
          setSuccessMsg(
            "Account created. Please log in using your email and password.",
          );
        }
      } else {
        setErrorMsg(
          res.message ||
            "Registration failed. The email or mobile number may already exist.",
        );
      }
    } catch {
      setErrorMsg(
        selectedRoleTab === "EXECUTIVE"
          ? "Unable to register Executive right now. Check the setup code and try again."
          : "Unable to register right now. Please try again.",
      );

      if (selectedRoleTab === "EXECUTIVE") {
        await fetchExecutiveRegistrationStatus();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleCards: {
    role: PortalRole;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    background: string;
  }[] = [
    {
      role: "STUDENT",
      title: "1. Student",
      description: "Courses, MCQs & Practice Tests",
      icon: <GraduationCap size={20} />,
      color: "var(--primary-accent)",
      background: "rgba(99,102,241,0.12)",
    },
    {
      role: "TEACHER",
      title: "2. Teacher",
      description: "Course Builder & Bulk MCQs",
      icon: <GraduationCap size={20} />,
      color: "#34D399",
      background: "rgba(16,185,129,0.12)",
    },
    {
      role: "ADMIN",
      title: "3. Super Admin",
      description: "KYC, Approvals & Platform Control",
      icon: <ShieldAlert size={20} />,
      color: "#FB7185",
      background: "rgba(244,63,94,0.12)",
    },
    {
      role: "EXECUTIVE",
      title: "4. Executive",
      description: "MLM Network & Referrals",
      icon: <BriefcaseBusiness size={20} />,
      color: "#FBBF24",
      background: "rgba(251,191,36,0.12)",
    },
  ];

  const showExecutiveRegister =
    selectedRoleTab === "EXECUTIVE" && executiveRegistrationAllowed === true;

  const showRegisterButton =
    selectedRoleTab !== "EXECUTIVE" || showExecutiveRegister;

  return (
    <div style={{ maxWidth: "940px", margin: "16px auto", padding: "0 16px" }}>
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "32px",
            background: "#FFFFFF",
            margin: "0 auto 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
            padding: "6px",
            border: "2px solid #F59E0B",
          }}
        >
          <img
            src="/logo.png"
            alt="AllianceEC"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        </div>

        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: "800",
            marginBottom: "4px",
            letterSpacing: "-0.3px",
          }}
        >
          AllianceEC {" "}
          <span className="gradient-text">Management Portals</span>
        </h1>

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "0.88rem",
            maxWidth: "650px",
            margin: "0 auto",
          }}
        >
          Strict Role-Based Access Control (RBAC). Select your registered portal
          role below.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        {roleCards.map((card) => (
          <div
            key={card.role}
            role="button"
            tabIndex={0}
            onClick={() => handleRoleTabChange(card.role)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleRoleTabChange(card.role);
              }
            }}
            className="glass-card glass-card-interactive"
            style={{
              padding: "16px",
              border:
                selectedRoleTab === card.role
                  ? `2px solid ${card.color}`
                  : "1px solid var(--border-color)",
              background:
                selectedRoleTab === card.role
                  ? card.background
                  : "var(--bg-card)",
              textAlign: "center",
              borderRadius: "14px",
              cursor: "pointer",
              outline: "none",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: card.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 10px",
                color: "#FFF",
              }}
            >
              {card.icon}
            </div>

            <h3
              style={{
                fontSize: "1rem",
                fontWeight: "800",
                marginBottom: "4px",
              }}
            >
              {card.title}
            </h3>

            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                margin: 0,
                lineHeight: 1.3,
              }}
            >
              {card.description}
            </p>
          </div>
        ))}
      </div>

      <div
        className="glass-card"
        style={{
          maxWidth: "420px",
          margin: "0 auto",
          padding: "20px 24px",
          borderRadius: "16px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: "800" }}>
            {mode === "LOGIN" && `${selectedRoleTab} Account Login`}
            {mode === "EMAIL_OTP" && "Enter Email OTP Code"}
            {mode === "REGISTER" && `Create New ${selectedRoleTab}`}
          </h2>
        </div>

        {selectedRoleTab === "EXECUTIVE" && isCheckingExecutiveStatus && (
          <p
            role="status"
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: "0.85rem",
              marginBottom: "12px",
            }}
          >
            Checking Executive registration status...
          </p>
        )}

        {selectedRoleTab === "EXECUTIVE" &&
          !isCheckingExecutiveStatus &&
          executiveRegistrationAllowed === null && (
            <div
              role="alert"
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                background: "rgba(244,63,94,0.12)",
                border: "1px solid rgba(244,63,94,0.35)",
                color: "#FB7185",
                fontSize: "0.8rem",
                marginBottom: "12px",
              }}
            >
              Could not check Executive registration status.
              <button
                type="button"
                onClick={() => void fetchExecutiveRegistrationStatus()}
                style={{
                  display: "block",
                  marginTop: "8px",
                  padding: 0,
                  background: "transparent",
                  border: "none",
                  color: "inherit",
                  fontWeight: "700",
                  textDecoration: "underline",
                  cursor: "pointer",
                }}
              >
                Try again
              </button>
            </div>
          )}

        {mode !== "EMAIL_OTP" && (
          <div
            style={{
              display: "flex",
              gap: "6px",
              marginBottom: "16px",
              background: "rgba(255,255,255,0.03)",
              padding: "3px",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode("LOGIN");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              style={{
                flex: 1,
                padding: "7px 12px",
                borderRadius: "7px",
                border: "none",
                background:
                  mode === "LOGIN" ? "var(--primary-gradient)" : "transparent",
                color: mode === "LOGIN" ? "#FFF" : "var(--text-secondary)",
                fontWeight: "700",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              Email Login
            </button>

            {showRegisterButton && (
              <button
                type="button"
                disabled={
                  isCheckingExecutiveStatus ||
                  (selectedRoleTab === "EXECUTIVE" &&
                    executiveRegistrationAllowed !== true)
                }
                onClick={() => {
                  setMode("REGISTER");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                style={{
                  flex: 1,
                  padding: "7px 12px",
                  borderRadius: "7px",
                  border: "none",
                  background:
                    mode === "REGISTER"
                      ? "var(--primary-gradient)"
                      : "transparent",
                  color: mode === "REGISTER" ? "#FFF" : "var(--text-secondary)",
                  fontWeight: "700",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  opacity: isCheckingExecutiveStatus ? 0.5 : 1,
                }}
              >
                Register Account
              </button>
            )}
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              background: "rgba(244,63,94,0.15)",
              border: "1px solid rgba(244,63,94,0.4)",
              color: "#FB7185",
              fontSize: "0.8rem",
              fontWeight: "600",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div
            role="status"
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              background: "rgba(16,185,129,0.15)",
              border: "1px solid rgba(16,185,129,0.4)",
              color: "#34D399",
              fontSize: "0.8rem",
              fontWeight: "600",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <CheckCircle2 size={14} />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === "LOGIN" && (
          <form
            onSubmit={handleLoginSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                {selectedRoleTab} Email Address
              </label>

              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={`Enter ${selectedRoleTab.toLowerCase()} email...`}
                  style={{
                    padding: "8px 12px 8px 38px",
                    fontSize: "0.88rem",
                  }}
                />
                <Mail
                  size={16}
                  color="var(--text-muted)"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "10px",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  color: "var(--text-secondary)",
                  marginBottom: "4px",
                  display: "block",
                }}
              >
                Password
              </label>

              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  style={{
                    padding: "8px 12px 8px 38px",
                    fontSize: "0.88rem",
                  }}
                />
                <Lock
                  size={16}
                  color="var(--text-muted)"
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "10px",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "10px",
                fontSize: "0.9rem",
                marginTop: "4px",
              }}
            >
              <KeyRound size={16} />
              {isSubmitting
                ? "Authenticating..."
                : `Login as ${selectedRoleTab}`}
            </button>
          </form>
        )}

        {mode === "EMAIL_OTP" && (
          <form
            onSubmit={handleVerifyEmailOtpSubmit}
            style={{ textAlign: "center", padding: "4px 0" }}
          >
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                marginBottom: "12px",
              }}
            >
              OTP sent to <strong style={{ color: "#FFF" }}>{email}</strong>
            </p>

            {simulatedOtpText && (
              <div
                style={{
                  background: "rgba(52, 211, 153, 0.1)",
                  border: "1px dashed #34D399",
                  borderRadius: "8px",
                  padding: "8px",
                  marginBottom: "14px",
                  color: "#34D399",
                  fontSize: "0.82rem",
                  fontWeight: "700",
                }}
              >
                Email OTP Code:{" "}
                <strong style={{ letterSpacing: "4px", fontSize: "1rem" }}>
                  {simulatedOtpText}
                </strong>
              </div>
            )}

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  color: "var(--text-secondary)",
                  marginBottom: "6px",
                  display: "block",
                }}
              >
                Enter 6-Digit Email OTP
              </label>

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={emailOtp}
                onChange={(e) =>
                  setEmailOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="form-input"
                style={{
                  textAlign: "center",
                  fontSize: "1.4rem",
                  fontWeight: "800",
                  letterSpacing: "6px",
                  padding: "8px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setMode("LOGIN");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                style={{
                  flex: 1,
                  padding: "9px",
                  fontSize: "0.82rem",
                }}
              >
                Back
              </button>

              <button
                type="submit"
                className="btn-emerald"
                disabled={isSubmitting}
                style={{
                  flex: 2,
                  justifyContent: "center",
                  padding: "9px",
                  fontSize: "0.85rem",
                }}
              >
                <CheckCircle2 size={16} />
                {isSubmitting ? "Verifying..." : "Verify OTP & Enter"}
              </button>
            </div>
          </form>
        )}

        {mode === "REGISTER" && (
          <form
            onSubmit={handleRegisterSubmit}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  color: "var(--text-secondary)",
                  marginBottom: "3px",
                  display: "block",
                }}
              >
                Full Name
              </label>
              <input
                type="text"
                required
                minLength={2}
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                style={{ padding: "7px 10px", fontSize: "0.85rem" }}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  color: "var(--text-secondary)",
                  marginBottom: "3px",
                  display: "block",
                }}
              >
                Account Email Address
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  style={{
                    padding: "7px 10px 7px 36px",
                    fontSize: "0.85rem",
                  }}
                />
                <Mail
                  size={16}
                  color="var(--text-muted)"
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "9px",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  color: "var(--text-secondary)",
                  marginBottom: "3px",
                  display: "block",
                }}
              >
                10-Digit Mobile Number
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="tel"
                  required
                  pattern="[6-9][0-9]{9}"
                  maxLength={10}
                  className="form-input"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="9900000000"
                  style={{
                    padding: "7px 10px 7px 36px",
                    fontSize: "0.85rem",
                  }}
                />
                <Phone
                  size={16}
                  color="var(--text-muted)"
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "9px",
                  }}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  color: "var(--text-secondary)",
                  marginBottom: "3px",
                  display: "block",
                }}
              >
                Password (minimum 6 characters)
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set password"
                  style={{
                    padding: "7px 10px 7px 36px",
                    fontSize: "0.85rem",
                  }}
                />
                <Lock
                  size={16}
                  color="var(--text-muted)"
                  style={{
                    position: "absolute",
                    left: "10px",
                    top: "9px",
                  }}
                />
              </div>
            </div>

            {selectedRoleTab === "EXECUTIVE" ? (
              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "#FBBF24",
                    marginBottom: "3px",
                    display: "block",
                  }}
                >
                  Executive Setup Code
                </label>
                <input
                  type="password"
                  required
                  autoComplete="off"
                  className="form-input"
                  value={setupCode}
                  onChange={(e) => setSetupCode(e.target.value)}
                  placeholder="Enter setup code"
                  style={{
                    padding: "7px 10px",
                    fontSize: "0.85rem",
                  }}
                />
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.72rem",
                    marginTop: "5px",
                  }}
                >
                  Use the setup code provided by your administrator.
                </p>
              </div>
            ) : (
              <div>
                <label
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    color: "#FBBF24",
                    marginBottom: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Share2 size={13} />
                  Referral Sponsor Code (Optional)
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    className="form-input"
                    value={referredBy}
                    onChange={(e) => setReferredBy(e.target.value)}
                    placeholder="REF-XXXXX / EDU-12345"
                    style={{
                      padding: "7px 10px 7px 36px",
                      fontSize: "0.85rem",
                      color: "#FBBF24",
                      fontWeight: "700",
                    }}
                  />
                  <Share2
                    size={16}
                    color="#FBBF24"
                    style={{
                      position: "absolute",
                      left: "10px",
                      top: "9px",
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={
                isSubmitting ||
                (selectedRoleTab === "EXECUTIVE" &&
                  executiveRegistrationAllowed !== true)
              }
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "10px",
                fontSize: "0.88rem",
                marginTop: "4px",
              }}
            >
              <UserCheck size={16} />
              {isSubmitting
                ? "Registering..."
                : `Register New ${selectedRoleTab}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
