package com.projectsale.api.auth.repository;
import com.projectsale.api.auth.entity.RefreshToken; import jakarta.persistence.LockModeType; import java.time.Instant; import java.util.*; import org.springframework.data.jpa.repository.*; import org.springframework.data.repository.query.Param;
public interface RefreshTokenRepository extends JpaRepository<RefreshToken,Long>{
 @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select t from RefreshToken t join fetch t.user where t.tokenHash=:hash") Optional<RefreshToken> findForUpdate(@Param("hash")String hash);
 @Modifying @Query("update RefreshToken t set t.revokedAt=:now where t.tokenFamilyId=:family and t.revokedAt is null") int revokeFamily(@Param("family")UUID family,@Param("now")Instant now);
}
