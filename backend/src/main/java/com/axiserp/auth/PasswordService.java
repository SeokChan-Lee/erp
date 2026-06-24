package com.axiserp.auth;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class PasswordService {

    private static final String BCRYPT_PREFIX = "{bcrypt}";

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public String encode(String rawPassword) {
        return BCRYPT_PREFIX + encoder.encode(rawPassword);
    }

    public boolean matches(String rawPassword, String storedPassword) {
        if (storedPassword == null) {
            return false;
        }
        if (storedPassword.startsWith(BCRYPT_PREFIX)) {
            return encoder.matches(rawPassword, storedPassword.substring(BCRYPT_PREFIX.length()));
        }
        return storedPassword.equals(rawPassword);
    }

    public boolean needsUpgrade(String storedPassword) {
        return storedPassword == null || !storedPassword.startsWith(BCRYPT_PREFIX);
    }
}
