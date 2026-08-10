package com.projectsale.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

import com.projectsale.enums.StatusEnum;

import lombok.*;

@Entity
@Table(name = "brands")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Brand {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @Column(nullable = false, length = 120)
  private String name;

  @Column(nullable = false, unique = true, length = 150)
  private String slug;

  @Column(name = "logo_url")
  private String logoUrl;

  @Column(columnDefinition = "TEXT")
  private String info;

  @Column(name = "meta_title")
  private String metaTitle;

  @Column(name = "meta_description")
  private String metaDescription;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private StatusEnum status;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  @PrePersist
  void assignPublicId() {
    if (publicId == null) {
      publicId = UUID.randomUUID();
    }
  }

  public boolean visible() {
    return status == StatusEnum.ACTIVE && deletedAt == null;
  }
}
