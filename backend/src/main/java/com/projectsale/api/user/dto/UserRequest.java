package com.projectsale.api.user.dto;

import com.projectsale.enums.RolesEnum;
import com.projectsale.enums.StatusEnum;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserRequest {

    @NotBlank(message = "Fullname is required")
    @Size(min = 2, max = 200, message = "Fullname must be between 2 and 200 characters long")
    @Pattern(regexp = "^[\\p{L}]+(?:[\\s]+[\\p{L}]+)*$", message = "Full name must contain only letters and spaces")
    private String fullname;

    @NotBlank(message = "Password is required")
    @Pattern(regexp = "^(?=.*[a-z])(?=.*\\d).+$", message = "Password must contain at least one lowercase letter, and one digit")
    @Size(min = 6, max = 200, message = "Password must be between 6 and 200 characters long")
    private String password;


    @NotBlank(message = "Email is required")
    @Email (message = "Invalid email format")
    private String email;

    
    private String phone;
    private RolesEnum role;
    private StatusEnum status;

    // Getters and setters
}
