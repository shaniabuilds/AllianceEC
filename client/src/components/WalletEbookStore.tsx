import React, { useState } from 'react';
import { Wallet, PlusCircle, ArrowUpRight, ArrowDownLeft, BookOpen, ShoppingBag, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { MOCK_EBOOKS, MOCK_TRANSACTIONS, EBook, WalletTransaction } from '../mockData';

interface WalletEbookStoreProps {
  walletBalance: number;
  onTopUp: (amount: number) => void;
}

export const WalletEbookStore: React.FC<WalletEbookStoreProps> = ({ walletBalance, onTopUp }) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>(MOCK_TRANSACTIONS);
  const [ebooks, setEbooks] = useState<EBook[]>(MOCK_EBOOKS);
  const [activeEbookReader, setActiveEbookReader] = useState<EBook | null>(null);
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [selectedTopupAmount, setSelectedTopupAmount] = useState(1000);

  const handleConfirmTopup = () => {
    onTopUp(selectedTopupAmount);
    const newTxn: WalletTransaction = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'TOPUP',
      title: 'Wallet Top-Up via Razorpay (Instant)',
      amount: selectedTopupAmount,
      date: 'Just Now',
      status: 'SUCCESS',
      referenceId: `pay_RZP${Math.floor(100000 + Math.random() * 900000)}`
    };
    setTransactions([newTxn, ...transactions]);
    setShowTopupModal(false);
  };

  const handleBuyEbook = (ebook: EBook) => {
    if (walletBalance < ebook.price) {
      alert('Insufficient wallet balance! Please top up your wallet first.');
      setShowTopupModal(true);
      return;
    }

    onTopUp(-ebook.price);
    setEbooks((prev) =>
      prev.map((e) => (e.id === ebook.id ? { ...e, purchased: true } : e))
    );

    const newTxn: WalletTransaction = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'EBOOK_PURCHASE',
      title: `E-Book Bought: ${ebook.title}`,
      amount: -ebook.price,
      date: 'Just Now',
      status: 'SUCCESS',
      referenceId: `eb_${ebook.id}`
    };
    setTransactions([newTxn, ...transactions]);
    setActiveEbookReader(ebook);
  };

  return (
    <div>
      {/* Top Banner: Digital Wallet Widget */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Wallet Balance Card */}
        <div className="glass-card" style={{ padding: '28px', background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.8) 0%, rgba(99, 102, 241, 0.15) 100%)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <span className="badge badge-amber" style={{ marginBottom: '6px' }}>
                <Wallet size={12} /> DIGITAL WALLET BALANCE
              </span>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', marginTop: '4px' }}>
                ₹ {walletBalance.toLocaleString('en-IN')}.00
              </div>
            </div>

            <button className="btn-emerald" onClick={() => setShowTopupModal(true)}>
              <PlusCircle size={16} /> Top-Up Wallet
            </button>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Wallet status: <strong style={{ color: '#34D399' }}>ACTIVE & VERIFIED</strong> • Used for 1-click Course & E-Book Purchases.
          </p>
        </div>

        {/* Razorpay Integration Info Card */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <ShieldCheck size={24} color="#818CF8" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
              Razorpay Payment Gateway Integration
            </h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Supports UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net Banking & Wallet auto-refunds with ACID transaction security.
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-primary">UPI AUTO-COLLECT</span>
            <span className="badge badge-emerald">ACID AUDIT LOG</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Transaction History & E-Book Catalog */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Transaction History */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Wallet color="var(--primary-accent)" size={20} />
            Wallet Transaction Log
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {transactions.map((txn) => {
              const isCredit = txn.amount > 0;
              return (
                <div
                  key={txn.id}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '10px',
                      background: isCredit ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isCredit ? '#34D399' : '#FCA5A5'
                    }}>
                      {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                    </div>

                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: '700' }}>{txn.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{txn.date} • Ref: {txn.referenceId}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: isCredit ? '#34D399' : '#FCA5A5' }}>
                      {isCredit ? '+' : ''} ₹ {Math.abs(txn.amount)}
                    </div>
                    <span style={{ fontSize: '0.7rem', color: '#34D399', fontWeight: '700' }}>SUCCESS</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* E-Book Catalog */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BookOpen color="#10B981" size={20} />
            Digital E-Book Library Store
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {ebooks.map((eb) => (
              <div
                key={eb.id}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center'
                }}
              >
                <div style={{
                  width: '60px',
                  height: '80px',
                  borderRadius: '8px',
                  background: eb.coverColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFF',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}>
                  <BookOpen size={28} />
                </div>

                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary-accent)', fontWeight: '800' }}>
                    {eb.category}
                  </span>
                  <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '2px' }}>{eb.title}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    By {eb.author} • {eb.pages} Pages ({eb.format})
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#34D399' }}>
                      ₹ {eb.price} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>₹ {eb.originalPrice}</span>
                    </div>

                    {eb.purchased ? (
                      <button className="btn-emerald" onClick={() => setActiveEbookReader(eb)} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                        <BookOpen size={14} /> Read In-App
                      </button>
                    ) : (
                      <button className="btn-primary" onClick={() => handleBuyEbook(eb)} style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                        <ShoppingBag size={14} /> Buy with Wallet
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RAZORPAY TOP-UP SIMULATION MODAL */}
      {showTopupModal && (
        <div className="modal-overlay" onClick={() => setShowTopupModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ padding: '32px', maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '8px' }}>
              Razorpay Wallet Top-Up
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Select top-up amount to add funds instantly via UPI or NetBanking.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              {[500, 1000, 2000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelectedTopupAmount(amt)}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: selectedTopupAmount === amt ? '2px solid var(--primary-accent)' : '1px solid var(--border-color)',
                    background: selectedTopupAmount === amt ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                    color: selectedTopupAmount === amt ? '#818CF8' : 'var(--text-primary)',
                    fontWeight: '800',
                    fontSize: '1.1rem',
                    cursor: 'pointer'
                  }}
                >
                  ₹ {amt}
                </button>
              ))}
            </div>

            <button className="btn-emerald" onClick={handleConfirmTopup} style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
              <CheckCircle2 size={18} /> Confirm ₹ {selectedTopupAmount} Razorpay Top-Up
            </button>
          </div>
        </div>
      )}

      {/* IN-APP E-BOOK READER MODAL */}
      {activeEbookReader && (
        <div className="modal-overlay" onClick={() => setActiveEbookReader(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <span className="badge badge-emerald">IN-APP E-BOOK READER</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginTop: '4px' }}>
                  {activeEbookReader.title}
                </h2>
              </div>
              <button onClick={() => setActiveEbookReader(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ background: 'var(--bg-card-solid)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', minHeight: '300px', fontSize: '1rem', lineHeight: 1.8 }}>
              {activeEbookReader.sampleText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
