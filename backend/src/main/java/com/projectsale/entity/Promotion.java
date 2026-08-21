package com.projectsale.entity;

import com.projectsale.enums.PromotionTypeEnum;
import com.projectsale.enums.StatusEnum;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "promotions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Promotion {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @Column(nullable = false, unique = true, length = 40)
  private String code;

  @Column(length = 150)
  private String name;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private PromotionTypeEnum type;

  @Column(nullable = false)
  private BigDecimal value;

  @Column(name = "min_value")
  private BigDecimal minValue;

  @Column(name = "usage_limit")
  private Integer usageLimit;

  @Column(name = "used_count", nullable = false)
  private int usedCount;

  @Column(name = "start_at")
  private Instant startAt;

  @Column(name = "end_at")
  private Instant endAt;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private StatusEnum status;

  @PrePersist
  void assignPublicId() {
    if (publicId == null) {
      publicId = UUID.randomUUID();
    }
  }
}