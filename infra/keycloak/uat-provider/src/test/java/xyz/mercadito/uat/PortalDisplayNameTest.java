package xyz.mercadito.uat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PortalDisplayNameTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private final PortalResultValidator validator = new PortalResultValidator();

    private VerifiedStudent verify(String programs, String parameters) throws Exception {
        String body = PortalResultValidatorTest.response(programs);
        if (parameters != null) body = body.replace("\"cambiaPass\":false", "\"cambiaPass\":false,\"parametros\":" + parameters);
        return validator.validate(body.getBytes(StandardCharsets.UTF_8), "00123");
    }

    @Test void keepsOnlyFirstNameAndFirstSurnameInitialIncludingAccents() throws Exception {
        assertEquals("José Luis C.", PortalDisplayName.from(mapper.readTree(
                "{\"Txt_Nombre\":\" JOSÉ   LUIS \",\"Txt_Apellido_Paterno\":\"DE LA CRUZ\",\"Txt_Apellido_Materno\":\"GARCÍA\"}")));
        assertEquals("María Isabel L.", PortalDisplayName.from(mapper.readTree(
                "{\"Nombres\":\"MARÍA ISABEL\",\"ApellidoPaterno\":\"LÓPEZ\"}")));
    }

    @Test void doesNotGuessSurnameOrderFromCombinedName() throws Exception {
        assertEquals("Ana", PortalDisplayName.from(mapper.readTree("{\"NombreCompleto\":\"ANA ISABEL LÓPEZ GARCÍA\"}")));
        assertEquals("Jean-luc O.", PortalDisplayName.from(mapper.readTree("{\"Nombre\":\"JEAN-LUC\",\"Apellido_Paterno\":\"O'NEILL\"}")));
    }

    @Test void ignoresMarkupNumbersControlCharactersAndContradictoryNames() throws Exception {
        for (String json : new String[] {
                "{\"Nombre\":\"<img src=x>\"}", "{\"Nombre\":\"123456\"}",
                "{\"Nombre\":123}", "{\"Nombre\":\"Ana\",\"Txt_Nombre\":\"Otra\"}"}) {
            assertNull(PortalDisplayName.from(mapper.readTree(json)));
        }
    }

    @Test void takesNameOnlyFromTheMatchingEligibleProgram() throws Exception {
        var student = verify("[{\"raw\":{\"Num_Matricula\":\"99999\",\"Situacion\":\"ACTIVO\",\"Nombre\":\"Otra\"}},"
                + "{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"REGULARES\",\"Nombre\":\"MARÍA ISABEL\",\"ApellidoPaterno\":\"LÓPEZ\"}}]", null);
        assertEquals("María Isabel L.", student.displayName());
    }

    @Test void canReadAuthenticatedLoginParametersWithoutCopyingOtherData() throws Exception {
        var student = verify("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"ACTIVO\"}}]",
                "{\"Num_Matricula\":\"00123\",\"Txt_Nombre\":\"ANA ISABEL\",\"Txt_Apellido_Paterno\":\"LÓPEZ\",\"private\":\"discard\"}");
        assertEquals("Ana Isabel L.", student.displayName());
    }

    @Test void loginIdentityMismatchCannotSupplyAnotherStudentsName() throws Exception {
        assertNull(verify("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"ACTIVO\"}}]",
                "{\"Num_Matricula\":\"99999\",\"Nombre\":\"Otra\"}").displayName());
    }

    @Test void missingNameDoesNotTurnAnEligibleStudentIntoAnAuthenticationFailure() throws Exception {
        assertNull(verify("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"ACTIVO\"}}]", null).displayName());
    }
    @Test void keepsEachStudentsPrivateNameSeparate() throws Exception {
        var maria = mapper.readTree("{\"Txt_Nombre\":\"MARÍA ISABEL\",\"Txt_Apellido_Paterno\":\"LÓPEZ\",\"Txt_Apellido_Materno\":\"GARCÍA\"}");
        var carlos = mapper.readTree("{\"Txt_Nombre\":\"CARLOS ALBERTO\",\"Txt_Apellido_Paterno\":\"MÉNDEZ\",\"Txt_Apellido_Materno\":\"RUIZ\"}");
        assertEquals("María Isabel L.", PortalDisplayName.from(maria));
        assertEquals("Carlos Alberto M.", PortalDisplayName.from(carlos));
        assertEquals("María Isabel López García", PortalDisplayName.fullName(maria));
        assertEquals("Carlos Alberto Méndez Ruiz", PortalDisplayName.fullName(carlos));
    }

}
