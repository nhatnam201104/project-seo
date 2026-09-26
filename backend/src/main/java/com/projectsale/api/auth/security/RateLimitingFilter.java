package com.projectsale.api.auth.security;

import com.projectsale.common.web.ClientRequestResolver;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import java.util.function.LongSupplier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Lớp chống lạm dụng thô cho toàn API, theo IP của người dùng cuối (đã resolve
 * qua SSR tin cậy). Cố ý giữ in-memory theo từng instance — xem
 * specs/fix-global-rate-limit-filter.md; rate limit chính xác cho auth nằm ở
 * {@code RateLimitAspect} (Redis).
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS = 100;
    private static final Duration TIME_WINDOW = Duration.ofMinutes(1);
    private static final int MAX_TRACKED_IPS = 10_000;
    private static final long ADMITTED = 0L;
    /** Cùng envelope với ApiExceptionHandler; filter chạy trước DispatcherServlet nên tự ghi. */
    private static final String TOO_MANY_REQUESTS_BODY =
            "{\"error\":{\"message\":\"Too many requests\"},\"data\":null,\"pagination\":null}";

    private static final class RequestInfo {
        private int count = 1;
        private final long windowStart;

        private RequestInfo(long windowStart) {
            this.windowStart = windowStart;
        }
    }

    // All access is under admissionLock. Insertion order is also expiry order:
    // windows have the same duration and neither reads nor writes extend them.
    private final Map<String, RequestInfo> requestCounts = new LinkedHashMap<>();
    private final Object admissionLock = new Object();
    private final ClientRequestResolver clientResolver;
    private final int maxRequests;
    private final long windowNanos;
    private final int maxTrackedIps;
    private final LongSupplier nanoTime;

    // Explicit: with a second (test) constructor Spring would otherwise look for a no-arg one.
    @Autowired
    public RateLimitingFilter(ClientRequestResolver clientResolver) {
        this(clientResolver, MAX_REQUESTS, TIME_WINDOW, MAX_TRACKED_IPS, System::nanoTime);
    }

    RateLimitingFilter(ClientRequestResolver clientResolver, int maxRequests, Duration window,
            int maxTrackedIps, LongSupplier nanoTime) {
        if (maxRequests <= 0 || maxTrackedIps <= 0 || window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException("Rate limit, window and capacity must be positive");
        }
        this.clientResolver = Objects.requireNonNull(clientResolver, "clientResolver");
        this.maxRequests = maxRequests;
        this.windowNanos = window.toNanos();
        this.maxTrackedIps = maxTrackedIps;
        this.nanoTime = Objects.requireNonNull(nanoTime, "nanoTime");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        long retryAfterNanos = tryAcquire(clientResolver.resolve(request).ip());
        if (retryAfterNanos != ADMITTED) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setHeader(HttpHeaders.RETRY_AFTER, Long.toString(toRetryAfterSeconds(retryAfterNanos)));
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(TOO_MANY_REQUESTS_BODY);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /** Trả {@link #ADMITTED} nếu được nhận, ngược lại là số nano giây đến khi có quota. */
    private long tryAcquire(String clientIp) {
        synchronized (admissionLock) {
            // Read time inside the lock so concurrent inserts preserve expiry order.
            long now = nanoTime.getAsLong();
            var entries = requestCounts.values().iterator();
            while (entries.hasNext()) {
                if (now - entries.next().windowStart < windowNanos) {
                    break;
                }
                entries.remove();
            }

            RequestInfo info = requestCounts.get(clientIp);
            if (info != null) {
                if (info.count >= maxRequests) {
                    return remainingNanos(info, now);
                }
                info.count++;
                return ADMITTED;
            }

            // Never evict a live window: doing so would grant fresh quota early.
            if (requestCounts.size() >= maxTrackedIps) {
                // The head is the oldest live window: its expiry frees the first slot.
                return remainingNanos(requestCounts.values().iterator().next(), now);
            }
            requestCounts.put(clientIp, new RequestInfo(now));
            return ADMITTED;
        }
    }

    private long remainingNanos(RequestInfo info, long now) {
        // Pruning guarantees now - windowStart < windowNanos, so this is always positive.
        return windowNanos - (now - info.windowStart);
    }

    private static long toRetryAfterSeconds(long nanos) {
        return Math.max(1L, (nanos + TimeUnit.SECONDS.toNanos(1) - 1) / TimeUnit.SECONDS.toNanos(1));
    }
}
