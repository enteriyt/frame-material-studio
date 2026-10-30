FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B dependency:go-offline
COPY src src
RUN mvn -B verify
FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/studio-1.0.0.jar app.jar
RUN mkdir /data && chown 10001:10001 /data
USER 10001
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
