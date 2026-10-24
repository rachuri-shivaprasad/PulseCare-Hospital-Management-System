import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Smartphone,
  Clock,
  ExternalLink,
  Copy,
  Info,
  ClipboardCheck
} from 'lucide-react';
import { api } from '../services/api';

const UPI_RECIPIENT = '7569252605@ybl';

/**
 * PaymentModal — UPI payment flow
 *
 * Step 1: Show payment details + UPI deep-link + QR
 * Step 2: Patient enters their UPI transaction reference (UTR)
 * Step 3: Submit → moves to PENDING_VERIFICATION, not PAID
 * Final receipt shows only after staff verifies (PAID status)
 */
export const PaymentModal = ({ appointment, onClose, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('upi'); // 'upi' | 'claim' | 'submitted'
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [txnRef, setTxnRef] = useState('');
  const [receiptData, setReceiptData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!appointment?.id) return;
    setLoading(true);
    setError('');

    api.createPaymentOrder(appointment.id, appointment.patientPhone)
      .then(order => {
        if (!mounted) return;
        setOrderData(order);
        // If already paid or pending verification, skip to submitted view
        if (order.status === 'PAID') {
          api.getAppointmentPayment(appointment.id)
            .then(rcpt => { if (mounted && rcpt) setReceiptData(rcpt); })
            .catch(() => {});
          setStep('submitted');
        } else if (order.status === 'PENDING_VERIFICATION') {
          setStep('submitted');
        }
      })
      .catch(err => {
        if (!mounted) return;
        if (err.message && err.message.toLowerCase().includes('already paid')) {
          setStep('submitted');
          api.getAppointmentPayment(appointment.id)
            .then(rcpt => { if (mounted && rcpt) setReceiptData(rcpt); })
            .catch(() => {});
        } else {
          setError(err.message || 'Could not initialize payment details.');
        }
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [appointment]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_RECIPIENT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleOpenUpiApp = () => {
    if (orderData?.upiDeepLink) {
      window.location.href = orderData.upiDeepLink;
      // After returning, prompt to enter reference
      setTimeout(() => setStep('claim'), 2500);
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!txnRef.trim()) {
      setError('Please enter the UPI Transaction / UTR reference from your UPI app.');
      return;
    }
    if (!orderData?.paymentId) return;
    setSubmitting(true);
    setError('');
    try {
      const receipt = await api.submitPaymentClaim(orderData.paymentId, txnRef.trim(), 'UPI');
      setReceiptData(receipt);
      setStep('submitted');
      // Notify parent that status changed to PENDING_VERIFICATION
      if (onPaymentSuccess) onPaymentSuccess({ ...receipt, awaitingVerification: true });
    } catch (err) {
      setError(err.message || 'Could not submit your payment claim. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── QR code using Google Charts API (encodes real UPI deep-link) ──────────
  const qrUrl = orderData?.upiDeepLink
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(orderData.upiDeepLink)}&format=png&margin=10`
    : null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="pay-modal-title">
      <div
        className="modal-container"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '500px', width: '100%', maxHeight: '95vh', overflowY: 'auto' }}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="modal-header" style={{ background: '#0b1f3a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={20} color="#38bdf8" />
            <div>
              <h3 id="pay-modal-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc' }}>
                OPD Consultation Payment
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Token: {appointment.tokenNumber} · Ref: {appointment.id}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', lineHeight: 0 }}
            aria-label="Close payment modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────── */}
        <div className="modal-body" style={{ padding: '1.5rem' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '2.5rem 0', color: '#64748b' }}>
              <div style={{ width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '0.875rem' }}>Loading payment details…</p>
            </div>
          )}

          {!loading && error && !orderData && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.875rem', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.875rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP: submitted / pending verification ─────────────── */}
          {!loading && step === 'submitted' && (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              {receiptData?.status === 'PAID' ? (
                <>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <CheckCircle2 size={30} />
                  </div>
                  <h3 style={{ color: '#0b1f3a', marginBottom: '0.375rem' }}>Payment Verified!</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                    Your consultation fee has been confirmed by reception. Your receipt is ready.
                  </p>
                  <button onClick={() => { if (onPaymentSuccess) onPaymentSuccess(receiptData); }} className="btn btn-primary" id="view-verified-receipt-btn">
                    View Receipt
                  </button>
                </>
              ) : (
                <>
                  <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Clock size={30} />
                  </div>
                  <h3 style={{ color: '#0b1f3a', marginBottom: '0.375rem' }}>Payment Under Verification</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1rem' }}>
                    Your payment claim has been submitted. The reception team will cross-check your UPI transaction reference and confirm payment.
                  </p>
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.875rem', fontSize: '0.8125rem', color: '#92400e', textAlign: 'left', marginBottom: '1.25rem' }}>
                    <strong style={{ display: 'block', marginBottom: '0.25rem' }}>⏳ Next steps</strong>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                      <li>Reception will verify your UTR / transaction ID against bank records.</li>
                      <li>Your token will remain active in the queue while verification is pending.</li>
                      <li>Receipt will be generated after verification is complete.</li>
                    </ul>
                  </div>
                  {receiptData?.transactionReference && (
                    <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                      Transaction Reference submitted: <strong style={{ color: '#0b1f3a' }}>{receiptData.transactionReference}</strong>
                    </p>
                  )}
                  <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>
                    Close — I'll check back later
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── STEP: UPI payment instructions ─────────────────────── */}
          {!loading && orderData && step === 'upi' && (
            <>
              {/* Amount card */}
              <div style={{
                background: 'linear-gradient(135deg, #0b1f3a 0%, #1e3a8a 100%)',
                color: 'white',
                borderRadius: '12px',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.8125rem', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                    Consultation Fee
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                    UPI Payment
                  </span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {orderData.formattedAmount || `₹${orderData.amount}`}
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#cbd5e1', marginTop: '0.3rem' }}>
                  {orderData.doctorName} · {appointment.department}
                </div>
                <div style={{ marginTop: '0.625rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#94a3b8' }}>
                  <span>Token: <strong style={{ color: '#e2e8f0' }}>{orderData.tokenNumber || appointment.tokenNumber}</strong></span>
                  <span>Date: <strong style={{ color: '#e2e8f0' }}>{orderData.appointmentDate || appointment.date}</strong></span>
                </div>
              </div>

              {/* Important notice */}
              <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: '#9a3412' }}>
                <Info size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Important:</strong> After paying, you must enter your UPI transaction reference (UTR number) so that our reception team can verify and confirm your payment. Returning to this page alone does not confirm payment.
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} /><span>{error}</span>
                </div>
              )}

              {/* UPI ID box */}
              <div style={{ background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: '10px', padding: '1rem 1.125rem', marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
                  Pay to UPI ID
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0b1f3a', letterSpacing: '0.03em', fontFamily: 'monospace' }}>
                    {UPI_RECIPIENT}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="btn btn-sm btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                    id="copy-upi-btn"
                  >
                    {copied ? <><CheckCircle2 size={13} color="#059669" /> Copied!</> : <><Copy size={13} /> Copy</>}
                  </button>
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#0f766e', marginTop: '0.4rem' }}>
                  PulseCare Multi-Speciality Hospital
                </div>
              </div>

              {/* QR Code + UPI app button */}
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                {qrUrl && (
                  <div style={{ flexShrink: 0, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Scan QR Code
                    </div>
                    <div style={{ border: '2px solid #e2e8f0', borderRadius: '8px', padding: '6px', display: 'inline-block', background: 'white' }}>
                      <img
                        src={qrUrl}
                        alt="UPI QR code — scan to pay"
                        width={140}
                        height={140}
                        style={{ display: 'block' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  </div>
                )}

                <div style={{ flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                    <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#0b1f3a' }}>Or open your UPI app:</strong>
                    GPay, PhonePe, Paytm, BHIM, any bank UPI app
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenUpiApp}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', fontSize: '0.9375rem' }}
                    id="open-upi-app-btn"
                  >
                    <Smartphone size={18} /> Pay using UPI App <ExternalLink size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('claim')}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    id="ive-paid-btn"
                  >
                    <ClipboardCheck size={14} /> I've paid — Enter Transaction ID
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                <ShieldCheck size={14} color="#0d9488" />
                <span>Payment verified manually by reception · Appointment queue unaffected</span>
              </div>
            </>
          )}

          {/* ── STEP: enter transaction reference ──────────────────── */}
          {!loading && orderData && step === 'claim' && (
            <form onSubmit={handleSubmitClaim} noValidate id="payment-claim-form">
              <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f0fdfa', color: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                  <ClipboardCheck size={24} />
                </div>
                <h3 style={{ fontSize: '1.125rem', color: '#0b1f3a', marginBottom: '0.25rem' }}>Enter UPI Transaction Reference</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  Find the UTR / transaction ID in your UPI app's payment history and enter it below so reception can verify your payment.
                </p>
              </div>

              {/* Reminder of payment details */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.875rem', marginBottom: '1.25rem', fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {[
                  { label: 'Amount', value: orderData.formattedAmount },
                  { label: 'UPI ID', value: UPI_RECIPIENT },
                  { label: 'Appointment', value: appointment.id },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>{row.label}:</span>
                    <strong style={{ color: '#0b1f3a', fontFamily: row.label === 'UPI ID' ? 'monospace' : 'inherit' }}>{row.value}</strong>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="upi-txn-ref">
                  UPI Transaction Reference / UTR Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="upi-txn-ref"
                  type="text"
                  className="form-control"
                  placeholder="e.g. 412563789012 or UTR reference"
                  value={txnRef}
                  onChange={e => { setTxnRef(e.target.value); setError(''); }}
                  required
                  autoFocus
                  style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}
                />
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.35rem' }}>
                  Open your UPI app → Transactions → Copy the 12-digit UTR / reference number.
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} /><span>{error}</span>
                </div>
              )}

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.8125rem', color: '#92400e' }}>
                <strong>Note:</strong> Submitting this form moves your payment to <em>Pending Verification</em>. Reception will confirm it using your transaction reference. Your token remains active while verification is pending.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => { setStep('upi'); setError(''); }}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  id="submit-payment-claim-btn"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting…' : 'Submit Payment Claim'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
