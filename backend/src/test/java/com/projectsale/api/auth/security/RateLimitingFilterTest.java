package com.projectsale.api.auth.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.projectsale.common.web.ClientRequestResolver;
import com.projectsale.common.web.ProxyProperties;
import jakarta.servlet.FilterChain;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import java.util.function.IntFunction;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.util.ReflectionTestUtils;

class RateLimitingFilterTest {

  private static final Duration WINDOW = Duration.ofSeconds(60);
  private static final FilterChain NO_OP_CHAIN = (request, response) -> {};
  private static final ClientRequestResolver UNTRUSTED =
      new ClientRequestResolver(new ProxyProperties(""));
  private static final String SECRET = "f".repeat(48);

  @Test
  void defaultLimitAllows100RequestsAndBlocksTheNextWithoutCallingDownstream() throws Exception {
    RateLimitingFilter filter = new RateLimitingFilter(UNTRUSTED);
    AtomicInteger calls = new AtomicInteger();
    FilterChain chain = (request, response) -> calls.incrementAndGet();

    for (int i = 0; i < 100; i++) {
      assertThat(request(filter, "203.0.113.10", chain).getStatus()).isEqualTo(200);
    }

    MockHttpServletResponse blocked = request(filter, "203.0.113.10", chain);
    assertThat(blocked.getStatus()).isEqualTo(429);
    assertThat(calls).hasValue(100);
  }

  @Test
  void rejectionsUseTheStandardJsonEnvelopeAndTheRemainingWindow() throws Exception {
    AtomicLong time = new AtomicLong();
    RateLimitingFilter filter = filter(1, 10, time);
    request(filter, ip(0), NO_OP_CHAIN);

    time.set(Duration.ofSeconds(45).toNanos());
    MockHttpServletResponse blocked = request(filter, ip(0), NO_OP_CHAIN);

    assertThat(blocked.getStatus()).isEqualTo(429);
    assertThat(blocked.getContentType()).startsWith("application/json");
    assertThat(blocked.getHeader("Retry-After")).isEqualTo("15");
    assertThat(blocked.getContentAsString()).isEqualTo(
        "{\"error\":{\"message\":\"Too many requests\"},\"data\":null,\"pagination\":null}");
  }

  @Test
  void aFullTableTellsNewClientsWhenTheOldestSlotFreesUp() throws Exception {
    AtomicLong time = new AtomicLong();
    RateLimitingFilter filter = filter(5, 1, time);
    request(filter, ip(0), NO_OP_CHAIN);

    time.set(Duration.ofSeconds(50).toNanos());

    assertThat(request(filter, ip(1), NO_OP_CHAIN).getHeader("Retry-After")).isEqualTo("10");
  }

  @Test
  void browsersBehindTheTrustedSsrServerAreCountedSeparately() throws Exception {
    ClientRequestResolver trusted = new ClientRequestResolver(new ProxyProperties(SECRET));
    RateLimitingFilter filter =
        new RateLimitingFilter(trusted, 1, WINDOW, 10, new AtomicLong()::get);

    assertThat(viaSsr(filter, "203.0.113.1").getStatus()).isEqualTo(200);
    assertThat(viaSsr(filter, "203.0.113.1").getStatus()).isEqualTo(429);
    assertThat(viaSsr(filter, "203.0.113.2").getStatus()).isEqualTo(200);
  }

