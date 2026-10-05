package com.projectsale.api.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

/** Khớp kiểu {@code Address} ở frontend; {@code id} là public id. */
public record AddressResponse(
    UUID id,
    @JsonProperty("receiver_name") String receiverName,
    @JsonProperty("receiver_phone") String receiverPhone,
    String line,
    String ward,
    String district,
    String city,
    @JsonProperty("is_default") boolean isDefault) {
}
