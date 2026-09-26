package com.projectsale.api.catalog.service;

import com.projectsale.entity.Product;
import com.projectsale.entity.ProductVariant;
import com.projectsale.enums.StatusEnum;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.jpa.domain.Specification;

/**
 * Dựng {@link Specification} lọc sản phẩm hiển thị (ACTIVE, chưa xoá mềm) theo
 * bộ tiêu chí.
 */
final class ProductSpecifications {

  private ProductSpecifications() {
  }

  static Specification<Product> filter(
      UUID categoryId,
      UUID brandId,
      BigDecimal minPrice,
      BigDecimal maxPrice,
      String color,
      String gender,
      Boolean hasLens,
      String faceTag) {
    return (root, query, builder) -> {
      List<Predicate> predicates = new ArrayList<>();
      predicates.add(builder.equal(root.get("status"), StatusEnum.ACTIVE));
      predicates.add(builder.isNull(root.get("deletedAt")));

      if (categoryId != null) {
        predicates.add(builder.equal(root.join("category").get("publicId"), categoryId));
      }
      if (brandId != null) {
        predicates.add(builder.equal(root.join("brand").get("publicId"), brandId));
      }
      if (minPrice != null) {
        predicates.add(builder.greaterThanOrEqualTo(root.get("minPrice"), minPrice));
      }
      if (maxPrice != null) {
        predicates.add(builder.lessThanOrEqualTo(root.get("minPrice"), maxPrice));
      }
      if (gender != null && !gender.isBlank()) {
        predicates.add(
            builder.equal(builder.lower(root.get("gender")), normalize(gender)));
      }
      if (hasLens != null) {
        predicates.add(builder.equal(root.get("hasLens"), hasLens));
      }
      if (faceTag != null && !faceTag.isBlank()) {
        Join<Product, String> faceTags = root.join("faceTags");
        predicates.add(builder.equal(builder.lower(faceTags), normalize(faceTag)));
        query.distinct(true);
      }
      if (color != null && !color.isBlank()) {
        Subquery<Integer> variantSubquery = query.subquery(Integer.class);
        Root<ProductVariant> variant = variantSubquery.from(ProductVariant.class);
        variantSubquery
            .select(builder.literal(1))
            .where(
                builder.equal(variant.get("product"), root),
                builder.isNull(variant.get("deletedAt")),
                builder.equal(builder.lower(variant.get("color")), normalize(color)));
        predicates.add(builder.exists(variantSubquery));
      }

      return builder.and(predicates.toArray(Predicate[]::new));
    };
  }

  private static String normalize(String value) {
    return value.trim().toLowerCase(Locale.ROOT);
  }
}
