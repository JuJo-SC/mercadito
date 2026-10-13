package xyz.mercadito.uat;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;

class PortalResultValidatorTest {
    private final PortalResultValidator validator = new PortalResultValidator();

    static String response(String programs) {
        return "{\"source\":\"UAT\",\"authenticated\":true,\"login\":{\"exito\":true,\"cambiaPass\":false},\"programs\":" + programs + "}";
    }

    private VerifiedStudent parse(String value, String username) throws Exception {
        return validator.validate(value.getBytes(StandardCharsets.UTF_8), username);
    }

    private void denied(String value, String username, UatVerificationException.Reason reason) {
        var error = assertThrows(UatVerificationException.class, () -> parse(value, username));
        assertEquals(reason, error.reason());
        assertFalse(error.getMessage().contains(username));
    }

    @Test void acceptsOnlyVerifiedMatchingCareerAndKeepsLeadingZeros() throws Exception {
        var student = parse(response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Txt_Situacion_Alumno\":\"ACTIVO\"}}]"), "00123");
        assertEquals("uat:00123", student.keycloakUsername());
        assertNull(student.email());
    }

    @Test void retainsNormalizedEmailOnlyWhenInstitutionalEmailWasSubmitted() throws Exception {
        var student = parse(response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situación\":\"ACTIVO\"}}]"), "00123@ALUMNOS.UAT.EDU.MX");
        assertEquals("00123", student.matricula());
        assertEquals("a00123@alumnos.uat.edu.mx", student.email());
    }

    @Test void acceptsPrefixedStudentEmailWithoutChangingMatriculaOrLosingZeros() throws Exception {
        String body = response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"ACTIVO\"}}]");
        var student = parse(body, " A00123@ALUMNOS.UAT.EDU.MX ");
        assertEquals("00123", student.matricula());
        assertEquals("uat:00123", student.keycloakUsername());
        assertEquals("a00123@alumnos.uat.edu.mx", student.email());
    }

    @Test void acceptsCareerFieldFromNormalizedGatewayContract() throws Exception {
        var student = parse(response("[{\"raw\":{\"Num_Matricula\":123},\"situationFields\":[{\"source\":\"career\",\"field\":\"nested.Txt_Situacion\",\"value\":\"ACTIVO\"}]}]"), "123");
        assertEquals("123", student.matricula());
    }

    @Test void checksEachCareerIndependentlyWithoutSelectedPlanAssumptions() throws Exception {
        var student = parse(response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"INACTIVO\"}},{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"ACTIVO\"}}]"), "00123");
        assertEquals("00123", student.matricula());
    }

    @ParameterizedTest @ValueSource(strings={"INSCRITO", "VIGENTE", "activo", "ACTIVO - BAJA", ""})
    void rejectsUnconfirmedStatesAndSubstringMatches(String status) {
        denied(response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"" + status + "\"}}]"), "00123", UatVerificationException.Reason.UNAVAILABLE);
    }

    @ParameterizedTest @ValueSource(strings={"INACTIVO", "BAJA", "EGRESADO"})
    void reportsOnlyExplicitMatchingInactiveState(String status) {
        denied(response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"" + status + "\"}}]"), "00123", UatVerificationException.Reason.INACTIVE);
    }

    @Test void rejectsGlobalHtmlAndSelectedCareerFallback() {
        String body = response("[{\"situation\":\"ACTIVO\",\"raw\":{\"Num_Matricula\":\"00123\",\"CicloActivo\":\"ACTIVO\"},\"situationFields\":[{\"source\":\"selection\",\"field\":\"Situacion\",\"value\":\"ACTIVO\"},{\"source\":\"program-page\",\"field\":\"Situacion\",\"value\":\"ACTIVO\"}]}]");
        body = body.substring(0, body.length()-1) + ",\"situations\":[\"ACTIVO\"],\"programPage\":{\"situations\":[\"ACTIVO\"]}}";
        denied(body, "00123", UatVerificationException.Reason.UNAVAILABLE);
    }

    @Test void rejectsCareerWithDifferentOrMissingMatricula() {
        denied(response("[{\"raw\":{\"Num_Matricula\":\"123\",\"Situacion\":\"ACTIVO\"}}]"), "00123", UatVerificationException.Reason.UNAVAILABLE);
        denied(response("[{\"raw\":{\"Situacion\":\"ACTIVO\"}}]"), "00123", UatVerificationException.Reason.UNAVAILABLE);
    }

    @Test void doesNotMergeIdentityAndStatusAcrossCareers() {
        denied(response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"INACTIVO\"}},{\"raw\":{\"Num_Matricula\":\"999\",\"Situacion\":\"ACTIVO\"}}]"), "00123", UatVerificationException.Reason.INACTIVE);
    }

    @Test void rejectsConflictingFieldsInSameCareer() {
        denied(response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"ACTIVO\",\"Txt_Situacion_Alumno\":\"INACTIVO\"}}]"), "00123", UatVerificationException.Reason.UNAVAILABLE);
    }

    @Test void requiresActualBooleanAuthenticationAndCompletedPasswordChange() {
        String valid = response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"ACTIVO\"}}]");
        denied(valid.replace("\"authenticated\":true", "\"authenticated\":\"true\""), "00123", UatVerificationException.Reason.CREDENTIALS);
        denied(valid.replace("\"exito\":true", "\"exito\":false"), "00123", UatVerificationException.Reason.CREDENTIALS);
        denied(valid.replace("\"cambiaPass\":false", "\"cambiaPass\":true"), "00123", UatVerificationException.Reason.CREDENTIALS);
    }

    @Test void rejectsMissingContractAndInvalidJson() {
        denied("<html>ACTIVO</html>", "00123", UatVerificationException.Reason.UNAVAILABLE);
        denied("{}", "00123", UatVerificationException.Reason.UNAVAILABLE);
        denied(response("{}"), "00123", UatVerificationException.Reason.UNAVAILABLE);
        denied(response("[]"), "00123", UatVerificationException.Reason.UNAVAILABLE);
    }

    @ParameterizedTest @ValueSource(strings={"uat-demo", "123@example.com", "123@uat.edu.mx", "123@alumnos.uat.edu.mx.evil.test", "123/../../x", "-123", "a123", "aa123@alumnos.uat.edu.mx", "a123@example.com"})
    void rejectsUnsupportedIdentityFormats(String username) {
        var error = assertThrows(UatVerificationException.class, () -> PortalResultValidator.canonicalMatricula(username));
        assertEquals(UatVerificationException.Reason.INPUT_USERNAME, error.reason());
    }
}
