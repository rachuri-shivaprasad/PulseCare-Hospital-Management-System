import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  X,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ClipboardCheck,
  Info
} from 'lucide-react';
import { api } from '../services/api';

/**
 * ManualPaymentVerificationModal — STAFF ONLY
 *
 * Lets authorized reception staff manually verify (approve or reject)
 * a patient's UPI payment claim by checking the transaction reference.
 * This is the ONLY authorized path that sets a payment to PAID.
 */
export const ManualPaymentVerificationModal = ({ appointment, onClose, onVerified }) => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [staffNote, setStaffNote] = useState('');
  const [done, setDone] = useState(null); // { status: 'PAID'|'FAILED', receipt }

  useEffect(() => {
    let mounted = true;
    if (!appointment?.id) return;
    setLoading(true);
    setError('');

    api.getAppointmentPayment(appointment.id)
      .then(data => {
        if (!mounted) return;
        setPaymentData(data);
        if (data?.transactionReference) {
          setTxnRef(data.transactionReference);
        }
      })
      .catch(err => {
        if (mounted) setError(err.message || 'Could not load payment record for this appointment.');
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, [appointment]);

  const handleDecision = async (approve) => {
    if (!txnRef.trim()) {
      setError('Transaction reference is required. Obtain it from the patient before approving.');
      return;
    }
    if (!paymentData?.paymentId) {
      setError('No payment order found for this appointment. Patient must initiate payment first.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const receipt = await api.manualVerifyPayment({
        paymentId: paymentData.paymentId,
        transactionReference: txnRef.trim(),
        approve,
        staffNote: staffNote.trim() || undefined
      });
      setDone({ status: approve ? 'PAID' : 'FAILED', receipt });
      if (onVerified) onVerified(receipt);
    } catch (err) {
      setError(err.message || 'Could not submit verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = {
    PENDING: '#d97706',
    PENDING_VERIFICATION: '#0369a1',
    PAID: '#059669',
    FAILED: '#dc2626',
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="manual-verify-title">
      <div
        className="modal-container"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ background: '#0b1f3a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#34d399" />
            <div>
              <h3 id="manual-verify-title" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                Manual Payment Verification
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Staff Action · {appointment?.tokenNumber} · {appointment?.patientName}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', lineHeight: 0 }} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.5rem' }}>

          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#64748b' }}>
              <div style={{ width: '32px', height: '32px', border: '3px solid #e2e8f0', borderTopColor: '#0d9488', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ fontSize: '0.875rem' }}>Loading payment record…</p>
            </div>
          )}

          {!loading && error && !paymentData && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.875rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{error}</span>
            </div>
          )}

          {/* Already paid */}
          {!loading && paymentData?.status === 'PAID' && !done && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                <CheckCircle2 size={28} />
              </div>
              <h3 style={{ color: '#0b1f3a', marginBottom: '0.35rem' }}>Already Paid & Verified</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                This appointment's payment has already been confirmed.
                {paymentData.verifiedBy && <><br />Verified by: <strong>{paymentData.verifiedBy}</strong></>}
              </p>
              {paymentData.transactionReference && (
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
                  Transaction Reference: <strong style={{ fontFamily: 'monospace' }}>{paymentData.transactionReference}</strong>
                </p>
              )}
              <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: '1rem' }}>Close</button>
            </div>
          )}

          {/* Verification complete (just submitted) */}
          {done && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: done.status === 'PAID' ? '#ecfdf5' : '#fef2f2', color: done.status === 'PAID' ? '#059669' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.875rem' }}>
                {done.status === 'PAID' ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
              </div>
              <h3 style={{ color: '#0b1f3a', marginBottom: '0.35rem' }}>
                {done.status === 'PAID' ? 'Payment Approved & Verified' : 'Payment Rejected'}
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                {done.status === 'PAID'
                  ? 'The payment has been marked as PAID. The patient may now view their official receipt.'
                  : 'The payment has been marked as FAILED. The patient will need to retry payment.'}
              </p>
              {done.receipt?.transactionReference && (
                <p style={{ fontSize: '0.8125rem', color: '#64748b' }}>
                  Transaction Reference: <strong style={{ fontFamily: 'monospace' }}>{done.receipt.transactionReference}</strong>
                </p>
              )}
              <button onClick={onClose} className="btn btn-primary" style={{ marginTop: '0.75rem' }}>
                Done
              </button>
            </div>
          )}

          {/* Verification form */}
          {!loading && !done && paymentData && paymentData.status !== 'PAID' && (
            <>
              {/* Appointment summary */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { label: 'Patient', value: appointment.patientName },
                    { label: 'Token', value: appointment.tokenNumber },
                    { label: 'Doctor', value: appointment.doctorName },
                    { label: 'Amount', value: paymentData.formattedAmount || `₹${paymentData.amount}` },
                    { label: 'UPI Recipient', value: paymentData.upiRecipient || '7569252605@ybl' },
                    {
                      label: 'Payment Status',
                      value: paymentData.status,
                      color: statusColor[paymentData.status] || '#64748b'
                    },
                  ].map(row => (
                    <div key={row.label}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>{row.label}</span>
                      <strong style={{ color: row.color || '#0b1f3a', fontFamily: row.label === 'UPI Recipient' ? 'monospace' : 'inherit' }}>
                        {row.value}
                      </strong>
                    </div>
                  ))}
                </div>
                {paymentData.status === 'PENDING_VERIFICATION' && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369a1', fontSize: '0.8rem' }}>
                    <Clock size={13} /> Patient has submitted payment claim.
                  </div>
                )}
              </div>

              {/* Important instruction */}
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', fontSize: '0.8125rem', color: '#1e40af' }}>
                <Info size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong>Staff instruction:</strong> Verify the transaction reference against your bank portal or UPI business dashboard before approving. Only approve when you can confirm funds were received.
                </div>
              </div>

              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} /><span>{error}</span>
                </div>
              )}

              {/* Transaction reference input */}
              <div className="form-group">
                <label className="form-label" htmlFor="staff-txn-ref">
                  UPI Transaction Reference / UTR Number <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  id="staff-txn-ref"
                  type="text"
                  className="form-control"
                  placeholder="Enter UTR / transaction reference from bank"
                  value={txnRef}
                  onChange={e => { setTxnRef(e.target.value); setError(''); }}
                  required
                  style={{ fontFamily: 'monospace', letterSpacing: '0.04em' }}
                />
                {paymentData.transactionReference && txnRef !== paymentData.transactionReference && (
                  <div style={{ fontSize: '0.78rem', color: '#0369a1', marginTop: '0.3rem' }}>
                    Patient-provided reference: <strong style={{ fontFamily: 'monospace' }}>{paymentData.transactionReference}</strong>
                  </div>
                )}
              </div>

              {/* Optional staff note */}
              <div className="form-group">
                <label className="form-label" htmlFor="staff-note">
                  Staff Note <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
                </label>
                <input
                  id="staff-note"
                  type="text"
                  className="form-control"
                  placeholder="e.g., Confirmed in YES Bank portal. Matched ₹600 credit."
                  value={staffNote}
                  onChange={e => setStaffNote(e.target.value)}
                />
              </div>

              {/* Approve / Reject buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => handleDecision(false)}
                  disabled={submitting}
                  className="btn btn-danger"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  id="reject-payment-btn"
                >
                  <XCircle size={15} /> Reject Payment
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision(true)}
                  disabled={submitting}
                  className="btn btn-success"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  id="approve-payment-btn"
                >
                  {submitting ? 'Processing…' : <><ClipboardCheck size={15} /> Approve &amp; Mark Paid</>}
                </button>
              </div>

              <p style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', marginTop: '0.75rem' }}>
                This action is recorded with your staff ID and a timestamp for audit purposes.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
