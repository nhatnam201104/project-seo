package com.projectsale.api.catalog.repository;


import com.projectsale.entity.Product;
import com.projectsale.enums.StatusEnum;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository
    extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {

  Optional<Product> findBySlugAndStatusAndDeletedAtIsNull(String slug, StatusEnum status);

  List<Product>
      findTop4ByCategoryIdAndIdNotAndStatusAndDeletedAtIsNullOrderByRatingAvgDescCreatedAtDescIdDesc(
          Long categoryId, Long id, StatusEnum status);
  @Query(
      value =
          "select p.* from products p "
              + "where p.status='ACTIVE' and p.deleted_at is null "
              + "and match(p.name,p.description) against (:q in natural language mode)",
      countQuery =
          "select count(*) from products p "
              + "where p.status='ACTIVE' and p.deleted_at is null "
              + "and match(p.name,p.description) against (:q in natural language mode)",
      nativeQuery = true)
  Page<Product> searchVisible(@Param("q") String query, Pageable pageable);
}
