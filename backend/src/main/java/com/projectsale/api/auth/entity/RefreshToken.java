package com.projectsale.api.auth.entity;

import com.projectsale.api.user.entity.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;
import lombok.*;

@Entity
@Table(name = "refresh_tokens")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "public_id", nullable = false, unique = true, insertable = false, updatable = false)
    private UUID publicId;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;
    @Column(name = "token_family_id", nullable = false)
    private UUID tokenFamilyId;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;
    @Column(name = "revoked_at")
    private Instant revokedAt;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replaced_by_token_id")
    private RefreshToken replacedBy;
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;
    @Column(name = "last_used_at")
    private Instant lastUsedAt;

    public RefreshToken(User user, String hash, UUID family, Instant expiresAt) {
        this.user = user;
        this.tokenHash = hash;
        this.tokenFamilyId = family;
        this.expiresAt = expiresAt;
    }

    public boolean usableAt(Instant now) {
        return revokedAt == null && expiresAt.isAfter(now);
    }

    public void rotateTo(RefreshToken next, Instant now) {
        revokedAt = now;
        lastUsedAt = now;
        replacedBy = next;
    }

    public void revoke(Instant now) {
        if (revokedAt == null)
            revokedAt = now;
    }
}
