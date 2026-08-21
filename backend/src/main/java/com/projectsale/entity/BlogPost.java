package com.projectsale.entity;

import com.projectsale.enums.BlogStatusEnum;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "blog_posts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BlogPost {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "author_id")
  private User author;

  @Column(nullable = false, length = 200)
  private String title;

  @Column(nullable = false, unique = true, length = 220)
  private String slug;

  @Column(length = 300)
  private String excerpt;

  @Column(columnDefinition = "TEXT")
  private String content;

  @Column(name = "cover_image")
  private String coverImage;

  @Column(name = "meta_title")
  private String metaTitle;

  @Column(name = "meta_description")
  private String metaDescription;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private BlogStatusEnum status;

  @Column(name = "published_at")
  private Instant publishedAt;

  @Column(name = "created_at", insertable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void assignPublicId() {
    if (publicId == null) {
      publicId = UUID.randomUUID();
    }
  }
}