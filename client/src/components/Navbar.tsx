import React from "react";
import { MapPin, Wallet, UserCheck, ShieldAlert, LogIn } from "lucide-react";
import { StateOption } from "../mockData";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedState: StateOption;
  onOpenStatePicker: () => void;
  onOpenAuthModal: () => void;
  walletBalance: number;
  isAdminMode: boolean;
  setIsAdminMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedState,
  onOpenStatePicker,
  onOpenAuthModal,
  walletBalance,
  isAdminMode,
  setIsAdminMode,
}) => {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 900,
        background: "rgba(9, 13, 22, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid var(--border-color)",
        padding: "12px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Brand Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("learn")}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
              padding: "4px",
              border: "1.5px solid #F59E0B",
            }}
          >
            <img
              src="/logo.png"
              alt="AllianceECLogo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>

          <div>
            <div
              style={{ fontSize: "1.4rem", fontWeight: "800", lineHeight: 1.1 }}
            >
              Alliance<span className="gradient-text">EC</span>
            </div>

            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontWeight: "600",
                letterSpacing: "0.5px",
              }}
            >
              OFFICIAL E-LEARNING PLATFORM
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          style={{
            display: "flex",
            gap: "6px",
            background: "rgba(255, 255, 255, 0.04)",
            padding: "4px",
            borderRadius: "12px",
            border: "1px solid var(--border-color)",
          }}
        >
          <button
            onClick={() => setActiveTab("learn")}
            style={{
              background:
                activeTab === "learn"
                  ? "var(--primary-gradient)"
                  : "transparent",
              color: activeTab === "learn" ? "#FFF" : "var(--text-secondary)",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            🎓 Learn & Courses
          </button>

          <button
            onClick={() => setActiveTab("wallet")}
            style={{
              background:
                activeTab === "wallet"
                  ? "var(--primary-gradient)"
                  : "transparent",
              color: activeTab === "wallet" ? "#FFF" : "var(--text-secondary)",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            💳 Wallet & E-Books
          </button>

          <button
            onClick={() => setActiveTab("mlm")}
            style={{
              background:
                activeTab === "mlm" ? "var(--primary-gradient)" : "transparent",
              color: activeTab === "mlm" ? "#FFF" : "var(--text-secondary)",
              border: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "0.88rem",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            🌳 Binary MLM Network
          </button>
        </nav>

        {/* Right Widgets: State Picker, Wallet, Auth/Admin */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* State Selector Button */}
          <button
            onClick={onOpenStatePicker}
            style={{
              background: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#34D399",
              padding: "6px 14px",
              borderRadius: "50px",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <MapPin size={14} />
            <span>
              {selectedState.name} ({selectedState.code})
            </span>
          </button>

          {/* Wallet Balance Badge */}
          <div
            onClick={() => setActiveTab("wallet")}
            style={{
              background: "rgba(245, 158, 11, 0.12)",
              border: "1px solid rgba(245, 158, 11, 0.3)",
              color: "#FBBF24",
              padding: "6px 14px",
              borderRadius: "50px",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Wallet size={14} />
            <span>₹ {walletBalance.toLocaleString("en-IN")}.00</span>
          </div>

          {/* Admin Toggle / Auth */}
          <button
            onClick={() => setIsAdminMode(!isAdminMode)}
            style={{
              background: isAdminMode
                ? "rgba(239, 68, 68, 0.2)"
                : "rgba(255, 255, 255, 0.06)",
              border: isAdminMode
                ? "1px solid rgba(239, 68, 68, 0.4)"
                : "1px solid var(--border-color)",
              color: isAdminMode ? "#FCA5A5" : "var(--text-primary)",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {isAdminMode ? <ShieldAlert size={16} /> : <UserCheck size={16} />}
            <span>{isAdminMode ? "Admin Mode ON" : "Student Mode"}</span>
          </button>

          <button
            className="btn-primary"
            onClick={onOpenAuthModal}
            style={{ padding: "8px 16px", fontSize: "0.85rem" }}
          >
            <LogIn size={16} />
            <span>Login / KYC</span>
          </button>
        </div>
      </div>
    </header>
  );
};
