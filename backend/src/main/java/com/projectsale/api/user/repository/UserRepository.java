package com.projectsale.api.user.repository;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

import com.projectsale.entity.User;

    
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByPublicId(UUID publicId);

    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
}
