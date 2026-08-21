package com.projectsale.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "product_variants")
@org.hibernate.annotations.SQLRestriction("deleted_at is null")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProductVariant {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "product_id")
  private Product product;

  @Column(nullable = false, unique = true, length = 64)
  private String sku;

  @Column(length = 60)
  private String color;

  @Column(length = 30)
  private String size;

  @Column(length = 60)
  private String material;

  @Column(name = "lens_option")
  private String lensOption;

  @Column(nullable = false)
  private BigDecimal price;

  @Column(name = "stock_qty", nullable = false)
  private int stockQty;

  @Version
  @Column(nullable = false)
  private int version;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  @PrePersist
  void assignPublicId() {
    if (publicId == null) {
      publicId = UUID.randomUUID();
    }
  }
}
