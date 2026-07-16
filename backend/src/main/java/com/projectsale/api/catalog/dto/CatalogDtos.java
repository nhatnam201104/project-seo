package com.projectsale.api.catalog.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO response cho catalog. Body giữ quy ước snake_case theo contract hiện có.
 */
public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record ProductSummary(
            UUID id,
            String name,
            String slug,
            @JsonProperty("min_price") BigDecimal minPrice,
            @JsonProperty("thumbnail_url") String thumbnailUrl,
            @JsonProperty("rating_avg") BigDecimal ratingAvg,
            @JsonProperty("review_count") int reviewCount,
            String status) {
    }

    public record ProductVariantResponse(
            @JsonProperty("variant_id") UUID variantId,
            String sku,
            String color,
            String size,
            String material,
            @JsonProperty("lens_option") String lensOption,
            BigDecimal price,
            @JsonProperty("stock_qty") int stockQty) {
    }

    public record ProductImageResponse(String url, String alt, @JsonProperty("sort_order") int sortOrder) {
    }

    public record NamedRef(String name, String slug) {
    }

    public record ProductDetail(
            UUID id,
            String name,
            String slug,
            String description,
            NamedRef brand,
            NamedRef category,
            @JsonProperty("min_price") BigDecimal minPrice,
            @JsonProperty("rating_avg") BigDecimal ratingAvg,
            @JsonProperty("review_count") int reviewCount,
            @JsonProperty("warranty_months") Integer warrantyMonths,
            @JsonProperty("meta_title") String metaTitle,
            @JsonProperty("meta_description") String metaDescription,
            @JsonProperty("has_lens") boolean hasLens,
            String gender,
            @JsonProperty("face_tags") List<String> faceTags,
            List<ProductImageResponse> images,
            List<ProductVariantResponse> variants) {
    }

    public record CategoryResponse(
            UUID id,
            String name,
            String slug,
            @JsonProperty("image_url") String imageUrl,
            @JsonProperty("parent_id") UUID parentId) {
    }

    public record CategoryDetail(
            UUID id,
            String name,
            String slug,
            @JsonProperty("image_url") String imageUrl,
            @JsonProperty("parent_id") UUID parentId,
            @JsonProperty("meta_title") String metaTitle,
            @JsonProperty("meta_description") String metaDescription) {
    }

    public record CategoryTree(
            UUID id,
            String name,
            String slug,
            @JsonProperty("image_url") String imageUrl,
            @JsonProperty("parent_id") UUID parentId,
            List<CategoryTree> children) {
    }

    public record BrandResponse(
            UUID id, String name, String slug, @JsonProperty("logo_url") String logoUrl) {
    }

    public record BrandDetail(
            UUID id,
            String name,
            String slug,
            @JsonProperty("logo_url") String logoUrl,
            String info,
            @JsonProperty("meta_title") String metaTitle,
            @JsonProperty("meta_description") String metaDescription) {
    }
}
