package xyz.mercadito.uat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jboss.logging.Logger;
import java.io.IOException;
import java.text.Normalizer;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class PortalResultValidator {
    private static final Logger LOG = Logger.getLogger(PortalResultValidator.class);
    private static final Pattern USERNAME = Pattern.compile(
            "^([0-9]{1,32})(@alumnos\\.uat\\.edu\\.mx)?$", Pattern.CASE_INSENSITIVE);
    private static final Set<String> SITUATION_FIELDS = Set.of(
            "txt_situacion_alumno", "txt_situacion", "situacion_alumno", "situacion");
    private final ObjectMapper mapper = new ObjectMapper();

    public static String canonicalMatricula(String username) throws UatVerificationException {
        if (username == null) {
            LOG.warn("UAT_CHECK input_username_rejected");
            throw failure(UatVerificationException.Reason.CREDENTIALS);
        }
        var match = USERNAME.matcher(username.strip());
        if (!match.matches()) {
            LOG.warn("UAT_CHECK input_username_rejected");
            throw failure(UatVerificationException.Reason.CREDENTIALS);
        }
        return match.group(1);
    }

    public VerifiedStudent validate(byte[] body, String username) throws UatVerificationException {
        String matricula = canonicalMatricula(username);
        final JsonNode root;
        try {
            root = mapper.readTree(body);
        } catch (IOException | RuntimeException error) {
            throw failure(UatVerificationException.Reason.UNAVAILABLE);
        }
        if (root == null || !root.isObject() || !"UAT".equals(root.path("source").asText())) {
            throw failure(UatVerificationException.Reason.UNAVAILABLE);
        }
        JsonNode login = root.path("login");
        if (!exactTrue(root.path("authenticated")) || !exactTrue(login.path("exito"))) {
            LOG.warnf("UAT_CHECK login_not_confirmed authenticated=%s exito=%s",
                    booleanDiagnostic(root.path("authenticated")), booleanDiagnostic(login.path("exito")));
            throw failure(UatVerificationException.Reason.CREDENTIALS);
        }
        JsonNode changePassword = login.path("cambiaPass");
        if (exactTrue(changePassword)) {
            LOG.warn("UAT_CHECK portal_password_change_required");
            throw failure(UatVerificationException.Reason.CREDENTIALS);
        }
        if (!changePassword.isMissingNode() && !changePassword.isNull() && !changePassword.isBoolean()) {
            throw failure(UatVerificationException.Reason.UNAVAILABLE);
        }
        JsonNode programs = root.path("programs");
        if (!programs.isArray()) throw failure(UatVerificationException.Reason.UNAVAILABLE);
        boolean matchedIdentity = false;
        boolean inactivePlan = false;
        boolean unknownStatus = false;
        for (JsonNode program : programs) {
            JsonNode raw = program.path("raw");
            JsonNode rawMatricula = raw.path("Num_Matricula");
            if (!(rawMatricula.isTextual() || rawMatricula.isIntegralNumber())
                    || !matricula.equals(rawMatricula.asText().strip())) continue;
            matchedIdentity = true;
            Set<String> situations = new HashSet<>();
            collectRawSituations(raw, situations, 0);
            JsonNode fields = program.path("situationFields");
            if (fields.isArray()) {
                for (JsonNode field : fields) {
                    String path = field.path("field").asText("");
                    String leaf = path.substring(path.lastIndexOf('.') + 1);
                    if ("career".equals(field.path("source").asText())
                            && recognizedField(leaf)) addSituation(field.path("value"), situations);
                }
            }
            // Do not combine another plan, selection, global situation or the HTML page.
            // Conflicting career fields must fail closed rather than choosing ACTIVO.
            if (situations.equals(Set.of("ACTIVO"))) {
                String email = username.strip().contains("@")
                        ? matricula + "@alumnos.uat.edu.mx" : null;
                return new VerifiedStudent(matricula, email);
            }
            if (!situations.isEmpty() && Set.of("INACTIVO", "BAJA", "EGRESADO").containsAll(situations)) {
                inactivePlan = true;
            } else {
                unknownStatus = true;
            }
        }
        throw failure(matchedIdentity && inactivePlan && !unknownStatus
                ? UatVerificationException.Reason.INACTIVE : UatVerificationException.Reason.UNAVAILABLE);
    }

    private static void collectRawSituations(JsonNode node, Set<String> values, int depth) {
        if (depth > 3 || !node.isObject()) return;
        node.properties().forEach(entry -> {
            if (recognizedField(entry.getKey())) addSituation(entry.getValue(), values);
            if (entry.getValue().isObject()) collectRawSituations(entry.getValue(), values, depth + 1);
        });
    }

    private static void addSituation(JsonNode value, Set<String> values) {
        if (value.isTextual() && !value.asText().strip().isEmpty()) {
            values.add(value.asText().strip());
        }
    }

    private static boolean recognizedField(String field) {
        String normalized = Normalizer.normalize(field, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
        return SITUATION_FIELDS.contains(normalized);
    }

    // Emit only a fixed type/boolean label; never include upstream field contents.
    private static String booleanDiagnostic(JsonNode node) {
        if (node.isBoolean()) return Boolean.toString(node.booleanValue());
        return node.getNodeType().name();
    }

    private static boolean exactTrue(JsonNode node) {
        return node.isBoolean() && node.booleanValue();
    }

    private static UatVerificationException failure(UatVerificationException.Reason reason) {
        return new UatVerificationException(reason);
    }
}
