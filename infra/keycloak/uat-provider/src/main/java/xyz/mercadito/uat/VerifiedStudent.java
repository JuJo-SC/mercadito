package xyz.mercadito.uat;

/** The gateway's verified identity, with no credential or academic record retained. */
public record VerifiedStudent(String matricula, String email, String displayName, String fullName, String facultyName) {
    public VerifiedStudent(String matricula, String email) {
        this(matricula, email, null, null, null);
    }

    public VerifiedStudent(String matricula, String email, String displayName) {
        this(matricula, email, displayName, null, null);
    }

    public VerifiedStudent(String matricula, String email, String displayName, String fullName) {
        this(matricula, email, displayName, fullName, null);
    }

    public String keycloakUsername() {
        return "uat:" + matricula;
    }
}
