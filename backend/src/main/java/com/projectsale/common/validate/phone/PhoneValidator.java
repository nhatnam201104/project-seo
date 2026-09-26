package com.projectsale.common.validate.phone;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class PhoneValidator
        implements ConstraintValidator<ValidPhone, String> {

    private static final Pattern PHONE_PATTERN = Pattern.compile("^(0|\\+84)(3|5|7|8|9)\\d{8}$");

    @Override
    public boolean isValid(
            String phone,
            ConstraintValidatorContext context) {
        if (phone == null || phone.isBlank()) {
            return false;
        }

        return PHONE_PATTERN.matcher(phone).matches();
    }
}