package com.projectsale.api.catalog.repository;

import com.projectsale.entity.Category;
import com.projectsale.enums.StatusEnum;

import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByStatusAndDeletedAtIsNullOrderByNameAsc(StatusEnum status);

    Optional<Category> findBySlugAndStatusAndDeletedAtIsNull(String slug, StatusEnum status);
}
