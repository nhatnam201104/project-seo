package com.projectsale.entity;

import jakarta.persistence.*;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "addresses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Address {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(name = "receiver_name", nullable = false, length = 120)
  private String receiverName;

  @Column(name = "receiver_phone", nullable = false, length = 20)
  private String receiverPhone;

  @Column(nullable = false)
  private String line;

  @Column(length = 120)
  private String ward;

  @Column(length = 120)
  private String district;

  @Column(nullable = false, length = 120)
  private String city;

  @Column(name = "is_default", nullable = false)
  private boolean isDefault;

  @PrePersist
  void assignPublicId() {
    if (publicId == null) {
      publicId = UUID.randomUUID();
    }
  }
}