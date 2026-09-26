package com.projectsale.api.auth.service;

import com.projectsale.api.auth.dto.AuthRequest.LoginRequest;
import com.projectsale.api.auth.dto.AuthRequest.LogoutRequest;
import com.projectsale.api.auth.dto.AuthRequest.RefreshRequest;
import com.projectsale.api.auth.dto.AuthRequest.RegisterRequest;
import com.projectsale.api.auth.dto.AuthRequest.VerifyRequest;
import com.projectsale.api.auth.dto.AuthResponse.TokenPair;
import com.projectsale.api.auth.dto.AuthResponse.TokenResponse;
import com.projectsale.api.auth.dto.AuthResponse.UserResponse;
import com.projectsale.api.auth.mapper.UserMapper;
import com.projectsale.api.auth.security.JwtService;
import com.projectsale.api.auth.security.RefreshTokenService;
import com.projectsale.api.auth.security.dto.DeviceActivity;
import com.projectsale.api.auth.security.dto.DeviceInfo;
import com.projectsale.api.user.repository.UserRepository;
import com.projectsale.common.exception.AppException;
import com.projectsale.common.exception.ErrorCode;
import com.projectsale.common.mail.EmailService;
import com.projectsale.entity.User;
import com.projectsale.enums.StatusEnum;

import jakarta.annotation.PostConstruct;

import java.util.UUID;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@Transactional
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepo;
    private final UserMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailService mailservice;
    private final JwtService jwtService;
    private final OtpService otpService;
    private final RefreshTokenService refreshTokenService;
    private String dummyPasswordHash;

    /**
     * Hash giả để nhánh "không có tài khoản" cũng tốn một lần kiểm mật khẩu như
     * nhánh sai mật khẩu.
     */
    @PostConstruct()
    public void initDummyPasswordHash() {
        this.dummyPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

    public void register(RegisterRequest request) {
        validateRegistration(request.phone(), request.email());
        User user = mapper.toUserEntity(request);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(StatusEnum.PENDING);
        userRepo.save(user);
        String otp = otpService.issue(request.email());
        mailservice.sendVerificationEmail(request.email(), otp);
    }

    public TokenResponse login(LoginRequest request, DeviceInfo deviceInfo) {
        User user = userRepo.findByEmail(request.email()).orElse(null);
        // Luôn kiểm mật khẩu để thời gian phản hồi không tiết lộ email có tồn tại hay
        // không.
        String passwordHash = user == null ? dummyPasswordHash : user.getPasswordHash();
        boolean passwordMatches = passwordEncoder.matches(request.password(), passwordHash);
        // Không tồn tại, sai mật khẩu hay bị vô hiệu hoá đều trả cùng một lỗi.
        if (user == null || !passwordMatches || user.getStatus() == StatusEnum.UNACTIVE) {
            throw new AppException(ErrorCode.INVALID_CREDENTIALS);
        }
        // Chỉ người đã chứng minh đúng mật khẩu mới biết tài khoản đang chờ xác thực.
        if (user.getStatus() == StatusEnum.PENDING) {
            throw new AppException(ErrorCode.ACCOUNT_NOT_VERIFY);
        }
        var refreshToken = refreshTokenService.issue(user, deviceInfo);
        var accessToken = jwtService.issueAccessToken(user, refreshToken.sessionId());
        return new TokenResponse(
                accessToken,
                refreshToken.token(),
                mapper.toResponse(user));
    }

    public TokenResponse verify(VerifyRequest request, DeviceInfo deviceInfo) {
        // Kiểm (và huỷ) OTP trước: người không có mã hợp lệ không dò được trạng thái
        // tài khoản, và hai request đồng thời không thể cùng dùng một mã.
        otpService.verify(request.email(), request.otp());
        User user = userRepo.findByEmail(request.email())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (user.getStatus() == StatusEnum.ACTIVE) {
            throw new AppException(ErrorCode.ACCOUNT_ALREADY_VERIFIED);
        }
        if (user.getStatus() != StatusEnum.PENDING) {
            throw new AppException(ErrorCode.ACCOUNT_DISABLED);
        }
        user.setStatus(StatusEnum.ACTIVE);
        userRepo.save(user);

        var refreshToken = refreshTokenService.issue(user, deviceInfo);
        String accessToken = jwtService.issueAccessToken(user, refreshToken.sessionId());

        return new TokenResponse(
                accessToken,
                refreshToken.token(),
                mapper.toResponse(user));
    }

    public void resendOTP(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        if (user.getStatus() == StatusEnum.ACTIVE) {
            throw new AppException(ErrorCode.ACCOUNT_ALREADY_VERIFIED);
        }

        if (user.getStatus() == StatusEnum.UNACTIVE) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        String otp = otpService.issue(email);
        mailservice.sendVerificationEmail(email, otp);
    }

    @Transactional(readOnly = true)
    public TokenPair refresh(RefreshRequest request, DeviceActivity activity) {
        try {
            var rotated = refreshTokenService.rotate(request.refreshToken(), activity);
            var claims = jwtService.verifyRefreshToken(rotated.token());
            User user = userRepo.findByPublicId(claims.userId())
                    .filter(User::isActive)
                    .orElseThrow(RefreshTokenService.RevokedRefreshTokenException::new);
            String accessToken = jwtService.issueAccessToken(user, rotated.sessionId());
            return new TokenPair(accessToken, rotated.token());
        } catch (RefreshTokenService.RefreshTokenStoreException exception) {
            throw new AppException(ErrorCode.REDIS_ERROR);
        } catch (RefreshTokenService.RefreshTokenException | JwtService.InvalidJwtException exception) {
            throw new AppException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
    }

    public UserResponse getMe(UUID userId) {
        User user = userRepo.findByPublicId(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        return mapper.toResponse(user);
    }

    void validateRegistration(String phone, String email) {
        if (userRepo.existsByPhone(phone)) {
            throw new AppException(ErrorCode.PHONE_ALREADY_EXIST);
        }

        User user = userRepo.findByEmail(email).orElse(null);
        if (user == null) {
            return;
        }
        // Email là unique: mọi trạng thái đều phải chặn, nếu không save() sẽ vi phạm
        // uk_users_email và trả 500. Switch expression buộc compiler kiểm đủ trạng
        // thái.
        ErrorCode conflict = switch (user.getStatus()) {
            case ACTIVE -> ErrorCode.EMAIL_ALREADY_EXIST;
            case PENDING -> ErrorCode.ACCOUNT_NOT_VERIFY;
            case UNACTIVE -> ErrorCode.ACCOUNT_DISABLED;
        };
        throw new AppException(conflict);
    }

    public void logout(LogoutRequest request) {
        var claim = refreshTokenService.verify(request.refreshToken());
        var deviceId = claim.deviceId();
        if (deviceId != null && deviceId.equals(request.deviceId())) {
            // Revoke the refresh token for the specific device
            refreshTokenService.revoke(request.refreshToken());
        } else
            throw new AppException(ErrorCode.DEVICE_NOT_LOGIN);
    }
}
