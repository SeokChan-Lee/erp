package com.axiserp.customer.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomerCreateRequest(
        @NotBlank @Size(max = 60) String code,
        @NotBlank @Size(max = 140) String name,
        @NotBlank @Size(max = 40) String businessNumber,
        @NotBlank @Size(max = 80) String contactName,
        @NotBlank @Size(max = 40) String phone,
        @NotBlank @Email @Size(max = 120) String email
) {
}
