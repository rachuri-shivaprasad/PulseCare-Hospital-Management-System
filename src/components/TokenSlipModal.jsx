import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Printer, 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Stethoscope, 
  X, 
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Receipt
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';

export const TokenSlipModal = ({ appointment, onClose }) => {
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [isPaid, setIsPaid] = useState(appointment?.paymentStatus === 'PAID');

  if (!appointment) return null;

  const handlePrint = () => window.print();

  const goToDashboard = () => {
    onClose();
    navigate('/patient-dashboard');
  };

  const handlePaymentSuccess = (receipt) => {
    setIsPaid(true);
    setShowPaymentModal(false);
    setReceiptData(receipt);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
        <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
          
          {/* Modal Header */}
          <div className="modal-header">
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                marginBottom: '0.25rem' 
              }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span style={{ 
                  fontSize: '0.75rem', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.06em', 
                  color: '#94a3b8', 
                  fontWeight: 600 
                }}>
                  Appointment Confirmed
                </span>
              </div>
              <h3 style={{ color: 'white', fontSize: '1.1875rem', margin: 0, fontWeight: 700 }}>
                PulseCare Medical &mdash; OPD Token Slip
              </h3>
            </div>
            <button 
              onClick={onClose} 
              style={{ color: '#64748b', background: 'transparent', border: 'none', padding: '0.25rem', borderRadius: '4px', lineHeight: 0, cursor: 'pointer' }}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            {/* Token Slip */}
            <div className="token-slip-card" style={{ textAlign: 'center' }}>
              <span style={{ 
                fontSize: '0.6875rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.12em', 
                color: '#94a3b8', 
                fontWeight: 700 
              }}>
                OPD Queue Token Number
              </span>

              <div style={{ margin: '0.75rem 0 0.5rem' }}>
                <span className="token-badge lg">
                  {appointment.tokenNumber}
                </span>
              </div>

              <div style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.35rem', 
                color: '#0d9488', 
                fontSize: '0.8125rem', 
                fontWeight: 600 
              }}>
                <ShieldCheck size={14} /> Verified Digital Queue Token
              </div>

              <div className="barcode-mock">
                ||| | |||| | ||| | ||||| | |||
              </div>
              <span style={{ fontSize: '0.6875rem', color: '#94a3b8' }}>
                Ref: {appointment.id} &bull; Issued: {new Date(appointment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Appointment Details */}
            <div style={{ 
              background: '#f8fafc', 
              border: '1px solid #f1f5f9', 
              borderRadius: '8px', 
              padding: '1rem 1.125rem',
              marginBottom: '1rem'
            }}>
              {[
                {
                  icon: <User size={14} />,
                  label: 'Patient',
                  value: `${appointment.patientName} (${appointment.patientAge}y, ${appointment.patientGender})`
                },
                {
                  icon: <Stethoscope size={14} />,
                  label: 'Consulting Doctor',
                  value: appointment.doctorName,
                  teal: true
                },
                {
                  icon: <MapPin size={14} />,
                  label: 'Dept. & Cabin',
                  value: appointment.department
                },
                {
                  icon: <Calendar size={14} />,
                  label: 'Date',
                  value: appointment.date
                },
                {
                  icon: <Clock size={14} />,
                  label: 'Assigned Slot',
                  value: appointment.timeSlot
                },
                {
                  icon: <CreditCard size={14} />,
                  label: 'Payment Status',
                  value: isPaid ? 'PAID (Verified)' : 'PENDING (Unpaid)',
                  isStatus: true,
                  isPaid: isPaid
                }
              ].map((row, i, arr) => (
                <div 
                  key={row.label}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.45rem 0',
                    borderBottom: i < arr.length - 1 ? '1px solid #f1f5f9' : 'none',
                    fontSize: '0.875rem'
                  }}
                >
                  <span style={{ 
                    color: '#64748b', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem' 
                  }}>
                    {row.icon} {row.label}
                  </span>
                  {row.isStatus ? (
                    <span className={`badge ${row.isPaid ? 'badge-completed' : 'badge-waiting'}`} style={{ fontSize: '0.75rem' }}>
                      {row.value}
                    </span>
                  ) : (
                    <strong style={{ color: row.teal ? '#0d9488' : '#0b1f3a', textAlign: 'right', maxWidth: '60%' }}>
                      {row.value}
                    </strong>
                  )}
                </div>
              ))}
            </div>

            {/* Payment Callout banner */}
            {!isPaid ? (
              <div style={{ 
                background: '#f0fdfa', 
                border: '1px solid #ccfbf1', 
                borderRadius: '8px', 
                padding: '0.75rem 1rem', 
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#0f766e', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
                    Consultation Fee
                  </span>
                  <span style={{ fontSize: '0.875rem', color: '#134e4a', fontWeight: 600 }}>
                    Pay securely or run demo payment
                  </span>
                </div>
                <button 
                  onClick={() => setShowPaymentModal(true)}
                  className="btn btn-primary"
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  id="pay-token-modal-btn"
                >
                  <CreditCard size={14} /> Pay Fee Now
                </button>
              </div>
            ) : (
              <div style={{ 
                background: '#ecfdf5', 
                border: '1px solid #a7f3d0', 
                borderRadius: '8px', 
                padding: '0.625rem 1rem', 
                marginBottom: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#065f46', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <CheckCircle2 size={16} color="#059669" /> Fee Received &amp; Verified
                </div>
                {receiptData && (
                  <button 
                    onClick={() => setReceiptData(receiptData)}
                    className="btn btn-secondary"
                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    id="view-receipt-from-token-btn"
                  >
                    <Receipt size={13} /> View Receipt
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button 
                onClick={handlePrint} 
                className="btn btn-secondary"
                style={{ flex: '1', minWidth: '130px' }}
                id="print-token-btn"
              >
                <Printer size={15} /> Print Slip
              </button>
              <button 
                onClick={goToDashboard} 
                className="btn btn-primary"
                style={{ flex: '2', minWidth: '170px' }}
                id="go-to-dashboard-btn"
              >
                Go to Patient Portal <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal 
          appointment={appointment}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Receipt Modal */}
      {receiptData && (
        <ReceiptModal 
          receipt={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </>
  );
};
