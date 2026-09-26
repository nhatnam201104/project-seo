package com.projectsale.entity;

import com.projectsale.enums.PaymentMethodEnum;
import com.projectsale.enums.PaymentStatusEnum;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "payments")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Payment {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "order_id")
  private Order order;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 24)
  private PaymentMethodEnum method;

  @Column(nullable = false)
  private BigDecimal amount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private PaymentStatusEnum status;

  @Column(name = "payment_ref", length = 120)
  private String paymentRef;

  @Column(name = "paid_at")
  private Instant paidAt;

  @Column(name = "created_at", insertable = false, updatable = false)
  private Instant createdAt;

  @PrePersist
  void assignPublicId() {
    if (publicId == null) {
      publicId = UUID.randomUUID();
    }
  }
}