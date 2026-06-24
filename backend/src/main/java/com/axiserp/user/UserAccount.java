package com.axiserp.user;

import java.util.Set;

public record UserAccount(
        String username,
        String password,
        String displayName,
        Set<Role> roles
) {
}

