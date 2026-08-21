package com.projectsale.api.auth.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.projectsale.api.auth.dto.AuthRequest.RegisterRequest;
import com.projectsale.api.auth.dto.AuthResponse.UserResponse;
import com.projectsale.api.auth.mapper.UserMapper;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.common.mail.EmailService;
import com.projectsale.common.response.ApiError;
import com.projectsale.entity.User;
import com.projectsale.enums.StatusEnum;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j

@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepo;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailService mailservice;

    public boolean Register(RegisterRequest request) {
        Validate(request.phone(), request.email());
        User user = mapper.toUserEntity(request);
        var password = passwordEncoder.encode(request.password());
        user.setPasswordHash(password);
        user.setStatus(StatusEnum.PENDING);
        log.info("Saving user: {}", user.toString());
        userRepo.save(user);
        mailservice.sendVerificationEmail(request.email(), password);
        // handle otp
        return true;

    }

    void Validate(String phone, String email) {
        if (userRepo == null) {
            throw new IllegalStateException("UserRepository is not initialized");
        }
        if (userRepo.existsByPhone(phone)) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXIST);
        }

        // check if email already exists and status === pending -> send another
        // verification email

        var user = userRepo.findByEmailIgnoreCase(email).orElse(null);
        if (user != null) {
            if (user.getStatus() == StatusEnum.ACTIVE) {
                throw new AppException(ErrorCode.EMAIL_ALREADY_EXIST);
            } else if (user.getStatus() == StatusEnum.PENDING) {
                throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFY);
            }
        }

    }
}