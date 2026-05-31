package com.stockapp.auth.config;

import com.stockapp.auth.entity.Role;
import com.stockapp.auth.entity.User;
import com.stockapp.auth.repository.RoleRepository;
import com.stockapp.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(ApplicationArguments args) {
        // Seed default roles
        seedRole("ADMIN");
        seedRole("TRADER");
        seedRole("VIEWER");

        // Seed default admin user
        if (!userRepository.existsByEmail("admin@stockapp.com")) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail("admin@stockapp.com");
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("Admin@123"));
            admin.setMobile("9999999999");
            admin.setRole(roleRepository.findByRoleName("ADMIN").orElse(null));
            admin.setActive(true);
            userRepository.save(admin);
            log.info("Default admin user created: admin@stockapp.com / Admin@123");
        }
    }

    private void seedRole(String name) {
        if (!roleRepository.existsByRoleName(name)) {
            roleRepository.save(new Role(name));
            log.info("Seeded role: {}", name);
        }
    }
}
