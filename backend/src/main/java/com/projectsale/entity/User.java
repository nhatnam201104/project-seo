package com.projectsale.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

import com.projectsale.enums.RolesEnum;
import com.projectsale.enums.StatusEnum;

import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class User {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @Column(nullable = false, unique = true, length = 190)
  private String email;

  @Column(name = "password_hash", nullable = false, length = 100)
  private String passwordHash;

  @Column(name = "full_name", length = 120)
  private String fullName;

  @Column(length = 20, unique = true)
  private String phone;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private RolesEnum role;

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
  }

  public boolean isActive() {
    return status == StatusEnum.ACTIVE && deletedAt == null;
  }
}
