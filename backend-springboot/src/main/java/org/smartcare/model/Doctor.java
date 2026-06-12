package org.smartcare.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "doctors")
public class Doctor {
    @Id
    private String id;
    private String name;
    private String email;
    private String password;
    private String specialization;
    private int experience;
    private String availability;
    private String imageUrl;
    private int currentToken;

    // Default constructor
    public Doctor() {}

    public Doctor(String id, String name, String email, String password, String specialization, int experience, String availability, String imageUrl, int currentToken) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.specialization = specialization;
        this.experience = experience;
        this.availability = availability;
        this.imageUrl = imageUrl;
        this.currentToken = currentToken;
    }

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public int getExperience() { return experience; }
    public void setExperience(int experience) { this.experience = experience; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }

    public int getCurrentToken() { return currentToken; }
    public void setCurrentToken(int currentToken) { this.currentToken = currentToken; }
}
