package xyz.mercadito.uat;

import com.fasterxml.jackson.databind.JsonNode;
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
            "^(?:([0-9]{1,32})|a?([0-9]{1,32})@alumnos\\.uat\\.edu\\.mx)$", Pattern.CASE_INSENSITIVE);
    private static final Set<String> SITUATION_FIELDS = Set.of(
            "txt_situacion_alumno", "txt_situacion", "situacion_alumno", "situacion");
    // Exact labels shown in UAT's official enrollment guides; never match substrings.
    private static final Set<String> ELIGIBLE_SITUATIONS = Set.of(
            "ACTIVO", "ACTIVO - REGULARES", "REGULARES");
    private final PortalResponseReader reader = new PortalResponseReader();

    public static String canonicalMatricula(String username) throws UatVerificationException {
        if (username == null) {
            LOG.warn("UAT_CHECK input_username_rejected");
            throw failure(UatVerificationException.Reason.INPUT_USERNAME);
        }
        var match = USERNAME.matcher(username.strip());
        if (!match.matches()) {
            LOG.warn("UAT_CHECK input_username_rejected");
            throw failure(UatVerificationException.Reason.INPUT_USERNAME);
        }
        return match.group(1) != null ? match.group(1) : match.group(2);
    }

    public VerifiedStudent validate(byte[] body, String username) throws UatVerificationException {
        String matricula = canonicalMatricula(username);
        final JsonNode root;
        try {
            root = reader.read(body);
        } catch (IOException | RuntimeException error) {
            LOG.warn("UAT_CHECK response_json_invalid");
            throw failure(UatVerificationException.Reason.UNAVAILABLE);
        }
        if (root == null || !root.isObject() || !"UAT".equals(root.path("source").asText())) {
            LOG.warn("UAT_CHECK response_source_invalid");
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
            LOG.warn("UAT_CHECK password_change_flag_invalid");
            throw failure(UatVerificationException.Reason.UNAVAILABLE);
        }
        JsonNode programs = root.path("programs");
        if (!programs.isArray()) {
            LOG.warnf("UAT_CHECK programs_contract_invalid kind=%s", programs.getNodeType().name());
            throw failure(UatVerificationException.Reason.UNAVAILABLE);
        }
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
            // Any unknown or inactive evidence in the same career still fails closed.
            if (!situations.isEmpty() && ELIGIBLE_SITUATIONS.containsAll(situations)) {
                String email = username.strip().contains("@")
                        ? "a" + matricula + "@alumnos.uat.edu.mx" : null;
                String displayName = PortalDisplayName.from(raw);
                String fullName = PortalDisplayName.fullName(raw);
                JsonNode parameters = login.path("parametros");
                JsonNode loginMatricula = parameters.path("Num_Matricula");
                if (displayName == null && (loginMatricula.isMissingNode()
                        || ((loginMatricula.isTextual() || loginMatricula.isIntegralNumber())
                            && matricula.equals(loginMatricula.asText().strip())))) {
                    displayName = PortalDisplayName.from(parameters);
                    fullName = PortalDisplayName.fullName(parameters);
                }
                if (displayName == null) {
                    LOG.warnf("UAT_CHECK display_name_missing career_schema=%s login_schema=%s career_name_fields=%s login_name_fields=%s",
                            schemaNames(raw), schemaNames(parameters),
                            raw.path("_name_fields").asText(""), parameters.path("_name_fields").asText(""));
                }
                return new VerifiedStudent(matricula, email, displayName, fullName);
            }
            if (!situations.isEmpty() && Set.of("INACTIVO", "BAJA", "EGRESADO").containsAll(situations)) {
                inactivePlan = true;
            } else {
                unknownStatus = true;
            }
        }
        LOG.warnf("UAT_CHECK academic_contract_unconfirmed programs_count=%d matching_identity=%s raw_matricula_type=%s first_program_schema=%s",
                programs.size(), matchedIdentity, programs.path(0).path("raw").path("Num_Matricula").getNodeType().name(),
                schemaNames(programs.path(0).path("raw")));
        throw failure(!matchedIdentity ? UatVerificationException.Reason.UNAVAILABLE
                : inactivePlan && !unknownStatus ? UatVerificationException.Reason.INACTIVE
                : UatVerificationException.Reason.UNCONFIRMED_STATUS);
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
            values.add(value.asText().strip().toUpperCase(Locale.ROOT));
        }
    }

    static boolean recognizedField(String field) {
        String normalized = Normalizer.normalize(field, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
        return SITUATION_FIELDS.contains(normalized);
    }

    // DTO property names only, bounded and filtered; never emit property values.
    private static String schemaNames(JsonNode node) {
        if (!node.isObject()) return node.getNodeType().name();
        return node.properties().stream().map(java.util.Map.Entry::getKey)
                .filter(key -> key.matches("[A-Za-z][A-Za-z0-9_]{0,48}"))
                .sorted().limit(24).collect(java.util.stream.Collectors.joining(","));
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
