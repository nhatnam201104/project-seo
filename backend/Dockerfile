FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src src
RUN mvn -B -q -DskipTests package

FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 spring
USER spring
WORKDIR /app
COPY --from=build /workspace/target/projectsale-api-*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java","-Duser.timezone=UTC","-jar","/app/app.jar"]
