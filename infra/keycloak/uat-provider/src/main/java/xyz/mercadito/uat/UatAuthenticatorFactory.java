package xyz.mercadito.uat;

import java.util.List;
import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.models.AuthenticationExecutionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.models.credential.PasswordCredentialModel;
import org.keycloak.provider.ProviderConfigProperty;

public final class UatAuthenticatorFactory implements AuthenticatorFactory {
    public static final String PROVIDER_ID = "mercadito-uat-authenticator";
    private Authenticator authenticator;

    @Override
    public void init(Config.Scope config) {
        UatVerifier verifier;
        try {
            verifier = new UatGatewayClient(System.getenv("UAT_GATEWAY_URL"), System.getenv("UAT_GATEWAY_API_KEY"));
        } catch (RuntimeException error) {
            verifier = (username, password) -> {
                throw new UatVerificationException(UatVerificationException.Reason.UNAVAILABLE);
            };
        }
        authenticator = new UatAuthenticator(verifier,
                "true".equals(System.getenv("UAT_LOGIN_ENABLED")), System.getenv("UAT_PRIVACY_URL"),
                System.getenv("UAT_PRIVACY_VERSION"), System.getenv("UAT_ALLOWED_MATRICULAS"));
    }

    @Override public Authenticator create(KeycloakSession session) { return authenticator; }
    @Override public String getId() { return PROVIDER_ID; }
    @Override public String getDisplayType() { return "Verificación del portal UAT"; }
    @Override public String getReferenceCategory() { return PasswordCredentialModel.TYPE; }
    @Override public String getHelpText() { return "Comprueba credenciales y situación ACTIVO sin guardar la contraseña del portal."; }
    @Override public boolean isConfigurable() { return false; }
    @Override public boolean isUserSetupAllowed() { return false; }
    @Override public List<ProviderConfigProperty> getConfigProperties() { return List.of(); }
    @Override public AuthenticationExecutionModel.Requirement[] getRequirementChoices() {
        return new AuthenticationExecutionModel.Requirement[] {
                AuthenticationExecutionModel.Requirement.REQUIRED,
                AuthenticationExecutionModel.Requirement.DISABLED };
    }
    @Override public void postInit(KeycloakSessionFactory factory) { }
    @Override public void close() { }
}
