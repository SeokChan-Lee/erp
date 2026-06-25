package com.axiserp.customer;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "customers")
public class CustomerEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String code;

    @Column(nullable = false, length = 140)
    private String name;

    @Column(nullable = false, unique = true, length = 40)
    private String businessNumber;

    @Column(nullable = false, length = 80)
    private String contactName;

    @Column(nullable = false, length = 40)
    private String phone;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(nullable = false)
    private boolean active = true;

    protected CustomerEntity() {
    }

    public CustomerEntity(String code, String name, String businessNumber, String contactName, String phone, String email) {
        this.code = code;
        this.name = name;
        this.businessNumber = businessNumber;
        this.contactName = contactName;
        this.phone = phone;
        this.email = email;
        this.active = true;
    }

    public void update(String name, String businessNumber, String contactName, String phone, String email, boolean active) {
        this.name = name;
        this.businessNumber = businessNumber;
        this.contactName = contactName;
        this.phone = phone;
        this.email = email;
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public String getBusinessNumber() {
        return businessNumber;
    }

    public String getContactName() {
        return contactName;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public boolean isActive() {
        return active;
    }
}