  private static MockHttpServletResponse viaSsr(RateLimitingFilter filter, String browserIp)
      throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRemoteAddr("10.0.0.5");
    request.addHeader(ClientRequestResolver.PROXY_SECRET, SECRET);
    request.addHeader(ClientRequestResolver.FORWARDED_FOR, browserIp);
    MockHttpServletResponse response = new MockHttpServletResponse();
    filter.doFilter(request, response, NO_OP_CHAIN);
    return response;
  }

  @Test
  void defaultCapacityRejectsNewIpAfter10000EntriesButKeepsExistingQuota() throws Exception {
    RateLimitingFilter filter = new RateLimitingFilter(UNTRUSTED);
    FilterChain chain = (request, response) -> {};

    for (int i = 0; i < 10_000; i++) {
      assertThat(request(filter, ip(i), chain).getStatus()).isEqualTo(200);
    }

    assertThat(request(filter, ip(10_000), chain).getStatus()).isEqualTo(429);
    assertThat(request(filter, ip(0), chain).getStatus()).isEqualTo(200);
    assertThat(trackedIps(filter)).isEqualTo(10_000);
  }

  @Test
  void concurrentRequestsForSameIpCannotExceedQuota() throws Exception {
    AtomicLong time = new AtomicLong();
    RateLimitingFilter filter = filter(100, 10, time);

    assertThat(concurrentRequests(filter, 500, ignored -> ip(0))).isEqualTo(100);
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(429);
    assertThat(trackedIps(filter)).isEqualTo(1);
  }

  @Test
  void concurrentRequestsAtWindowRolloverReceiveExactlyOneFreshQuota() throws Exception {
    AtomicLong time = new AtomicLong();
    RateLimitingFilter filter = filter(10, 10, time);
    assertThat(concurrentRequests(filter, 100, ignored -> ip(0))).isEqualTo(10);

    time.set(WINDOW.toNanos());

    assertThat(concurrentRequests(filter, 100, ignored -> ip(0))).isEqualTo(10);
    assertThat(trackedIps(filter)).isEqualTo(1);
  }

  @Test
  void concurrentNewIpsCannotExceedCapacityAndExpiredSlotsAreReclaimed() throws Exception {
    AtomicLong time = new AtomicLong();
    RateLimitingFilter filter = filter(1, 10, time);

    assertThat(concurrentRequests(filter, 500, RateLimitingFilterTest::ip)).isEqualTo(10);
    assertThat(trackedIps(filter)).isEqualTo(10);

    time.set(WINDOW.toNanos());
    assertThat(request(filter, ip(501), NO_OP_CHAIN).getStatus()).isEqualTo(200);
    assertThat(trackedIps(filter)).isEqualTo(1);
  }

  @Test
  void differentIpsHaveIndependentQuotas() throws Exception {
    RateLimitingFilter filter = filter(1, 10, new AtomicLong());

    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(200);
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(429);
    assertThat(request(filter, ip(1), NO_OP_CHAIN).getStatus()).isEqualTo(200);
  }

  @Test
  void rejectsUntilExactExpiryAndDeniedRequestsDoNotExtendWindow() throws Exception {
    AtomicLong time = new AtomicLong();
    RateLimitingFilter filter = filter(1, 1, time);
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(200);

    time.set(WINDOW.toNanos() - 1);
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(429);
    time.incrementAndGet();
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(200);
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(429);
  }

  @Test
  void recentlyAccessedOldestIpStillExpiresWithoutEvictingYoungerIp() throws Exception {
    AtomicLong time = new AtomicLong();
    RateLimitingFilter filter = filter(2, 2, time);
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(200);
    time.set(Duration.ofSeconds(10).toNanos());
    assertThat(request(filter, ip(1), NO_OP_CHAIN).getStatus()).isEqualTo(200);
    time.set(Duration.ofSeconds(20).toNanos());
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(200);

    time.set(WINDOW.toNanos());
    assertThat(request(filter, ip(2), NO_OP_CHAIN).getStatus()).isEqualTo(200);
    assertThat(request(filter, ip(1), NO_OP_CHAIN).getStatus()).isEqualTo(200);
    assertThat(request(filter, ip(1), NO_OP_CHAIN).getStatus()).isEqualTo(429);
    assertThat(trackedIps(filter)).isEqualTo(2);
  }

  @Test
  void capacityPressureNeverResetsActiveQuotaAndDoesNotBlockKnownIpWithQuota() throws Exception {
    RateLimitingFilter filter = filter(2, 2, new AtomicLong());
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(200);
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(200);
    assertThat(request(filter, ip(1), NO_OP_CHAIN).getStatus()).isEqualTo(200);

    for (int i = 2; i < 50; i++) {
      assertThat(request(filter, ip(i), NO_OP_CHAIN).getStatus()).isEqualTo(429);
    }

    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(429);
    assertThat(request(filter, ip(1), NO_OP_CHAIN).getStatus()).isEqualTo(200);
    assertThat(request(filter, ip(1), NO_OP_CHAIN).getStatus()).isEqualTo(429);
    assertThat(trackedIps(filter)).isEqualTo(2);
  }

  @Test
  void expiryUsesElapsedTimeEvenAcrossNanoTimeWraparound() throws Exception {
    AtomicLong time = new AtomicLong(Long.MAX_VALUE - WINDOW.toNanos() / 2);
    RateLimitingFilter filter = filter(1, 1, time);
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(200);

    time.addAndGet(WINDOW.toNanos() - 1);
    assertThat(time.get()).isNegative();
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(429);
    time.incrementAndGet();
    assertThat(request(filter, ip(0), NO_OP_CHAIN).getStatus()).isEqualTo(200);
  }

  @Test
  void slowDownstreamDoesNotHoldAdmissionLock() throws Exception {
    RateLimitingFilter filter = filter(2, 2, new AtomicLong());
    CountDownLatch entered = new CountDownLatch(1);
    CountDownLatch release = new CountDownLatch(1);
    ExecutorService executor = Executors.newFixedThreadPool(2);
    try {
      Future<Integer> slow = executor.submit(() -> request(filter, ip(0), (req, res) -> {
        entered.countDown();
        await(release);
      }).getStatus());
      assertThat(entered.await(5, TimeUnit.SECONDS)).isTrue();
      Future<Integer> independent = executor.submit(
          () -> request(filter, ip(1), NO_OP_CHAIN).getStatus());
      assertThat(independent.get(5, TimeUnit.SECONDS)).isEqualTo(200);
      release.countDown();
      assertThat(slow.get(5, TimeUnit.SECONDS)).isEqualTo(200);
    } finally {
      release.countDown();
      executor.shutdownNow();
      assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
    }
  }

  @Test
  void rejectsInvalidLimiterConfiguration() {
    assertThatThrownBy(() -> filter(0, 1, new AtomicLong()))
        .isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> filter(1, 0, new AtomicLong()))
        .isInstanceOf(IllegalArgumentException.class);
    assertThatThrownBy(() -> new RateLimitingFilter(UNTRUSTED, 1, Duration.ZERO, 1, () -> 0L))
        .isInstanceOf(IllegalArgumentException.class);
  }

  private static RateLimitingFilter filter(int limit, int capacity, AtomicLong time) {
    return new RateLimitingFilter(UNTRUSTED, limit, WINDOW, capacity, time::get);
  }

  private static int trackedIps(RateLimitingFilter filter) {
    return ((Map<?, ?>) ReflectionTestUtils.getField(filter, "requestCounts")).size();
  }

  private static long concurrentRequests(
      RateLimitingFilter filter, int total, IntFunction<String> ipForRequest) throws Exception {
    ExecutorService executor = Executors.newFixedThreadPool(16);
    CountDownLatch start = new CountDownLatch(1);
    List<Future<Integer>> responses = new ArrayList<>();
    try {
      for (int i = 0; i < total; i++) {
        String ip = ipForRequest.apply(i);
        responses.add(executor.submit(() -> {
          await(start);
          return request(filter, ip, NO_OP_CHAIN).getStatus();
        }));
      }
      start.countDown();
      long allowed = 0;
      for (Future<Integer> response : responses) {
        int status = response.get(10, TimeUnit.SECONDS);
        assertThat(status).isIn(200, 429);
        if (status == 200) {
          allowed++;
        }
      }
      return allowed;
    } finally {
      start.countDown();
      executor.shutdownNow();
      assertThat(executor.awaitTermination(5, TimeUnit.SECONDS)).isTrue();
    }
  }

  private static void await(CountDownLatch latch) {
    try {
      if (!latch.await(10, TimeUnit.SECONDS)) {
        throw new AssertionError("Timed out waiting for test latch");
      }
    } catch (InterruptedException exception) {
      Thread.currentThread().interrupt();
      throw new AssertionError("Test worker interrupted", exception);
    }
  }

  private static String ip(int index) {
    return "198.18." + (index / 256) + "." + (index % 256);
  }

  private static MockHttpServletResponse request(
      RateLimitingFilter filter, String ip, FilterChain chain) throws Exception {
    MockHttpServletRequest request = new MockHttpServletRequest();
    request.setRemoteAddr(ip);
    MockHttpServletResponse response = new MockHttpServletResponse();
    filter.doFilter(request, response, chain);
    return response;
  }
}
