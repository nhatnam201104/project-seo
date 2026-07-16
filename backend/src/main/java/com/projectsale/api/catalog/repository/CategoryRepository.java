package com.projectsale.api.catalog.repository;

import com.projectsale.api.catalog.entity.Category;
import com.projectsale.api.user.entity.EntityStatus;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findAllByStatusAndDeletedAtIsNullOrderByNameAsc(EntityStatus status);

    Optional<Category> findBySlugAndStatusAndDeletedAtIsNull(String slug, EntityStatus status);
}
