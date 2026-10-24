package com.hospital.queue.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "patients")
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true, length = 32)
    private String phone;

    private Integer age;
    private String gender;

    @JsonIgnore
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(length = 32)
    private String role = "ROLE_PATIENT";

    public Patient() {}

    public Patient(String name, String phone, Integer age, String gender) {
        this.name = name;
        this.phone = phone;
        this.age = age;
        this.gender = gender;
        this.role = "ROLE_PATIENT";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    @JsonIgnore
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getRole() { return role != null && !role.isBlank() ? role : "ROLE_PATIENT"; }
    public void setRole(String role) { this.role = role; }
}
