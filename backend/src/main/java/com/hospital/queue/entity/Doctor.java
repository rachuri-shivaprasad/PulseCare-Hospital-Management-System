package com.hospital.queue.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "doctors")
public class Doctor {

    @Id
    @Column(name = "id", length = 32)
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String department;

    private String title;
    private String degree;
    private String experience;
    private Double rating;
    private Integer reviewsCount;
    private String roomNumber;
    private String consultationFee;
    private String availability;
    private String nextAvailableSlot;
    
    @Column(length = 1000)
    private String avatar;

    @Column(length = 1000)
    private String bio;

    @Column(name = "doctor_code", length = 16)
    private String doctorCode; // e.g. "DR1", "DR2"

    public Doctor() {}

    public Doctor(String id, String name, String department, String title, String degree, 
                  String experience, Double rating, Integer reviewsCount, String roomNumber, 
                  String consultationFee, String availability, String nextAvailableSlot, 
                  String avatar, String bio, String doctorCode) {
        this.id = id;
        this.name = name;
        this.department = department;
        this.title = title;
        this.degree = degree;
        this.experience = experience;
        this.rating = rating;
        this.reviewsCount = reviewsCount;
        this.roomNumber = roomNumber;
        this.consultationFee = consultationFee;
        this.availability = availability;
        this.nextAvailableSlot = nextAvailableSlot;
        this.avatar = avatar;
        this.bio = bio;
        this.doctorCode = doctorCode;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDegree() { return degree; }
    public void setDegree(String degree) { this.degree = degree; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }

    public Integer getReviewsCount() { return reviewsCount; }
    public void setReviewsCount(Integer reviewsCount) { this.reviewsCount = reviewsCount; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getConsultationFee() { return consultationFee; }
    public void setConsultationFee(String consultationFee) { this.consultationFee = consultationFee; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public String getNextAvailableSlot() { return nextAvailableSlot; }
    public void setNextAvailableSlot(String nextAvailableSlot) { this.nextAvailableSlot = nextAvailableSlot; }

    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getDoctorCode() { return doctorCode; }
    public void setDoctorCode(String doctorCode) { this.doctorCode = doctorCode; }
}
