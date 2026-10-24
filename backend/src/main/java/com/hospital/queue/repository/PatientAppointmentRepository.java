package com.hospital.queue.repository;

import com.hospital.queue.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PatientAppointmentRepository extends JpaRepository<Appointment, String> {

    List<Appointment> findByPatient_IdOrderByDateDescTokenSequenceAsc(Long patientId);
}