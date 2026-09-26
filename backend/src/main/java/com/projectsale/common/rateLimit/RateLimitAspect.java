package com.projectsale.common.rateLimit;

import com.projectsale.common.exception.RateLimitExceededException;
import com.projectsale.common.util.Hashing;
import com.projectsale.common.web.ClientRequestResolver;
import jakarta.servlet.http.HttpServletRequest;
import java.lang.reflect.Method;
import java.time.Duration;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Áp các quy tắc {@link RateLimit} trước khi vào controller. Chạy sau khi body
 * đã được validate, nên email trong {@link EmailKeyed} luôn có giá trị.
 */
@Aspect
@Component
public class RateLimitAspect {

  private static final String KEY_PREFIX = "rl:";

  private final RedisRateLimiter limiter;
  private final ClientRequestResolver clientResolver;

  public RateLimitAspect(RedisRateLimiter limiter, ClientRequestResolver clientResolver) {
    this.limiter = limiter;
    this.clientResolver = clientResolver;
  }

  @Around("@annotation(com.projectsale.common.rateLimit.RateLimit)"
      + " || @annotation(com.projectsale.common.rateLimit.RateLimits)")
  public Object enforce(ProceedingJoinPoint joinPoint) throws Throwable {
    Method method = ((MethodSignature) joinPoint.getSignature()).getMethod();
    String policy = method.getDeclaringClass().getSimpleName() + "." + method.getName();
    for (RateLimit rule : method.getAnnotationsByType(RateLimit.class)) {
      String key = KEY_PREFIX + policy + ":" + rule.keyType() + ":"
          + subject(rule.keyType(), joinPoint.getArgs(), policy);
      RedisRateLimiter.Decision decision = limiter.tryAcquire(
          key, rule.limit(), Duration.of(rule.duration(), rule.unit()));
      if (!decision.allowed()) {
        throw new RateLimitExceededException(decision.retryAfterSeconds());
      }
    }
    return joinPoint.proceed();
  }

  private String subject(RateLimit.KeyType keyType, Object[] args, String policy) {
    return switch (keyType) {
      case IP_ADDRESS -> clientResolver.resolve(currentRequest(policy)).ip();
      // Băm để không lưu email (PII) dạng rõ trong khoá Redis.
      case EMAIL -> Hashing.sha256Hex(emailArgument(args, policy).normalizedEmail());
    };
  }

  private static EmailKeyed emailArgument(Object[] args, String policy) {
    for (Object arg : args) {
      if (arg instanceof EmailKeyed keyed) {
        return keyed;
      }
    }
    throw new IllegalStateException(
        "@RateLimit(keyType = EMAIL) on " + policy + " requires an EmailKeyed argument");
  }

  private static HttpServletRequest currentRequest(String policy) {
    if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
      return attributes.getRequest();
    }
    throw new IllegalStateException("@RateLimit on " + policy + " requires an HTTP request");
  }
}
