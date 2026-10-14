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
    private static final Set<String> MATERNAL = Set.of(
            "apellido_materno", "apellidomaterno", "txt_apellido_materno", "txt_apellidomaterno",
            "segundo_apellido", "segundoapellido", "ap_materno", "txt_ap_materno", "txt_materno");
    private static final Set<String> PARTICLES = Set.of("de", "del", "la", "las", "los", "y");

    static boolean recognizedField(String field) {
        return GIVEN.contains(key(field)) || SURNAME.contains(key(field)) || MATERNAL.contains(key(field));
    }

    static String from(JsonNode record) {
        if (!record.isObject()) return null;
        String given = value(record, GIVEN);
        if (given == null) return null;
        String surname = value(record, SURNAME);
        // Separated surnames establish which terms are given names. Never expose a combined surname by guessing.
        String display = title(surname != null ? given : given.split(" ")[0]);
        if (display.length() > 120) return null;
        if (surname != null) {
            for (String token : surname.split(" ")) {
                if (PARTICLES.contains(token.toLowerCase(SPANISH))) continue;
                display += " " + new String(Character.toChars(Character.toUpperCase(token.codePointAt(0)))) + ".";
                break;
            }
        }
        return display;
    }

    static String fullName(JsonNode record) {
        if (!record.isObject()) return null;
        String given = value(record, GIVEN);
        if (given == null) return null;
        String paternal = value(record, SURNAME);
        String maternal = value(record, MATERNAL);
        String full = given + (paternal == null ? "" : " " + paternal) + (maternal == null ? "" : " " + maternal);
        return full.length() <= 180 ? title(full) : null;
    }

    private static String title(String text) {
        return java.util.Arrays.stream(text.split(" ")).map(part -> {
            String lower = part.toLowerCase(SPANISH);
            if (PARTICLES.contains(lower)) return lower;
            int first = part.codePointAt(0);
            return new String(Character.toChars(Character.toUpperCase(first)))
                    + part.substring(Character.charCount(first)).toLowerCase(SPANISH);
        }).collect(java.util.stream.Collectors.joining(" "));
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
