package xyz.mercadito.uat;

import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.authenticators.util.AuthenticatorUtils;
import org.keycloak.authentication.authenticators.browser.AbstractUsernameFormAuthenticator;
import org.keycloak.events.Errors;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.credential.PasswordCredentialModel;

public final class UatAuthenticator implements Authenticator {
    private static final Logger LOG = Logger.getLogger(UatAuthenticator.class);
    private final UatVerifier verifier;
    private final boolean enabled;
    private final String privacyUrl;
    private final String privacyVersion;
    private final java.util.Set<String> allowedMatriculas;

    public UatAuthenticator(UatVerifier verifier, boolean enabled, String privacyUrl) {
        this(verifier, enabled, privacyUrl, "provisional-2026-10-12", null);
    }

    public UatAuthenticator(UatVerifier verifier, boolean enabled, String privacyUrl, String privacyVersion) {
        this(verifier, enabled, privacyUrl, privacyVersion, null);
    }

    public UatAuthenticator(UatVerifier verifier, boolean enabled, String privacyUrl, String privacyVersion, String allowedMatriculas) {
        this.verifier = verifier;
        this.privacyUrl = safePrivacyUrl(privacyUrl);
        java.util.Set<String> parsed;
        boolean validRestriction = true;
        try {
            parsed = parseAllowedMatriculas(allowedMatriculas);
        } catch (IllegalArgumentException error) {
            parsed = java.util.Set.of();
            validRestriction = false;
        }
        this.allowedMatriculas = parsed;
        this.enabled = enabled && this.privacyUrl != null && validRestriction;
        this.privacyVersion = privacyVersion != null && privacyVersion.matches("[a-zA-Z0-9._-]{1,80}")
                ? privacyVersion : "provisional-2026-10-12";
    }

    private static java.util.Set<String> parseAllowedMatriculas(String value) {
        if (value == null || value.isBlank()) return java.util.Set.of();
        var result = new java.util.HashSet<String>();
        for (String entry : value.split(",", -1)) {
            String matricula = entry.strip();
            if (!matricula.matches("[0-9]{1,32}")) throw new IllegalArgumentException("Restricción UAT inválida.");
            result.add(matricula);
        }
        return java.util.Set.copyOf(result);
    }

