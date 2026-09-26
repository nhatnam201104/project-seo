package com.projectsale.common.web;

import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.regex.Pattern;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Xác định người dùng cuối của một request.
 *
 * <p>
 * Trình duyệt không gọi API trực tiếp: mọi request đi qua server SSR, nên
 * {@code getRemoteAddr()} luôn là IP của server SSR. SSR chuyển tiếp IP và
 * User-Agent thật qua header, kèm bí mật dùng chung để chứng minh nó là SSR.
 * Chỉ khi bí mật khớp mới tin các header đó — nếu không, bất kỳ ai cũng có thể
 * tự đặt {@code X-Forwarded-For} để chọn khoá rate limit của mình. Vì vậy
 * không dùng {@code server.forward-headers-strategy}.
 */
@Component
@Slf4j
public class ClientRequestResolver {

  public static final String PROXY_SECRET = "X-Internal-Proxy-Secret";
  public static final String FORWARDED_FOR = "X-Forwarded-For";
  public static final String FORWARDED_USER_AGENT = "X-Forwarded-User-Agent";

  private static final int MIN_SECRET_LENGTH = 32;
  /** Một địa chỉ IPv4/IPv6 duy nhất; SSR không bao giờ gửi chuỗi nhiều hop. */
  private static final Pattern SINGLE_IP = Pattern.compile("^(?=.*[.:])[0-9A-Fa-f:.]{2,45}$");

  /** {@code null} khi chưa cấu hình → không tin header chuyển tiếp. */
  private final byte[] sharedSecret;

  public ClientRequestResolver(ProxyProperties properties) {
    String secret = properties.sharedSecret();
    if (secret == null || secret.isBlank()) {
      log.warn("INTERNAL_PROXY_SECRET is not set: forwarded client IPs are ignored and every "
          + "request through the SSR server shares one rate-limit identity");
      this.sharedSecret = null;
      return;
    }
    if (secret.length() < MIN_SECRET_LENGTH) {
      throw new IllegalStateException(
          "INTERNAL_PROXY_SECRET must be at least " + MIN_SECRET_LENGTH + " characters");
    }
    this.sharedSecret = secret.getBytes(StandardCharsets.UTF_8);
  }

  public ClientRequestInfo resolve(HttpServletRequest request) {
    String transportUserAgent = request.getHeader("User-Agent");
    if (isFromTrustedProxy(request)) {
      String forwardedIp = request.getHeader(FORWARDED_FOR);
      if (forwardedIp != null && SINGLE_IP.matcher(forwardedIp).matches()) {
        String forwardedUserAgent = request.getHeader(FORWARDED_USER_AGENT);
        return new ClientRequestInfo(
            forwardedIp,
            forwardedUserAgent == null ? transportUserAgent : forwardedUserAgent);
      }
    }
    return new ClientRequestInfo(request.getRemoteAddr(), transportUserAgent);
  }

  private boolean isFromTrustedProxy(HttpServletRequest request) {
    String presented = request.getHeader(PROXY_SECRET);
    return sharedSecret != null && presented != null
        && MessageDigest.isEqual(sharedSecret, presented.getBytes(StandardCharsets.UTF_8));
  }
}
