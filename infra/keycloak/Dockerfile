FROM maven:3.9.11-eclipse-temurin-21 AS uat-provider
WORKDIR /build
COPY uat-provider/pom.xml ./
COPY uat-provider/src ./src
RUN mvn --batch-mode --no-transfer-progress verify

FROM quay.io/keycloak/keycloak:26.7.4 AS builder
ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
WORKDIR /opt/keycloak
COPY --from=uat-provider --chown=keycloak:keycloak /build/target/mercadito-uat-provider.jar /opt/keycloak/providers/
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.7.4
COPY --from=builder /opt/keycloak/ /opt/keycloak/
# El tema va después de copiar /opt/keycloak para que no lo sobrescriba.
COPY --chown=1000:0 themes/mercadito/ /opt/keycloak/themes/mercadito/
ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--hostname=https://auth.291006.xyz", "--http-enabled=true", "--proxy-headers=xforwarded", "--hostname-strict=true"]
