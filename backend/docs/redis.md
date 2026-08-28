# Redis for ProjectSale

## Purpose

Redis is configured as an available infrastructure dependency. It is **not**
used as the default Spring cache yet, so starting or stopping Redis does not
change any current API behavior. Add `@Cacheable` only when a specific read
path has an explicit cache key and invalidation strategy.

## Local startup

Install Docker Desktop, then run from the backend directory:

```powershell
docker compose -f docker-compose.redis.yml up -d
docker compose -f docker-compose.redis.yml ps
```

The Redis container is available at `localhost:6379` and persists data in the
named Docker volume `redis_data`.

To stop it without deleting data:

```powershell
docker compose -f docker-compose.redis.yml down
```

To delete the local Redis data as well:

```powershell
docker compose -f docker-compose.redis.yml down -v
```

## Environment configuration

Copy the values in `.env.example` into the ignored local `.env` file. The
application reads this file through `spring.config.import`.

| Variable | Default | Description |
| --- | --- | --- |
| `REDIS_HOST` | `localhost` | Redis hostname or managed Redis endpoint. |
| `REDIS_PORT` | `6379` | Redis server port. |
| `REDIS_USERNAME` | empty | Redis ACL user. Leave empty for the local container. |
| `REDIS_PASSWORD` | empty | Redis password. Keep it only in `.env` or secret storage. |
| `REDIS_DATABASE` | `0` | Logical Redis database index. |
| `REDIS_CONNECT_TIMEOUT` | `2s` | Maximum time to establish a connection. |
| `REDIS_TIMEOUT` | `2s` | Maximum command response time. |
| `REDIS_SSL` | `false` | Set `true` for a managed Redis service that requires TLS. |

For the supplied Docker container, the default values work as-is. For
production, set a password, use a private network/TLS where supported, and
put credentials in the deployment secret manager rather than source control.

## Verify the connection

After starting Redis, run:

```powershell
docker compose -f docker-compose.redis.yml exec redis redis-cli ping
```

Expected output:

```text
PONG
```
