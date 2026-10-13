package xyz.mercadito.uat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UatGatewayClientTest {
    private HttpServer server;
    private String base;
    private int status = 200;
    private String contentType = "application/json";
    private String response = PortalResultValidatorTest.response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"ACTIVO\"}}]");
    private long delay;
    private final AtomicReference<String> request = new AtomicReference<>();
    private final AtomicReference<String> apiKey = new AtomicReference<>();

    @BeforeEach void start() throws Exception {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/v1/alumnos/scrape", exchange -> {
            request.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            apiKey.set(exchange.getRequestHeaders().getFirst("X-API-Key"));
            try {
                if (delay > 0) Thread.sleep(delay);
                byte[] bytes = response.getBytes(StandardCharsets.UTF_8);
                exchange.getResponseHeaders().set("Content-Type", contentType);
                exchange.sendResponseHeaders(status, bytes.length);
                exchange.getResponseBody().write(bytes);
            } catch (InterruptedException ignored) {
                Thread.currentThread().interrupt();
            } finally {
                exchange.close();
            }
        });
        server.start();
        base = "http://127.0.0.1:" + server.getAddress().getPort();
    }

    @AfterEach void stop() { server.stop(0); }

    private void denied(UatVerificationException.Reason reason) {
        var error = assertThrows(UatVerificationException.class,
                () -> new UatGatewayClient(base, "test-key").verify("00123", "test-password"));
        assertEquals(reason, error.reason());
        assertFalse(error.getMessage().contains("test-password"));
        assertFalse(error.getMessage().contains("test-key"));
    }

    @Test void sendsOnlyMinimumDataAndUsesStatelessEndpoint() throws Exception {
        var student = new UatGatewayClient(base, "test-key").verify("00123", "escaped-\"-password");
        JsonNode body = new ObjectMapper().readTree(request.get());
        assertEquals("test-key", apiKey.get());
        assertEquals("00123", body.path("username").asText());
        assertEquals("escaped-\"-password", body.path("password").asText());
        assertEquals(3, body.size());
        assertTrue(body.path("include").path("programPage").asBoolean());
        assertFalse(body.path("include").path("schedule").asBoolean());
        assertFalse(body.path("include").path("partialGrades").asBoolean());
        assertFalse(body.path("include").path("finalGrades").asBoolean());
        assertEquals(4, body.path("include").size());
        assertEquals("00123", student.matricula());
    }

    @Test void distinguishesCredentialFailureFromBrokenGatewayAuthorization() {
        status = 401;
        response = "{\"error\":\"UAT_LOGIN_FAILED\",\"message\":\"sensitive upstream message\"}";
        denied(UatVerificationException.Reason.CREDENTIALS);
        response = "{\"error\":\"GATEWAY_UNAUTHORIZED\"}";
        denied(UatVerificationException.Reason.UNAVAILABLE);
    }

    @Test void refusesRedirectsAndHtml() {
        status = 302;
        denied(UatVerificationException.Reason.UNAVAILABLE);
        status = 200;
        contentType = "text/html";
        response = "<html>ACTIVO</html>";
        denied(UatVerificationException.Reason.UNAVAILABLE);
    }

    @Test void refusesMalformedResponseAndUpstreamFailure() {
        response = "{";
        denied(UatVerificationException.Reason.UNAVAILABLE);
        status = 502;
        response = "{\"error\":\"UAT_PORTAL_ERROR\"}";
        denied(UatVerificationException.Reason.UNAVAILABLE);
    }

    @Test void capsResponseBeforeBuildingAJsonTree() {
        response = " ".repeat(UatGatewayClient.MAX_RESPONSE_BYTES + 1);
        denied(UatVerificationException.Reason.UNAVAILABLE);
    }

    @Test void enforcesWholeRequestTimeout() {
        delay = 250;
        var error = assertThrows(UatVerificationException.class,
                () -> new UatGatewayClient(base, "test-key", Duration.ofMillis(50)).verify("00123", "test-password"));
        assertEquals(UatVerificationException.Reason.UNAVAILABLE, error.reason());
    }

    @Test void rejectsWrongUserBeforeSendingCredentials() {
        var error = assertThrows(UatVerificationException.class,
                () -> new UatGatewayClient(base, "test-key").verify("wrong@example.test", "test-password"));
        assertEquals(UatVerificationException.Reason.CREDENTIALS, error.reason());
        assertNull(request.get());
    }

    @Test void rejectsUnsafeOrMissingGatewayConfiguration() {
        assertThrows(IllegalArgumentException.class, () -> new UatGatewayClient("ftp://host", "test-key"));
        assertThrows(IllegalArgumentException.class, () -> new UatGatewayClient("http://user:pass@host", "test-key"));
        assertThrows(IllegalArgumentException.class, () -> new UatGatewayClient("http://host?secret=x", "test-key"));
        assertThrows(IllegalArgumentException.class, () -> new UatGatewayClient("http://host", ""));
    }
}
