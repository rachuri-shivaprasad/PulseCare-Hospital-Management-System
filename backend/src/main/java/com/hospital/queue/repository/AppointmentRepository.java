package com.hospital.queue.repository;

import com.hospital.queue.entity.Appointment;
import com.hospital.queue.entity.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, String> {

    List<Appointment> findByDoctorIdAndDate(String doctorId, String date);

    /**
     * Hospital queue model: multiple patients may book the same doctor+date+timeslot and
     * join the waiting queue. Only prevent the SAME patient from booking twice in the same slot.
     *
     * Returns true when the given patient (by patient entity id) already has a non-cancelled
     * appointment with this doctor, date, and time-slot.
     */
    @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
           "WHERE a.doctorId = :doctorId " +
           "  AND a.date     = :date " +
           "  AND a.timeSlot = :timeSlot " +
           "  AND a.status  != :excludedStatus " +
           "  AND a.patient.id = :patientId")
    boolean existsByDoctorIdAndDateAndTimeSlotAndPatientIdAndStatusNot(
            @Param("doctorId")         String doctorId,
            @Param("date")             String date,
            @Param("timeSlot")         String timeSlot,
            @Param("excludedStatus")   AppointmentStatus excludedStatus,
            @Param("patientId")        Long patientId);

    /**
     * Phone-based duplicate guard for anonymous (unauthenticated) bookings:
     * prevents the same phone number from booking the same slot twice.
     */
    @Query("SELECT COUNT(a) > 0 FROM Appointment a " +
           "WHERE a.doctorId     = :doctorId " +
           "  AND a.date         = :date " +
           "  AND a.timeSlot     = :timeSlot " +
           "  AND a.status      != :excludedStatus " +
           "  AND a.patientPhone = :patientPhone")
    boolean existsByDoctorIdAndDateAndTimeSlotAndPatientPhoneAndStatusNot(
            @Param("doctorId")       String doctorId,
            @Param("date")           String date,
            @Param("timeSlot")       String timeSlot,
            @Param("excludedStatus") AppointmentStatus excludedStatus,
            @Param("patientPhone")   String patientPhone);

    List<Appointment> findByDate(String date);

    List<Appointment> findByDoctorId(String doctorId);

    List<Appointment> findByStatus(AppointmentStatus status);

    List<Appointment> findByDoctorIdAndStatus(String doctorId, AppointmentStatus status);

    // Find the next waiting patient for a specific doctor ordered sequentially
    Optional<Appointment> findFirstByDoctorIdAndStatusOrderByTokenSequenceAsc(String doctorId, AppointmentStatus status);

    // Find active patient currently in consultation for a doctor
    Optional<Appointment> findFirstByDoctorIdAndStatus(String doctorId, AppointmentStatus status);

    // Get max token sequence for a doctor on a specific date to prevent duplicates
    @Query("SELECT COALESCE(MAX(a.tokenSequence), 0) FROM Appointment a WHERE a.doctorId = :doctorId AND a.date = :date")
    Integer findMaxTokenSequenceByDoctorAndDate(@Param("doctorId") String doctorId, @Param("date") String date);

    // Get waiting patients for a doctor and date
    List<Appointment> findByDoctorIdAndDateAndStatusOrderByTokenSequenceAsc(String doctorId, String date, AppointmentStatus status);

    // Search by patient name or token
    List<Appointment> findByPatientNameContainingIgnoreCaseOrTokenNumberContainingIgnoreCase(String name, String token);
}
