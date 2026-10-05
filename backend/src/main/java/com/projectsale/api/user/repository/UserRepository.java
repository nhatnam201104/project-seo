package com.projectsale.api.user.repository;

import jakarta.persistence.LockModeType;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.projectsale.entity.User;
import com.projectsale.enums.AuthProvider;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Optional<User> findByPublicId(UUID publicId);

    /** Khoá dòng user (SELECT ... FOR UPDATE) để tuần tự hoá các thao tác ghi theo từng người dùng. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.publicId = :publicId")
    Optional<User> findByPublicIdForUpdate(@Param("publicId") UUID publicId);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    Optional<User> findByProviderAndProviderId(AuthProvider provider, String providerId);
}
