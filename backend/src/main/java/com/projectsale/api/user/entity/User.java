package com.projectsale.api.user.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "users")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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
  @Column(length = 20)
  private String phone;
  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "user_role")
  private UserRole role;
  @Enumerated(EnumType.STRING)
  @JdbcTypeCode(SqlTypes.NAMED_ENUM)
  @Column(nullable = false, columnDefinition = "entity_status")
  private EntityStatus status;
  @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
  private Instant createdAt;
  @Column(name = "updated_at")
  private Instant updatedAt;
  @Column(name = "deleted_at")
  private Instant deletedAt;

  public User(String email, String passwordHash, String fullName, String phone) {
    this.email = email;
    this.passwordHash = passwordHash;
    this.fullName = fullName;
    this.phone = phone;
    this.role = UserRole.USER;
    this.status = EntityStatus.ACTIVE;
  }

  @PrePersist
  void assignPublicId() {
    if (publicId == null)
      publicId = UUID.randomUUID();
  }

  public boolean isActive() {
    return status == EntityStatus.ACTIVE && deletedAt == null;
  }
}
