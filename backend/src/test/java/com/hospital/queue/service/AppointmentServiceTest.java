package com.hospital.queue.service;

import com.hospital.queue.dto.AppointmentRequest;
import com.hospital.queue.entity.Appointment;
import com.hospital.queue.entity.Doctor;
import com.hospital.queue.entity.Patient;
import com.hospital.queue.repository.AppointmentRepository;
import com.hospital.queue.repository.DoctorRepository;
import com.hospital.queue.repository.PatientRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.hospital.queue.entity.AppointmentStatus;
import org.mockito.ArgumentMatchers;
import java.util.Optional;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private PatientRepository patientRepository;

    @InjectMocks
    private AppointmentService appointmentService;

    private Doctor doctor;

    private Doctor stubDoctor() {
        doctor = new Doctor();
        doctor.setId("doc-1");
        doctor.setName("Dr. Sarah Jenkins");
        doctor.setDepartment("Cardiology");
        doctor.setDoctorCode("DR1");

        when(doctorRepository.findByIdForUpdate("doc-1")).thenReturn(Optional.of(doctor));
        // No slot-level conflict check anymore — multiple patients can share a slot.
        // The phone-based duplicate guard is only triggered after the patient is resolved,
        // which requires patientRepository.findAll() to return an existing patient with a matching phone.
        // For new patients the guard is never reached (new patient is saved first, then checked).
        when(appointmentRepository.findMaxTokenSequenceByDoctorAndDate("doc-1", "2026-10-12"))
                .thenReturn(0);
        when(appointmentRepository.save(any(Appointment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        return doctor;
    }

    @Test
    void createsPatientAndLinksItToAppointmentWhenPhoneIsNew() {
        stubDoctor();
        when(patientRepository.save(any(Patient.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        Appointment created = appointmentService.createAppointment(request());

        assertEquals("Casey Patient", created.getPatient().getName());
        assertEquals("+15550109988", created.getPatient().getPhone());
        verify(patientRepository).save(any(Patient.class));
    }

    @Test
    void reusesExistingPatientWithSamePhone() {
        stubDoctor();
        Patient existingPatient = new Patient("Casey Patient", "+1 555 010 9988", 35, "Other");
        when(patientRepository.findAll()).thenReturn(List.of(existingPatient));
        // Phone-based duplicate guard: no existing appointment for this phone+slot
        when(appointmentRepository.existsByDoctorIdAndDateAndTimeSlotAndPatientPhoneAndStatusNot(
                ArgumentMatchers.anyString(), ArgumentMatchers.anyString(),
                ArgumentMatchers.anyString(), ArgumentMatchers.any(AppointmentStatus.class),
                ArgumentMatchers.anyString()))
                .thenReturn(false);

        Appointment created = appointmentService.createAppointment(request());

        assertSame(existingPatient, created.getPatient());
        verify(patientRepository, never()).save(any(Patient.class));
    }

    private AppointmentRequest request() {
        AppointmentRequest request = new AppointmentRequest();
        request.setPatientName(" Casey Patient ");
        request.setPatientPhone(" +1 555 010 9988 ");
        request.setPatientAge(35);
        request.setPatientGender("Other");
        request.setDoctorId("doc-1");
        request.setDate("2026-10-12");
        request.setTimeSlot("10:00 AM");
        request.setSymptoms("Checkup");
        return request;
    }
}