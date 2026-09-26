package com.projectsale.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.projectsale.enums.StatusEnum;

import lombok.*;

@Entity
@Table(name = "products")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "category_id")
  private Category category;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "brand_id")
  private Brand brand;

  @Column(nullable = false, length = 200)
  private String name;

  @Column(nullable = false, unique = true, length = 220)
  private String slug;

  @Column(columnDefinition = "TEXT")
  private String description;

  @Column(name = "min_price")
  private BigDecimal minPrice;

  @Column(name = "thumbnail_url")
  private String thumbnailUrl;

  @Column(name = "rating_avg")
  private BigDecimal ratingAvg;

  @Column(name = "review_count", nullable = false)
  private int reviewCount;

  @Column(name = "warranty_months")
  private Integer warrantyMonths;

  @Column(name = "meta_title")
  private String metaTitle;

  @Column(name = "meta_description")
  private String metaDescription;

  @Column(name = "og_image")
  private String ogImage;

  @Column(length = 32)
  private String gender;

  @Column(name = "has_lens", nullable = false)
  private boolean hasLens;

  @ElementCollection(fetch = FetchType.LAZY)
  @CollectionTable(name = "product_face_tags", joinColumns = @JoinColumn(name = "product_id"))
  @OrderColumn(name = "tag_order")
  @Column(name = "face_tag", nullable = false, length = 32)
  private List<String> faceTags = new ArrayList<>();

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private StatusEnum status;

  @Column(name = "created_at", insertable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
  @OrderBy("sortOrder asc")
  private List<ProductImage> images = new ArrayList<>();

  @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
  private List<ProductVariant> variants = new ArrayList<>();

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
