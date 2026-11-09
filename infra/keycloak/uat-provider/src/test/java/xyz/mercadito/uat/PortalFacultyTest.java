package xyz.mercadito.uat;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PortalFacultyTest {
    private final ObjectMapper mapper = new ObjectMapper();

    @Test void readsFacultyNameAndNeverUsesCareerOrNumericIdAsAName() throws Exception {
        assertEquals("Facultad de Ingeniería", PortalFaculty.from(mapper.readTree("{\"Txt_DES\":\"Facultad de Ingeniería\",\"Id_DES\":12}")));
        assertNull(PortalFaculty.from(mapper.readTree("{\"Txt_Programa_Academico\":\"Ingeniería de Software\",\"Id_DES\":12}")));
        assertNull(PortalFaculty.from(mapper.readTree("{\"Txt_DES\":\"12\"}")));
    }

    @Test void rejectsMarkupAndContradictoryFaculties() throws Exception {
        assertNull(PortalFaculty.from(mapper.readTree("{\"Txt_DES\":\"<img src=x>\"}")));
        assertNull(PortalFaculty.from(mapper.readTree("{\"Txt_DES\":\"Facultad A\",\"Facultad\":\"Facultad B\"}")));
    }

    @Test void facultyBelongsOnlyToTheMatchingEligibleCareer() throws Exception {
        String body = PortalResultValidatorTest.response("[{\"raw\":{\"Num_Matricula\":\"999\",\"Situacion\":\"ACTIVO\",\"Txt_DES\":\"Facultad ajena\"}},"
                + "{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"REGULARES\",\"Txt_DES\":\"Facultad de Enfermería\"}}]");
        var student = new PortalResultValidator().validate(body.getBytes(StandardCharsets.UTF_8), "00123");
        assertEquals("Facultad de Enfermería", student.facultyName());
    }

    @Test void missingFacultyDoesNotBlockStudentAccess() throws Exception {
        String body = PortalResultValidatorTest.response("[{\"raw\":{\"Num_Matricula\":\"00123\",\"Situacion\":\"ACTIVO\"}}]");
        assertNull(new PortalResultValidator().validate(body.getBytes(StandardCharsets.UTF_8), "00123").facultyName());
    }
}