    private static String safePrivacyUrl(String value) {
        try {
            if (value == null) return null;
            java.net.URI uri = java.net.URI.create(value);
            return "https".equals(uri.getScheme()) && uri.getHost() != null && uri.getUserInfo() == null
                    ? uri.toASCIIString() : null;
        } catch (RuntimeException ignored) {
            return null;
        }
    }

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        context.clearUser();
        context.getAuthenticationSession().clearUserSessionNotes();
        context.getAuthenticationSession().removeAuthNote(AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME);
        if (!enabled) {
            preparation(context);
            return;
        }
        context.challenge(form(context, null));
    }

    @Override
    public void action(AuthenticationFlowContext context) {
        context.clearUser();
        context.getAuthenticationSession().clearUserSessionNotes();
        context.getAuthenticationSession().removeAuthNote(AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME);
        if (!enabled) {
            preparation(context);
            return;
        }
        MultivaluedMap<String, String> input = context.getHttpRequest().getDecodedFormParameters();
        if (input.containsKey("cancel")) {
            context.cancelLogin();
            return;
        }
        if (!"yes".equals(input.getFirst("verificationConsent"))) {
            context.forceChallenge(form(context, "uatConsentRequired"));
            return;
        }
        UserModel existing = null;
        try {
            String username = input.getFirst("username");
            String matricula = PortalResultValidator.canonicalMatricula(username);
            context.getAuthenticationSession().setAuthNote(
                    AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME, "uat:" + matricula);
            if (!allowedMatriculas.isEmpty() && !allowedMatriculas.contains(matricula)) {
                context.getEvent().error(Errors.INVALID_USER_CREDENTIALS);
                context.forceChallenge(form(context, "uatNotAllowed"));
                return;
            }
            existing = context.getSession().users().getUserByUsername(context.getRealm(), "uat:" + matricula);
            if (existing != null && (!existing.isEnabled()
                    || AuthenticatorUtils.getDisabledByBruteForceEventError(context, existing) != null)) {
                context.forceChallenge(form(context, "uatInvalidCredentials"));
                return;
            }
            VerifiedStudent identity = verifier.verify(username, input.getFirst("password"));
            // Defend the provider boundary even if another verifier implementation is installed.
            if (!matricula.equals(identity.matricula())) {
                reject(context, UatVerificationException.Reason.CREDENTIALS);
                return;
            }
            UserModel user = existing;
            if (user == null) {
                user = context.getSession().users().addUser(context.getRealm(), identity.keycloakUsername());
                user.setEnabled(true);
            }
            if (identity.email() != null) {
                user.setEmail(identity.email());
                user.setEmailVerified(false);
            }
            // Retain minimal notice acceptance metadata only after successful portal verification.
            user.setSingleAttribute("mercadito_privacy_version", privacyVersion);
            user.setSingleAttribute("mercadito_privacy_accepted_at", java.time.Instant.now().toString());
            // No local password credential and no university/status attributes.
            context.setUser(user);
            context.getAuthenticationSession().setUserSessionNote("university_id", "uat");
            context.getAuthenticationSession().setUserSessionNote("uat_student_verified", "true");
            if (identity.displayName() != null) {
                context.getAuthenticationSession().setUserSessionNote("uat_display_name", identity.displayName());
            }
            if (identity.fullName() != null) {
                context.getAuthenticationSession().setUserSessionNote("uat_private_name", identity.fullName());
            }
            context.success(PasswordCredentialModel.TYPE);
        } catch (UatVerificationException error) {
            if (existing != null) context.getEvent().user(existing);
            reject(context, error.reason());
        } catch (RuntimeException error) {
            LOG.warnf("UAT_CHECK authenticator_runtime_error kind=%s", error.getClass().getSimpleName());
            reject(context, UatVerificationException.Reason.UNAVAILABLE);
        }
    }

    private Response form(AuthenticationFlowContext context, String errorKey) {
        var form = context.form().setExecution(context.getExecution().getId());
        if (privacyUrl != null) form.setAttribute("uatPrivacyUrl", privacyUrl);
        if (errorKey != null) form.setError(errorKey);
        return form.createForm("uat-login.ftl");
    }

    private void reject(AuthenticationFlowContext context, UatVerificationException.Reason reason) {
        context.clearUser();
        context.getAuthenticationSession().clearUserSessionNotes();
        String message;
        AuthenticationFlowError flowError;
        switch (reason) {
            case INPUT_USERNAME -> {
                message = "uatInvalidUsername";
                flowError = AuthenticationFlowError.INVALID_USER;
            }
            case INPUT_PASSWORD -> {
                message = "uatInvalidPassword";
                flowError = AuthenticationFlowError.INVALID_CREDENTIALS;
            }
            case CREDENTIALS -> {
                message = "uatInvalidCredentials";
                flowError = AuthenticationFlowError.INVALID_CREDENTIALS;
                context.getEvent().error(Errors.INVALID_USER_CREDENTIALS);
            }
            case INACTIVE -> {
                message = "uatInactiveStudent";
                flowError = AuthenticationFlowError.INVALID_USER;
                context.getEvent().error(Errors.USER_DISABLED);
            }
            case UNCONFIRMED_STATUS -> {
                message = "uatUnconfirmedStatus";
                flowError = AuthenticationFlowError.INVALID_USER;
                context.getEvent().error(Errors.GENERIC_AUTHENTICATION_ERROR);
            }
            default -> {
                message = "uatUnavailable";
                flowError = AuthenticationFlowError.INTERNAL_ERROR;
                context.getEvent().error(Errors.GENERIC_AUTHENTICATION_ERROR);
            }
        }
        if (reason == UatVerificationException.Reason.CREDENTIALS) {
            context.failureChallenge(flowError, form(context, message));
        } else {
            // Gateway outages or academic status must not increase password failure counters.
            context.forceChallenge(form(context, message));
        }
    }

    private void preparation(AuthenticationFlowContext context) {
        context.failureChallenge(AuthenticationFlowError.INTERNAL_ERROR,
                context.form().setError("uatPreparing").createForm("uat-disabled.ftl"));
    }

    @Override public boolean requiresUser() { return false; }
    @Override public boolean configuredFor(KeycloakSession session, RealmModel realm, UserModel user) { return true; }
    @Override public void setRequiredActions(KeycloakSession session, RealmModel realm, UserModel user) { }
    @Override public void close() { }
}
