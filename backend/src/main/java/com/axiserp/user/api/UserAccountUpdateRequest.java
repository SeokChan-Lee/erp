package com.axiserp.user.api;

import com.axiserp.user.Role;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record UserAccountUpdateRequest(
        @Size(min = 4) String password,
        @Size(min = 1) Set<Role> roles
) {
}
