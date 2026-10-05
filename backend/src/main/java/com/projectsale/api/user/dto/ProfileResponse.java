package com.projectsale.api.user.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.projectsale.enums.Gender;
import java.time.LocalDate;
import java.util.UUID;

/** GET/PUT /users/me — khớp kiểu {@code Profile} ở frontend. */
public record ProfileResponse(
    UUID id,
    String email,
    @JsonProperty("full_name") String fullName,
    String phone,
    @JsonProperty("date_of_birth") @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd") LocalDate dateOfBirth,
    Gender gender,
    @JsonProperty("avatar_url") String avatarUrl) {
}
