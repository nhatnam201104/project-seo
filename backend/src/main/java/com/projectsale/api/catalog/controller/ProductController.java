package com.projectsale.api.catalog.controller;

import static com.projectsale.api.catalog.dto.CatalogDtos.ProductDetail;
import static com.projectsale.api.catalog.dto.CatalogDtos.ProductSummary;

import com.projectsale.api.catalog.service.CatalogService;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.response.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/products")
@Validated
public class ProductController {

  private static final Set<String> LIST_PARAMS = Set.of(
      "categoryId", "brandId", "minPrice", "maxPrice", "color", "gender", "hasLens", "faceTag",
      "page", "size", "sort");
  private static final Set<String> SEARCH_PARAMS = Set.of("q", "page", "size", "sort");

  private final CatalogService catalogService;

  public ProductController(CatalogService catalogService) {
    this.catalogService = catalogService;
  }

  @GetMapping
  public ApiResponse<List<ProductSummary>> list(
      @RequestParam(required = false) UUID categoryId,
      @RequestParam(required = false) UUID brandId,
      @RequestParam(required = false) BigDecimal minPrice,
      @RequestParam(required = false) BigDecimal maxPrice,
      @RequestParam(required = false) String color,
      @RequestParam(required = false) String gender,
      @RequestParam(required = false) Boolean hasLens,
      @RequestParam(required = false) String faceTag,
      @RequestParam(defaultValue = "0") @Min(value = 0, message = "page phải >= 0") int page,
      @RequestParam(defaultValue = "20") @Min(value = 1, message = "size phải >= 1") @Max(value = 100, message = "size không được vượt quá 100") int size,
      @RequestParam(defaultValue = "createdAt,desc") String sort,
      HttpServletRequest request) {
    rejectUnknownParameters(request, LIST_PARAMS);
    return ApiResponse.page(
        catalogService.list(
            categoryId, brandId, minPrice, maxPrice, color, gender, hasLens, faceTag, page, size,
            sort));
  }

  @GetMapping("/search")
  public ApiResponse<List<ProductSummary>> search(
      @RequestParam @NotBlank(message = "q không được để trống") @Size(min = 2, max = 100, message = "q phải có từ 2 đến 100 ký tự") String q,
      @RequestParam(defaultValue = "0") @Min(value = 0, message = "page phải >= 0") int page,
      @RequestParam(defaultValue = "20") @Min(value = 1, message = "size phải >= 1") @Max(value = 100, message = "size không được vượt quá 100") int size,
      @RequestParam(defaultValue = "createdAt,desc") String sort,
      HttpServletRequest request) {
    rejectUnknownParameters(request, SEARCH_PARAMS);
    return ApiResponse.page(catalogService.search(q, page, size, sort));
  }

  @GetMapping("/{slug}")
  public ApiResponse<ProductDetail> detail(@PathVariable String slug) {
    return ApiResponse.ok(catalogService.detail(slug));
  }

  @GetMapping("/{slug}/related")
  public ApiResponse<List<ProductSummary>> related(@PathVariable String slug) {
    return ApiResponse.ok(catalogService.related(slug));
  }

  private void rejectUnknownParameters(HttpServletRequest request, Set<String> allowedParams) {
    for (String parameter : request.getParameterMap().keySet()) {
      if (!allowedParams.contains(parameter)) {
        throw AppException.validation("Tham số không hợp lệ: " + parameter);
      }
    }
  }
}
