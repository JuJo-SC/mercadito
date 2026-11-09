package xyz.mercadito.uat;

import com.fasterxml.jackson.databind.JsonNode;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Set;

/** Faculty comes only from the career whose identity and eligibility were verified. */
final class PortalFaculty {
    private static final Set<String> FIELDS = Set.of(
            "txt_des", "txt_facultad", "facultad", "nombre_facultad", "txt_nombre_facultad",
            "txt_dependencia", "dependencia", "txt_unidad_academica", "unidad_academica",
            "txt_escuela", "nombre_escuela");

    static boolean recognizedField(String field) {
        return FIELDS.contains(Normalizer.normalize(field, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT));
    }

    static String from(JsonNode record) {
        if (!record.isObject()) return null;
        String result = null;
        for (var entry : record.properties()) {
            if (!recognizedField(entry.getKey()) || !entry.getValue().isTextual()) continue;
            String value = Normalizer.normalize(entry.getValue().asText(), Normalizer.Form.NFC)
                    .strip().replaceAll("\\s+", " ");
            if (value.isEmpty() || value.length() > 180 || !value.matches("[\\p{L}\\p{M}\\p{N} .,()&'’/\\-]+")
                    || !value.matches(".*\\p{L}.*")) continue;
            if (result != null && !result.equalsIgnoreCase(value)) return null;
            result = value;
        }
        return result;
    }
}
