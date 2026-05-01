# ── Stage 1: Build ────────────────────────────────────────────────────────
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app

# Install Maven directly (no wrapper download needed)
RUN apk add --no-cache maven

COPY pom.xml .
COPY .m2 /root/.m2
RUN mvn dependency:go-offline -q --no-transfer-progress

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]