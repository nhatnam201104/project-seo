package com.projectsale.api.catalog.controller;

import static com.projectsale.api.catalog.dto.CatalogDtos.CategoryDetail;
import static com.projectsale.api.catalog.dto.CatalogDtos.CategoryResponse;
import static com.projectsale.api.catalog.dto.CatalogDtos.CategoryTree;

import com.projectsale.api.catalog.service.CatalogService;
import com.projectsale.api.common.response.ApiResponse;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/categories")
public class CategoryController {

  private final CatalogService catalogService;

  public CategoryController(CatalogService catalogService) {
    this.catalogService = catalogService;
  }

  @GetMapping
  public ApiResponse<List<CategoryResponse>> list() {
    return ApiResponse.ok(catalogService.categories());
  }

  @GetMapping("/tree")
  public ApiResponse<List<CategoryTree>> tree() {
    return ApiResponse.ok(catalogService.categoryTree());
  }

  @GetMapping("/{slug}")
  public ApiResponse<CategoryDetail> detail(@PathVariable String slug) {
    return ApiResponse.ok(catalogService.category(slug));
  }
}
