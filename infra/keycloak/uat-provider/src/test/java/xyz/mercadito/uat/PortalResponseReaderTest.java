package xyz.mercadito.uat;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PortalResponseReaderTest {
    private final PortalResponseReader reader = new PortalResponseReader();

    @Test void retainsOnlyEvidenceAndDiscardsLargeUnneededFields() throws Exception {
        String large = "x".repeat(2 * 1_048_576);
        String body = "{\"source\":\"UAT\",\"authenticated\":true,\"login\":{\"exito\":true,"
                + "\"cambiaPass\":false,\"parametros\":{\"photo\":\"" + large + "\"}},"
                + "\"programs\":[{\"raw\":{\"Num_Matricula\":\"00123\",\"nested\":{\"Situación\":\"ACTIVO\","
                + "\"extra\":\"" + large + "\"},\"name\":\"student\",\"Foto\":\"" + large + "\"},"
                + "\"situationFields\":[{\"field\":\"Situacion\",\"source\":\"career\",\"value\":\"ACTIVO\",\"extra\":\"discard\"}]}],"
                + "\"schedule\":[{\"private\":\"" + large + "\"}]}";
        var root = reader.read(body.getBytes(StandardCharsets.UTF_8));
        assertEquals(4, root.size());
        assertEquals(2, root.path("login").size());
        assertEquals(2, root.path("programs").path(0).path("raw").size());
        assertEquals(1, root.path("programs").path(0).path("raw").path("nested").size());
        assertEquals(3, root.path("programs").path(0).path("situationFields").path(0).size());
        assertFalse(root.toString().contains("student"));
        assertTrue(root.toString().length() < 1024);
    }

    @Test void refusesDuplicateEvidenceMalformedSkippedDataAndTrailingJson() {
        for (String json : new String[]{
                "{\"source\":\"UAT\",\"source\":\"other\"}",
                "{\"source\":\"UAT\",\"extra\":[1,]}",
                "{\"source\":\"UAT\"} {}",
                "{\"source\":\"UAT\",\"extra\":{\"unfinished\":",
                "{\"programs\":["
        }) {
            assertThrows(IOException.class, () -> reader.read(json.getBytes(StandardCharsets.UTF_8)));
        }
    }

    @Test void boundsEvidenceInsteadOfAcceptingOversizedRequiredFields() {
        String body = "{\"source\":\"" + "x".repeat(4097) + "\"}";
        assertThrows(IOException.class, () -> reader.read(body.getBytes(StandardCharsets.UTF_8)));
    }

    @Test void preservesNumericIdentityAndConflictingNestedCareerEvidence() throws Exception {
        String body = PortalResultValidatorTest.response("[{\"raw\":{\"Num_Matricula\":123,\"Situacion\":\"ACTIVO\","
                + "\"nested\":{\"Txt_Situacion_Alumno\":\"INACTIVO\"}}}]");
        var root = reader.read(body.getBytes(StandardCharsets.UTF_8));
        assertTrue(root.path("programs").path(0).path("raw").path("Num_Matricula").isIntegralNumber());
        var denied = assertThrows(UatVerificationException.class,
                () -> new PortalResultValidator().validate(body.getBytes(StandardCharsets.UTF_8), "123"));
        assertEquals(UatVerificationException.Reason.UNCONFIRMED_STATUS, denied.reason());
    }
}
