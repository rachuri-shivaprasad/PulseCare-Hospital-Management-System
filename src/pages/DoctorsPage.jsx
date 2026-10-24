import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Stethoscope, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  Star, 
  CheckCircle2,
  CalendarPlus
} from 'lucide-react';
import { useAppointmentQueue } from '../context/AppointmentQueueContext';
import { hospitalDepartments } from '../data/mockDoctors';

export const DoctorsPage = () => {
  const { doctors, activeConsultations } = useAppointmentQueue();
  const [selectedDept, setSelectedDept] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDoctors = doctors.filter(doc => {
    const matchesDept = selectedDept === "All" || doc.department.toLowerCase() === selectedDept.toLowerCase();
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="page-header-eyebrow">
            <Stethoscope size={14} /> Clinical Faculty
          </div>
          <h1>Find Doctors &amp; Specialists</h1>
          <p>
            Connect with our certified medical consultants, review their OPD hours, qualifications, 
            and book a verified queue appointment slot.
          </p>
        </div>
      </div>

      <div className="app-container">
        {/* Search & Filter Bar */}
        <div className="med-card" style={{ marginBottom: '2rem', padding: '1.25rem 1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Search by name, specialty, or condition…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '2.5rem' }}
                id="doctor-search"
                aria-label="Search doctors"
              />
            </div>

            <div style={{ fontSize: '0.875rem', color: '#64748b', flexShrink: 0 }}>
              Showing <strong style={{ color: '#0b1f3a' }}>{filteredDoctors.length}</strong> of {doctors.length} doctors
            </div>
          </div>

          {/* Department Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {hospitalDepartments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`filter-pill ${selectedDept === dept ? 'active' : ''}`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Doctor Grid */}
        {filteredDoctors.length === 0 ? (
          <div className="med-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
            <Stethoscope size={40} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Doctors Found</h3>
            <p style={{ color: '#64748b', fontSize: '0.9375rem', marginBottom: '1.25rem' }}>
              No specialist matches your current criteria. Try adjusting your search or department filter.
            </p>
            <button 
              onClick={() => { setSelectedDept("All"); setSearchQuery(""); }} 
              className="btn btn-primary"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {filteredDoctors.map((doctor) => {
              const isConsulting = activeConsultations.some(a => a.doctorId === doctor.id);

              return (
                <div key={doctor.id} className="doctor-card">
                  {/* Profile Row */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img 
                        src={doctor.avatar} 
                        alt={doctor.name} 
                        className="doctor-avatar"
                      />
                      <span style={{
                        position: 'absolute',
                        bottom: '-5px',
                        right: '-5px',
                        background: isConsulting ? '#0369a1' : '#059669',
                        color: 'white',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        padding: '2px 5px',
                        borderRadius: '999px',
                        border: '2px solid white',
                        whiteSpace: 'nowrap'
                      }}>
                        {isConsulting ? 'In Cabin' : 'Available'}
                      </span>
                    </div>

                    <div style={{ flex: 1 }}>
                      <span className="doctor-dept-tag">{doctor.department}</span>
                      <h3 style={{ fontSize: '1.0625rem', margin: '0 0 0.15rem', color: '#0b1f3a' }}>{doctor.name}</h3>
                      <p style={{ color: '#64748b', fontSize: '0.8125rem', fontWeight: 500 }}>{doctor.degree}</p>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem', fontSize: '0.8125rem' }}>
                        <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}>
                          <Star size={13} fill="#d97706" /> {doctor.rating}
                        </span>
                        <span style={{ color: '#94a3b8' }}>·</span>
                        <span style={{ color: '#64748b' }}>{doctor.experience} Exp</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p style={{ color: '#475569', fontSize: '0.875rem', lineHeight: 1.55, marginBottom: '1rem', flex: 1 }}>
                    {doctor.bio}
                  </p>

                  {/* Meta Info */}
                  <div style={{ 
                    border: '1px solid #f1f5f9', 
                    borderRadius: '8px', 
                    overflow: 'hidden',
                    marginBottom: '1rem'
                  }}>
                    <div className="doctor-meta-row" style={{ padding: '0.5rem 0.875rem' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                        <MapPin size={13} color="#0d9488" /> OPD Cabin:
                      </span>
                      <strong style={{ color: '#0b1f3a', fontSize: '0.875rem' }}>{doctor.roomNumber}</strong>
                    </div>
                    <div className="doctor-meta-row" style={{ padding: '0.5rem 0.875rem' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                        <Clock size={13} color="#0d9488" /> OPD Days:
                      </span>
                      <span style={{ color: '#334155', fontSize: '0.8125rem' }}>{doctor.availability}</span>
                    </div>
                    <div className="doctor-meta-row" style={{ padding: '0.5rem 0.875rem', border: 'none' }}>
                      <span style={{ color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
                        <Calendar size={13} color="#0d9488" /> Next Slot:
                      </span>
                      <strong style={{ color: '#059669', fontSize: '0.875rem' }}>{doctor.nextAvailableSlot}</strong>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link 
                    to={`/book?doctorId=${doctor.id}`} 
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                  >
                    <CalendarPlus size={15} /> Book Appointment with {doctor.name.split(' ')[1]}
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
