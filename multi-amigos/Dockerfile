# ====== Build stage ======
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /app

# copia os manifests primeiro (melhora cache)
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw mvnw
RUN chmod +x mvnw || true

# baixa dependências
RUN ./mvnw -q -DskipTests dependency:go-offline || mvn -q -DskipTests dependency:go-offline

# copia o código e builda
COPY src src
RUN ./mvnw -DskipTests clean package || mvn -DskipTests clean package


# ====== Run stage ======
FROM eclipse-temurin:17-jre
WORKDIR /app

# Render usa a variável PORT
ENV PORT=8080

# copia o jar gerado
COPY --from=build /app/target/*.jar app.jar

# expõe porta (opcional)
EXPOSE 8080

# inicia a aplicação na porta do Render
CMD ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
