package com.projectsale.entity;

import com.projectsale.enums.OrderStatusEnum;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "public_id", nullable = false, unique = true, updatable = false)
  private UUID publicId;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(name = "order_code", nullable = false, unique = true, length = 30)
  private String orderCode;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "promotion_id")
  private Promotion promotion;

  @Column(nullable = false)
  private BigDecimal subtotal;

  @Column(name = "discount_amount", nullable = false)
  private BigDecimal discountAmount;

  @Column(name = "shipping_fee", nullable = false)
  private BigDecimal shippingFee;

  @Column(nullable = false)
  private BigDecimal total;

  @Column(name = "shipping_address", nullable = false, length = 500)
  private String shippingAddress;

  @Column(name = "receiver_name", length = 120)
  private String receiverName;

  @Column(name = "receiver_phone", length = 20)
  private String receiverPhone;

  @Column(name = "tracking_code", length = 60)
  private String trackingCode;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 16)
  private OrderStatusEnum status;

  @Column(length = 500)
  private String note;

  @Column(name = "created_at", insertable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at")
  private Instant updatedAt;

  @Version
  @Column(nullable = false)
  private int version;

  @OneToMany(mappedBy = "order", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
  private List<OrderItem> items = new ArrayList<>();

  @PrePersist
  void assignPublicId() {
    if (publicId == null) {
      publicId = UUID.randomUUID();
    }
  }
}