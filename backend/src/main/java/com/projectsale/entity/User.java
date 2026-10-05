package com.projectsale.entity;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import com.projectsale.enums.AuthProvider;
import com.projectsale.enums.Gender;
import com.projectsale.enums.RolesEnum;
import com.projectsale.enums.StatusEnum;

import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
// @NoArgsConstructor(access = AccessLevel.PROTECTED)
@NoArgsConstructor
@AllArgsConstructor
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @Column(nullable = false, unique = true, length = 190)
  private String email;

  @Column(name = "password_hash", length = 100)
  private String passwordHash;

  @Column(name = "full_name", length = 120)
  private String fullName;

  @Column(length = 20, unique = true)
  private String phone;

  @Column(name = "date_of_birth")
  private LocalDate dateOfBirth;

  @Enumerated(EnumType.STRING)
  @Column(length = 16)
  private Gender gender;

  @Column(name = "avatar_url")
  private String avatarUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private RolesEnum role;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private AuthProvider provider;

  /** Subject ({@code sub}) của nhà cung cấp OIDC; null với tài khoản LOCAL. */
  @Column(name = "provider_id", length = 255)
  private String providerId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private StatusEnum status;
  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  @PrePersist
  void assignDefaultValues() {
    if (publicId == null) {
      publicId = UUID.randomUUID();
    }
    if (role == null) {
      role = RolesEnum.USER;
    }
    if (provider == null) {
      provider = AuthProvider.LOCAL;
    }
  }

  public boolean isActive() {
    return status == StatusEnum.ACTIVE && deletedAt == null;
  }
}
