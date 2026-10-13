package xyz.mercadito.uat;

/** The gateway's verified identity, with no credential or academic record retained. */
public record VerifiedStudent(String matricula, String email) {
    public String keycloakUsername() {
        return "uat:" + matricula;
    }
}
