import React from 'react';
import {
  CheckCircle2,
  Printer,
  X,
  ShieldCheck,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';

/**
 * ReceiptModal — Only renders a full receipt for PAID payments.
 * For PENDING / PENDING_VERIFICATION / FAILED, shows appropriate status message.
 */
export const ReceiptModal = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const isPaid = receipt.status === 'PAID';
  const isPendingVerification = receipt.status === 'PENDING_VERIFICATION';
  const isFailed = receipt.status === 'FAILED';

  const handlePrint = () => window.print();

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="receipt-modal-title">
      <div
        className="modal-container receipt-modal-box"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '100%', maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Modal Header */}
        <div className="modal-header" style={{ background: '#0b1f3a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={20} color={isPaid ? '#34d399' : '#fbbf24'} />
            <div>
              <h3 id="receipt-modal-title" style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc' }}>
                {isPaid ? 'Official Consultation Receipt' : 'Payment Status'}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Ref: {receipt.receiptNumber || receipt.appointmentId}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem', lineHeight: 0 }}
            aria-label="Close receipt"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.75rem' }}>

          {/* ── PENDING_VERIFICATION state ─────────────────────────── */}
          {isPendingVerification && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Clock size={30} />
              </div>
              <h3 style={{ color: '#0b1f3a', marginBottom: '0.5rem' }}>Payment Under Verification</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', maxWidth: '380px', margin: '0 auto 1.25rem' }}>
                Your UPI payment claim has been submitted and is awaiting confirmation by the reception team. A receipt will be generated once verified.
              </p>
              {receipt.transactionReference && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.875rem', fontSize: '0.875rem', marginBottom: '1rem', display: 'inline-block', textAlign: 'left', minWidth: '260px' }}>
                  <div style={{ color: '#64748b', marginBottom: '0.25rem' }}>Transaction Reference Submitted:</div>
                  <strong style={{ color: '#0b1f3a', fontFamily: 'monospace', fontSize: '1rem' }}>{receipt.transactionReference}</strong>
                </div>
              )}
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.875rem 1rem', fontSize: '0.8125rem', color: '#92400e', textAlign: 'left', maxWidth: '400px', margin: '0 auto 1.25rem' }}>
                <strong style={{ display: 'block', marginBottom: '0.3rem' }}>⏳ Next steps</strong>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li>Please approach the reception desk with your UTR reference number.</li>
                  <li>Your token remains active in the OPD queue.</li>
                  <li>Receipt will be generated after staff confirmation.</li>
                </ul>
              </div>
              <button onClick={onClose} className="btn btn-secondary">Close</button>
            </div>
          )}

          {/* ── FAILED state ──────────────────────────────────────── */}
          {isFailed && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <AlertTriangle size={30} />
              </div>
              <h3 style={{ color: '#0b1f3a', marginBottom: '0.5rem' }}>Payment Failed / Rejected</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                {receipt.notes || 'The payment could not be verified. Please contact the reception desk or try again.'}
              </p>
              <button onClick={onClose} className="btn btn-secondary">Close</button>
            </div>
          )}

          {/* ── PAID — Full printable receipt ─────────────────────── */}
          {isPaid && (
            <>
              <div
                id="printable-receipt"
                style={{
                  background: '#ffffff',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  position: 'relative'
                }}
              >
                {/* Hospital header */}
                <div style={{ textAlign: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0d9488', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>+</div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0b1f3a', margin: 0, letterSpacing: '-0.02em' }}>
                      PulseCare Multi-Speciality Hospital
                    </h2>
                  </div>
                  <p style={{ margin: '0.2rem 0', fontSize: '0.8125rem', color: '#64748b' }}>
                    Central OPD Block &bull; Health City, Hyderabad &bull; GSTIN: 36AAACP0000A1Z5
                  </p>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: '#ecfdf5', color: '#065f46', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.4rem' }}>
                    <CheckCircle2 size={13} color="#059669" /> TAX INVOICE &bull; PAYMENT VERIFIED &amp; PAID
                  </div>
                </div>

                {/* Receipt metadata grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                  {[
                    { label: 'Receipt Number', value: receipt.receiptNumber },
                    { label: 'Verified At', value: receipt.verifiedAt ? new Date(receipt.verifiedAt).toLocaleString('en-IN') : new Date().toLocaleString('en-IN') },
                    { label: 'Appointment ID', value: receipt.appointmentId, mono: true },
                    { label: 'Queue Token', value: receipt.tokenNumber || 'Assigned', badge: true },
                  ].map(row => (
                    <div key={row.label}>
                      <span style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>{row.label}</span>
                      {row.badge
                        ? <span className="token-badge" style={{ padding: '0.15rem 0.6rem', fontSize: '0.85rem' }}>{row.value}</span>
                        : <strong style={{ color: '#0b1f3a', fontSize: '0.95rem', fontFamily: row.mono ? 'monospace' : 'inherit' }}>{row.value}</strong>
                      }
                    </div>
                  ))}
                </div>

                {/* Patient & doctor details */}
                <div style={{ background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                  {[
                    { label: 'Patient Name', value: receipt.patientName },
                    { label: 'Patient Contact', value: receipt.patientPhone || 'Registered' },
                    { label: 'Consulting Doctor', value: receipt.doctorName, teal: true },
                    { label: 'Specialty Department', value: receipt.department },
                  ].map((row, i, arr) => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i < arr.length - 1 ? '0.5rem' : 0, borderBottom: i < arr.length - 1 ? '1px solid #e2e8f0' : 'none', marginBottom: i < arr.length - 1 ? '0.5rem' : 0 }}>
                      <span style={{ color: '#64748b' }}>{row.label}:</span>
                      <strong style={{ color: row.teal ? '#0d9488' : '#0b1f3a' }}>{row.value}</strong>
                    </div>
                  ))}
                </div>

                {/* Payment breakdown */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'Doctor Consultation Fee', value: receipt.formattedAmount || `₹${receipt.amount}` },
                    { label: 'Digital OPD Queue & Triage Registration', value: '₹0.00 (Complimentary)' },
                    { label: 'Payment Mode', value: receipt.paymentMethod || 'UPI' },
                    { label: 'UPI Recipient', value: receipt.upiRecipient || '7569252605@ybl', mono: true },
                    receipt.transactionReference && { label: 'Transaction Reference (UTR)', value: receipt.transactionReference, mono: true },
                    receipt.verifiedBy && { label: 'Verified By', value: receipt.verifiedBy },
                  ].filter(Boolean).map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.35rem 0' }}>
                      <span style={{ color: '#475569' }}>{row.label}:</span>
                      <span style={{ color: '#0b1f3a', fontWeight: 600, fontFamily: row.mono ? 'monospace' : 'inherit' }}>{row.value}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 800, borderTop: '2px solid #0b1f3a', paddingTop: '0.75rem', marginTop: '0.5rem', color: '#0b1f3a' }}>
                    <span>Total Amount Paid:</span>
                    <span style={{ color: '#0d9488' }}>{receipt.formattedAmount || `₹${receipt.amount}`}</span>
                  </div>
                </div>

                {/* Footer */}
                <div style={{ textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#0d9488', fontWeight: 600, marginBottom: '0.2rem' }}>
                    <ShieldCheck size={14} /> Digitally Authenticated by PulseCare Health Systems
                  </div>
                  <p style={{ margin: 0 }}>
                    This is a computer-generated tax invoice and valid OPD pass. No physical signature required.
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button onClick={handlePrint} className="btn btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }} id="print-receipt-btn">
                  <Printer size={16} /> Print / Save PDF
                </button>
                <button onClick={onClose} className="btn btn-primary" id="close-receipt-btn">
                  Done
                </button>
              </div>
            </>
          )}

          {/* ── PENDING (payment not yet started) ─────────────────── */}
          {!isPaid && !isPendingVerification && !isFailed && (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748b' }}>
              <AlertTriangle size={28} color="#d97706" style={{ margin: '0 auto 0.75rem' }} />
              <p>No verified payment found for this appointment.</p>
              <button onClick={onClose} className="btn btn-secondary" style={{ marginTop: '0.5rem' }}>Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
