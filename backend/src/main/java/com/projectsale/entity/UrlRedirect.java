package com.projectsale.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "url_redirects")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UrlRedirect {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @Column(name = "old_path", nullable = false, unique = true)
  private String oldPath;

  @Column(name = "new_path", nullable = false)
  private String newPath;

  @Column(nullable = false)
  private int status;

  @Column(name = "created_at", insertable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void assignPublicId() {
    if (publicId == null) {
      publicId = UUID.randomUUID();
    }
  }
}