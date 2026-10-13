package xyz.mercadito.uat;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.jboss.logging.Logger;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Flow;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

public final class UatGatewayClient implements UatVerifier {
    private static final Logger LOG = Logger.getLogger(UatGatewayClient.class);
    static final int MAX_RESPONSE_BYTES = 1_048_576;
    private final HttpClient http;
    private final URI endpoint;
    private final String apiKey;
    private final Duration timeout;
    private final PortalResultValidator validator = new PortalResultValidator();
    private final ObjectMapper mapper = new ObjectMapper();

    public UatGatewayClient(String baseUrl, String apiKey) {
        this(baseUrl, apiKey, Duration.ofSeconds(90));
    }

    UatGatewayClient(String baseUrl, String apiKey, Duration timeout) {
        URI base = URI.create(baseUrl);
        if (!("http".equals(base.getScheme()) || "https".equals(base.getScheme()))
                || base.getHost() == null || base.getUserInfo() != null
                || base.getQuery() != null || base.getFragment() != null
                || !(base.getPath().isEmpty() || "/".equals(base.getPath()))
                || apiKey == null || apiKey.isBlank()
                || apiKey.contains("\r") || apiKey.contains("\n")
                || timeout.isNegative() || timeout.isZero()) {
            throw new IllegalArgumentException("Configuración UAT inválida.");
        }
        this.endpoint = base.resolve("/api/v1/alumnos/scrape");
        this.apiKey = apiKey;
        this.timeout = timeout;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10))
                .followRedirects(HttpClient.Redirect.NEVER).build();
    }

    @Override
    public VerifiedStudent verify(String username, String password) throws UatVerificationException {
        String matricula = PortalResultValidator.canonicalMatricula(username);
        // All accepted forms identify the same prefixed UAT student account.
        String portalUsername = "a" + matricula + "@alumnos.uat.edu.mx";
        if (password == null || password.isEmpty() || password.length() > 512) {
            LOG.warn("UAT_CHECK input_password_rejected");
            throw new UatVerificationException(UatVerificationException.Reason.INPUT_PASSWORD);
        }
        CompletableFuture<HttpResponse<byte[]>> pending = null;
        try {
            // This stateless route does not retain portal cookies or create a gateway session.
            byte[] requestBody = mapper.writeValueAsBytes(Map.of(
                    "username", portalUsername, "password", password,
                    "include", Map.of("programPage", true, "schedule", false,
                            "partialGrades", false, "finalGrades", false)));
            HttpRequest request = HttpRequest.newBuilder(endpoint).timeout(timeout)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("X-API-Key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(requestBody)).build();
            pending = http.sendAsync(request, ignored -> new LimitedBodySubscriber());
            HttpResponse<byte[]> response = pending.get(timeout.toMillis(), TimeUnit.MILLISECONDS);
            String type = response.headers().firstValue("Content-Type").orElse("");
            if (!type.toLowerCase(java.util.Locale.ROOT).split(";", 2)[0].strip().equals("application/json")) {
                LOG.warn("UAT_CHECK gateway_content_type_not_json");
                throw new UatVerificationException(UatVerificationException.Reason.UNAVAILABLE);
            }
            if (response.statusCode() == 401) {
                String code = mapper.readTree(response.body()).path("error").asText("");
                if ("UAT_LOGIN_FAILED".equals(code) || "UAT_SESSION_EXPIRED".equals(code)) {
                    LOG.warnf("UAT_CHECK portal_http_rejection code=%s", code);
                    throw new UatVerificationException(UatVerificationException.Reason.CREDENTIALS);
                }
            }
            if (response.statusCode() != 200) {
                LOG.warnf("UAT_CHECK gateway_status_unexpected status=%d", response.statusCode());
                throw new UatVerificationException(UatVerificationException.Reason.UNAVAILABLE);
            }
            return validator.validate(response.body(), username);
        } catch (UatVerificationException error) {
            throw error;
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            if (pending != null) pending.cancel(true);
            throw new UatVerificationException(UatVerificationException.Reason.UNAVAILABLE);
        } catch (IOException | ExecutionException | TimeoutException | RuntimeException error) {
            if (pending != null) pending.cancel(true);
            Throwable cause = error;
            for (int depth = 0; cause.getCause() != null && depth < 8; depth++) {
                cause = cause.getCause();
            }
            boolean responseLimit = "Respuesta UAT demasiado grande.".equals(cause.getMessage());
            LOG.warnf("UAT_CHECK gateway_transport_error kind=%s cause=%s response_limit=%s",
                    error.getClass().getSimpleName(), cause.getClass().getSimpleName(), responseLimit);
            // Never attach upstream messages, payloads, usernames or secrets to this exception.
            throw new UatVerificationException(UatVerificationException.Reason.UNAVAILABLE);
        }
    }

    private static final class LimitedBodySubscriber implements HttpResponse.BodySubscriber<byte[]> {
        private final CompletableFuture<byte[]> result = new CompletableFuture<>();
        private final ByteArrayOutputStream output = new ByteArrayOutputStream();
        private Flow.Subscription subscription;

        @Override
        public CompletionStage<byte[]> getBody() { return result; }

        @Override
        public void onSubscribe(Flow.Subscription incoming) {
            subscription = incoming;
            incoming.request(1);
        }

        @Override
        public void onNext(List<ByteBuffer> buffers) {
            for (ByteBuffer buffer : buffers) {
                if (buffer.remaining() > MAX_RESPONSE_BYTES - output.size()) {
                    subscription.cancel();
                    result.completeExceptionally(new IOException("Respuesta UAT demasiado grande."));
                    return;
                }
                byte[] chunk = new byte[buffer.remaining()];
                buffer.get(chunk);
                output.writeBytes(chunk);
            }
            subscription.request(1);
        }

        @Override
        public void onError(Throwable error) { result.completeExceptionally(error); }

        @Override
        public void onComplete() { result.complete(output.toByteArray()); }
    }
}
