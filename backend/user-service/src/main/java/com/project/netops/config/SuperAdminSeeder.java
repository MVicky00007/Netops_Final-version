package com.project.netops.config;

import com.project.netops.model.User;
import com.project.netops.repository.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds a built-in super-admin account the first time this service starts
 * against a fresh database.
 *
 * Goal: anyone who clones the repo and runs `mvn spring-boot:run` should be
 * able to log in immediately, without having to hit /signup and then manually
 * flip a status flag in MySQL.
 *
 * Credentials (override via env vars or application.properties if you want):
 *   email:    superadmin@netops.com   (or ${netops.superadmin.email})
 *   password: SuperAdmin@123          (or ${netops.superadmin.password})
 *   role:     ADMIN
 *   status:   ACTIVE                  (so the JwtFilter accepts the token)
 *
 * The check is idempotent — restarting the service does NOT reset the
 * password if you've already changed it. If you ever forget the password,
 * just delete the row in MySQL and restart.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SuperAdminSeeder implements CommandLineRunner {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    // Hard-coded defaults so a fresh clone "just works". Override with
    // -Dnetops.superadmin.email=... or environment variables in production.
    private static final String DEFAULT_EMAIL    = "superadmin@netops.com";
    private static final String DEFAULT_PASSWORD = "SuperAdmin@123";
    private static final String DEFAULT_NAME     = "Super Admin";
    private static final String DEFAULT_PHONE    = "0000000000";

    @Override
    public void run(String... args) {
        String email = System.getProperty("netops.superadmin.email",
                System.getenv().getOrDefault("NETOPS_SUPERADMIN_EMAIL", DEFAULT_EMAIL));
        String password = System.getProperty("netops.superadmin.password",
                System.getenv().getOrDefault("NETOPS_SUPERADMIN_PASSWORD", DEFAULT_PASSWORD));

        // Optional one-shot password reset path: if the env var/system property
        // NETOPS_SUPERADMIN_RESET is "true", overwrite the existing super-admin's
        // password (and re-activate the row) without violating FK constraints.
        boolean reset = Boolean.parseBoolean(
                System.getProperty("netops.superadmin.reset",
                        System.getenv().getOrDefault("NETOPS_SUPERADMIN_RESET", "false")));

        User existing = userRepo.findByEmail(email);
        if (existing != null) {
            if (reset) {
                existing.setPassword(passwordEncoder.encode(password));
                existing.setRole(User.Role.ADMIN);
                existing.setStatus(User.Status.ACTIVE);
                userRepo.save(existing);
                log.warn("====================================================================");
                log.warn(" Super-admin password RESET for {}", email);
                log.warn("   new password = {}", password);
                log.warn(" Now unset NETOPS_SUPERADMIN_RESET and restart.");
                log.warn("====================================================================");
            } else {
                log.info("Super-admin already exists ({}). Skipping seed.", email);
            }
            return;
        }

        User admin = new User();
        admin.setName(DEFAULT_NAME);
        admin.setEmail(email);
        admin.setPhone(DEFAULT_PHONE);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRole(User.Role.ADMIN);
        admin.setStatus(User.Status.ACTIVE);
        userRepo.save(admin);

        log.warn("====================================================================");
        log.warn(" Seeded built-in super-admin:");
        log.warn("   email    = {}", email);
        log.warn("   password = {}", password);
        log.warn("   role     = ADMIN   status = ACTIVE");
        log.warn(" CHANGE THE PASSWORD AFTER FIRST LOGIN.");
        log.warn("====================================================================");
    }
}
