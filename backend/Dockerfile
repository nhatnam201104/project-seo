# syntax=docker/dockerfile:1.7
# Backend Spring Boot — image production cho VPS x86_64 RAM thấp (≤ 2GB).
# Build:  docker build -t projectsale/backend ./backend

# ---------- Stage 1: build fat jar rồi tách thành các layer ----------
FROM eclipse-temurin:21-jdk-noble AS build
WORKDIR /workspace

# Dùng đúng Maven Wrapper như CI. Chỉ copy file khai báo dependency trước để
# layer tải dependency được cache, đổi code không phải tải lại.
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN chmod +x mvnw
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q dependency:go-offline

COPY src src
# Test đã chạy ở CI (backend-ci.yml), ở đây chỉ đóng gói.
RUN --mount=type=cache,target=/root/.m2 ./mvnw -B -q -DskipTests package \
 && cp target/projectsale-api-*.jar app.jar \
 && java -Djarmode=tools -jar app.jar extract --layers --launcher --destination extracted

# ---------- Stage 2: runtime chỉ có JRE + ứng dụng ----------
FROM eclipse-temurin:21-jre-noble
RUN useradd --system --uid 10001 --no-create-home spring
WORKDIR /app

# Thứ tự từ ít đổi → hay đổi: sửa code chỉ làm thay đổi layer "application".
COPY --from=build /workspace/extracted/dependencies/ ./
COPY --from=build /workspace/extracted/spring-boot-loader/ ./
COPY --from=build /workspace/extracted/snapshot-dependencies/ ./
COPY --from=build /workspace/extracted/application/ ./

USER spring

# SerialGC + giới hạn heap theo RAM container: tốn ít bộ nhớ nhất trên VPS 1-2 vCPU.
# Có thể ghi đè bằng biến môi trường JAVA_TOOL_OPTIONS trong compose.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC -Xss512k -XX:+ExitOnOutOfMemoryError -Duser.timezone=UTC"

EXPOSE 8081

# Không có actuator: kiểm tra cổng 8081 đã mở (Tomcat chỉ mở cổng sau khi context + Flyway xong).
HEALTHCHECK --interval=15s --timeout=3s --start-period=90s --retries=5 \
  CMD bash -c '</dev/tcp/127.0.0.1/8081' || exit 1

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
