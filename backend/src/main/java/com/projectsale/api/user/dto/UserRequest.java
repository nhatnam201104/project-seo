package com.projectsale.api.user.dto;

import com.projectsale.enums.RolesEnum;
import com.projectsale.enums.StatusEnum;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserRequest {

    @Min(value = 2, message = "Fullname must be at least 2 characters long")
    @NotBlank(message = "Fullname is required")
    @Max(value = 200, message = "Fullname must be at most 200 characters long")
    @Pattern(regexp = "^[\\p{L}]+(?:[\\s]+[\\p{L}]+)*$", message = "Full name must contain only letters and spaces")
    private String fullname;

    @NotBlank(message = "Password is required")
    @Min(value = 6, message = "Password must be at least 6 characters long")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*\\d).+$", message = "Password must contain at least one lowercase letter, and one digit")
    @Max(value = 200, message = "Password must be at most 200 characters long")
    private String password;


    @NotBlank(message = "Email is required")
    @Email (message = "Invalid email format")
    private String email;

    
    private String phone;
    private RolesEnum role;
    private StatusEnum status;

    // Getters and setters
}
