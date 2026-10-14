package xyz.mercadito.uat;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.core.StreamReadFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.NullNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.util.Set;

/** Retains only the authentication and career evidence needed by Mercadito. */
final class PortalResponseReader {
    private static final int MAX_ITEMS = 128;
    private static final int MAX_TEXT = 4096;
    private final ObjectMapper mapper = new ObjectMapper();

    JsonNode read(byte[] body) throws IOException {
        try (JsonParser parser = mapper.getFactory().createParser(body)) {
            parser.enable(StreamReadFeature.STRICT_DUPLICATE_DETECTION.mappedFeature());
            if (parser.nextToken() != JsonToken.START_OBJECT) {
                throw new IOException("Contrato UAT inválido.");
            }
            ObjectNode root = mapper.createObjectNode();
            while (nextField(parser)) {
                String name = parser.currentName();
                parser.nextToken();
                switch (name) {
                    case "source", "authenticated", "error" -> root.set(name, scalar(parser));
                    case "login" -> root.set(name, login(parser));
                    case "programs" -> root.set(name, programs(parser));
                    default -> parser.skipChildren();
                }
            }
            if (parser.nextToken() != null) throw new IOException("Contrato UAT inválido.");
            return root;
        }
    }

    private JsonNode login(JsonParser parser) throws IOException {
        if (parser.currentToken() != JsonToken.START_OBJECT) return discard(parser);
        ObjectNode login = mapper.createObjectNode();
        while (nextField(parser)) {
            String name = parser.currentName();
            parser.nextToken();
            if (Set.of("exito", "cambiaPass").contains(name)) login.set(name, scalar(parser));
            else if ("parametros".equals(name)) {
                JsonNode identity = rawCareer(parser, 0);
                if (!identity.isEmpty()) login.set(name, identity);
            } else parser.skipChildren();
        }
        return login;
    }

    private JsonNode programs(JsonParser parser) throws IOException {
        if (parser.currentToken() != JsonToken.START_ARRAY) return discard(parser);
        ArrayNode programs = mapper.createArrayNode();
        while (parser.nextToken() != JsonToken.END_ARRAY) {
            requireToken(parser);
            if (programs.size() >= MAX_ITEMS) throw new IOException("Contrato UAT excede límites.");
            if (parser.currentToken() != JsonToken.START_OBJECT) {
                programs.add(discard(parser));
                continue;
            }
            ObjectNode program = mapper.createObjectNode();
            while (nextField(parser)) {
                String name = parser.currentName();
                parser.nextToken();
                switch (name) {
                    case "raw" -> program.set(name, rawCareer(parser, 0));
                    case "situationFields" -> program.set(name, situationFields(parser));
                    default -> parser.skipChildren();
                }
            }
            programs.add(program);
        }
        return programs;
    }

    private JsonNode rawCareer(JsonParser parser, int depth) throws IOException {
        if (parser.currentToken() != JsonToken.START_OBJECT || depth > 3) return discard(parser);
        ObjectNode raw = mapper.createObjectNode();
        int fields = 0;
        while (nextField(parser)) {
            if (++fields > 512) throw new IOException("Contrato UAT excede límites.");
            String name = parser.currentName();
            parser.nextToken();
            // Unknown name property names only; never retain their personal values.
            if (depth == 0 && !PortalDisplayName.recognizedField(name)
                    && name.matches("(?i)[A-Za-z0-9_]*(?:nom|apell|paterno|materno)[A-Za-z0-9_]*")) {
                String schema = raw.path("_name_fields").asText("");
                if (schema.length() < 400) raw.put("_name_fields", schema.isEmpty() ? name : schema + "," + name);
            }
            if ((depth == 0 && "Num_Matricula".equals(name)) || PortalResultValidator.recognizedField(name)
                    || (depth == 0 && PortalDisplayName.recognizedField(name))) {
                raw.set(name, scalar(parser));
            } else if (parser.currentToken() == JsonToken.START_OBJECT && depth < 3) {
                JsonNode nested = rawCareer(parser, depth + 1);
                if (!nested.isEmpty()) raw.set(name, nested);
            } else {
                parser.skipChildren();
            }
        }
        return raw;
    }

    private JsonNode situationFields(JsonParser parser) throws IOException {
        if (parser.currentToken() != JsonToken.START_ARRAY) return discard(parser);
        ArrayNode fields = mapper.createArrayNode();
        while (parser.nextToken() != JsonToken.END_ARRAY) {
            requireToken(parser);
            if (fields.size() >= MAX_ITEMS) throw new IOException("Contrato UAT excede límites.");
            fields.add(selectedObject(parser, Set.of("field", "value", "source")));
        }
        return fields;
    }

    private JsonNode selectedObject(JsonParser parser, Set<String> selected) throws IOException {
        if (parser.currentToken() != JsonToken.START_OBJECT) return discard(parser);
        ObjectNode object = mapper.createObjectNode();
        while (nextField(parser)) {
            String name = parser.currentName();
            parser.nextToken();
            if (selected.contains(name)) object.set(name, scalar(parser));
            else parser.skipChildren();
        }
        return object;
    }

    private JsonNode scalar(JsonParser parser) throws IOException {
        requireToken(parser);
        if (parser.currentToken() == JsonToken.VALUE_STRING) {
            if (parser.getTextLength() > MAX_TEXT) throw new IOException("Contrato UAT excede límites.");
            return mapper.getNodeFactory().textNode(parser.getText());
        }
        if (parser.currentToken().isNumeric()) {
            if (parser.getTextLength() > 128) throw new IOException("Contrato UAT excede límites.");
            return mapper.readTree(parser);
        }
        if (parser.currentToken() == JsonToken.VALUE_TRUE) return mapper.getNodeFactory().booleanNode(true);
        if (parser.currentToken() == JsonToken.VALUE_FALSE) return mapper.getNodeFactory().booleanNode(false);
        // Preserve invalid container types so a malformed cambiaPass cannot become permitted null.
        if (parser.currentToken() == JsonToken.START_OBJECT) {
            parser.skipChildren();
            return mapper.createObjectNode();
        }
        if (parser.currentToken() == JsonToken.START_ARRAY) {
            parser.skipChildren();
            return mapper.createArrayNode();
        }
        return discard(parser);
    }

    private JsonNode discard(JsonParser parser) throws IOException {
        requireToken(parser);
        parser.skipChildren();
        return NullNode.getInstance();
    }

    private boolean nextField(JsonParser parser) throws IOException {
        JsonToken token = parser.nextToken();
        if (token == JsonToken.END_OBJECT) return false;
        if (token != JsonToken.FIELD_NAME || parser.currentName().length() > 128) {
            throw new IOException("Contrato UAT inválido.");
        }
        return true;
    }

    private void requireToken(JsonParser parser) throws IOException {
        if (parser.currentToken() == null) throw new IOException("Contrato UAT incompleto.");
    }
}
