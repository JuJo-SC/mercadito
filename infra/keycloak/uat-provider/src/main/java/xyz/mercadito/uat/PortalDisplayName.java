package xyz.mercadito.uat;

import com.fasterxml.jackson.databind.JsonNode;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

/** Reduces portal names before any identity is stored or emitted. */
final class PortalDisplayName {
    private static final Locale SPANISH = Locale.forLanguageTag("es-MX");
    private static final Set<String> GIVEN = Set.of(
            "nombre", "nombres", "txt_nombre", "txt_nombres", "nombre_alumno", "txt_nombre_alumno",
            "txt_nombre_alumnosuat", "nombrecompleto", "nombre_completo", "txt_nombre_completo");
    private static final Set<String> SURNAME = Set.of(
            "apellido_paterno", "apellidopaterno", "txt_apellido_paterno", "txt_apellidopaterno",
            "primerapellido", "primer_apellido", "txt_primer_apellido", "ap_paterno", "txt_ap_paterno", "txt_paterno");
    private static final Set<String> PARTICLES = Set.of("de", "del", "la", "las", "los", "y");

    static boolean recognizedField(String field) {
        return GIVEN.contains(key(field)) || SURNAME.contains(key(field));
    }

    static String from(JsonNode record) {
        if (!record.isObject()) return null;
        String given = value(record, GIVEN);
        if (given == null) return null;
        String first = given.split(" ")[0];
        if (first.length() > 40) return null;
        int initial = first.codePointAt(0);
        String display = new String(Character.toChars(Character.toUpperCase(initial)))
                + first.substring(Character.charCount(initial)).toLowerCase(SPANISH);
        String surname = value(record, SURNAME);
        if (surname != null) {
            for (String token : surname.split(" ")) {
                if (PARTICLES.contains(token.toLowerCase(SPANISH))) continue;
                display += " " + new String(Character.toChars(Character.toUpperCase(token.codePointAt(0)))) + ".";
                break;
            }
        }
        return display;
    }

    private static String value(JsonNode record, Set<String> fields) {
        String result = null;
        for (var entry : record.properties()) {
            if (!fields.contains(key(entry.getKey())) || !entry.getValue().isTextual()) continue;
            String text = Normalizer.normalize(entry.getValue().asText(), Normalizer.Form.NFC)
                    .strip().replaceAll("\\s+", " ");
            if (text.isEmpty() || text.length() > 160 || !text.matches("[\\p{L}\\p{M}]+(?:[ '\u2019-][\\p{L}\\p{M}]+)*")) continue;
            if (result != null && !result.equalsIgnoreCase(text)) return null;
            result = text;
        }
        return result;
    }

    private static String key(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
    }
}
