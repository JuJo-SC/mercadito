package xyz.mercadito.uat;

import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.events.EventBuilder;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.http.HttpRequest;
import org.keycloak.models.AuthenticationExecutionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserProvider;
import org.keycloak.sessions.AuthenticationSessionModel;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class UatAuthenticatorTest {
    private AuthenticationFlowContext context;
    private UatVerifier verifier;
    private UserProvider users;
    private RealmModel realm;
    private AuthenticationSessionModel authenticationSession;
    private LoginFormsProvider forms;
    private MultivaluedHashMap<String, String> input;
    private UatAuthenticator authenticator;

    @BeforeEach void setup() {
        context = mock(AuthenticationFlowContext.class);
        verifier = mock(UatVerifier.class);
        users = mock(UserProvider.class);
        realm = mock(RealmModel.class);
        KeycloakSession session = mock(KeycloakSession.class);
        when(session.users()).thenReturn(users);
        when(context.getSession()).thenReturn(session);
        when(context.getRealm()).thenReturn(realm);
        authenticationSession = mock(AuthenticationSessionModel.class);
        when(context.getAuthenticationSession()).thenReturn(authenticationSession);
        forms = mock(LoginFormsProvider.class, RETURNS_SELF);
        when(forms.createForm(anyString())).thenReturn(mock(Response.class));
        when(context.form()).thenReturn(forms);
        AuthenticationExecutionModel execution = mock(AuthenticationExecutionModel.class);
        when(execution.getId()).thenReturn("test-execution");
        when(context.getExecution()).thenReturn(execution);
        EventBuilder events = mock(EventBuilder.class, RETURNS_SELF);
        when(context.getEvent()).thenReturn(events);
        HttpRequest request = mock(HttpRequest.class);
        input = new MultivaluedHashMap<>();
        input.add("username", "00123");
        input.add("password", "test-password");
        input.add("verificationConsent", "yes");
        when(request.getDecodedFormParameters()).thenReturn(input);
        when(context.getHttpRequest()).thenReturn(request);
        authenticator = new UatAuthenticator(verifier, true, "https://example.test/privacy");
    }

    @Test void closedGateNeverAsksForOrReadsCredentials() {
        authenticator = new UatAuthenticator(verifier, false, null);
        authenticator.authenticate(context);
        authenticator.action(context);
        verify(forms, times(2)).createForm("uat-disabled.ftl");
        verify(context, never()).getHttpRequest();
        verifyNoInteractions(verifier, users);
        verify(context, never()).success();
        verify(authenticationSession, never()).setUserSessionNote(anyString(), anyString());
    }

    @Test void requiresExplicitConsentBeforeGatewayRequest() {
        input.remove("verificationConsent");
        authenticator.action(context);
        verifyNoInteractions(verifier, users);
        verify(forms).setError("uatConsentRequired");
        verify(context).forceChallenge(any(Response.class));
    }

    @Test void createsOnlyAfterSuccessfulVerificationAndEmitsNotesBeforeSuccess() throws Exception {
        UserModel user = mock(UserModel.class);
        when(verifier.verify("00123", "test-password")).thenReturn(new VerifiedStudent("00123", null));
        when(users.addUser(realm, "uat:00123")).thenReturn(user);
        authenticator.action(context);
        var sequence = inOrder(verifier, users, context, authenticationSession);
        sequence.verify(verifier).verify("00123", "test-password");
        sequence.verify(users).addUser(realm, "uat:00123");
        sequence.verify(context).setUser(user);
        sequence.verify(authenticationSession).setUserSessionNote("university_id", "uat");
        sequence.verify(authenticationSession).setUserSessionNote("uat_student_verified", "true");
        sequence.verify(context).success("password");
        verify(user).setEnabled(true);
        verify(user, never()).credentialManager();
        verify(user).setSingleAttribute("mercadito_privacy_version", "provisional-2026-10-12");
        verify(user).setSingleAttribute(eq("mercadito_privacy_accepted_at"), matches("\\d{4}-.*Z"));
        verify(user, never()).setSingleAttribute(eq("university_id"), anyString());
        verify(user, never()).setSingleAttribute(eq("uat_student_verified"), anyString());
        verify(user, never()).setEmail(anyString());
    }

    @Test void reportsCredentialInactiveAndAvailabilityFailuresWithoutCreatingUser() throws Exception {
        for (var reason : UatVerificationException.Reason.values()) {
            reset(verifier);
            when(verifier.verify(anyString(), anyString())).thenThrow(new UatVerificationException(reason));
            authenticator.action(context);
        }
        verify(users, never()).addUser(any(), anyString());
        verify(context, never()).setUser(any());
        verify(context, never()).success();
        verify(authenticationSession, never()).setUserSessionNote(anyString(), anyString());
        verify(context).failureChallenge(eq(AuthenticationFlowError.INVALID_CREDENTIALS), any());
        verify(context, times(4)).forceChallenge(any());
        verify(forms).setError("uatInvalidCredentials");
        verify(forms).setError("uatInvalidUsername");
        verify(forms).setError("uatInvalidPassword");
        verify(forms).setError("uatInactiveStudent");
        verify(forms).setError("uatUnavailable");
    }

    @Test void rejectsDisabledAccountWithoutCallingGateway() {
        UserModel user = mock(UserModel.class);
        when(users.getUserByUsername(realm, "uat:00123")).thenReturn(user);
        when(user.isEnabled()).thenReturn(false);
        authenticator.action(context);
        verifyNoInteractions(verifier);
        verify(context, never()).success();
    }

    @Test void refusesVerifierIdentityMismatch() throws Exception {
        when(verifier.verify(anyString(), anyString())).thenReturn(new VerifiedStudent("999", null));
        authenticator.action(context);
        verify(users, never()).addUser(any(), anyString());
        verify(context, never()).success();
    }

    @Test void usesHttpsPrivacyLinkAndClosesWhenUrlIsInvalid() {
        authenticator.authenticate(context);
        verify(forms).setAttribute("uatPrivacyUrl", "https://example.test/privacy");
        new UatAuthenticator(verifier, true, "javascript:alert(1)").authenticate(context);
        verify(forms).createForm("uat-disabled.ftl");
    }

    @Test void keepsAttemptedCanonicalUsernameForNativeFailureDetection() throws Exception {
        when(verifier.verify(anyString(), anyString())).thenThrow(
                new UatVerificationException(UatVerificationException.Reason.CREDENTIALS));
        authenticator.action(context);
        verify(authenticationSession).setAuthNote(
                org.keycloak.authentication.authenticators.browser.AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME,
                "uat:00123");
        verify(authenticationSession, times(1)).removeAuthNote(
                org.keycloak.authentication.authenticators.browser.AbstractUsernameFormAuthenticator.ATTEMPTED_USERNAME);
        verify(context, never()).setUser(any());
    }

    @Test void allowlistRestrictsBeforeUserLookupAndGatewayRequest() {
        authenticator = new UatAuthenticator(verifier, true, "https://example.test/privacy", "fixture-v1", "000987");
        authenticator.action(context);
        verifyNoInteractions(verifier, users);
        verify(forms).setError("uatNotAllowed");
        verify(context).forceChallenge(any());
    }

    @Test void allowlistPreservesLeadingZerosAndAcceptsExactEntries() throws Exception {
        UserModel user = mock(UserModel.class);
        when(verifier.verify("00123", "test-password")).thenReturn(new VerifiedStudent("00123", null));
        when(users.addUser(realm, "uat:00123")).thenReturn(user);
        authenticator = new UatAuthenticator(verifier, true, "https://example.test/privacy", "fixture-v1", "00123,000987");
        authenticator.action(context);
        verify(context).success("password");
    }

    @Test void allowlistUsesNumericMatriculaForAPrefixedInstitutionalAccount() throws Exception {
        input.putSingle("username", "a00123@alumnos.uat.edu.mx");
        UserModel user = mock(UserModel.class);
        when(verifier.verify("a00123@alumnos.uat.edu.mx", "test-password"))
                .thenReturn(new VerifiedStudent("00123", "a00123@alumnos.uat.edu.mx"));
        when(users.addUser(realm, "uat:00123")).thenReturn(user);
        authenticator = new UatAuthenticator(verifier, true, "https://example.test/privacy", "fixture-v1", "00123");
        authenticator.action(context);
        verify(context).success("password");
        verify(authenticationSession).setUserSessionNote("university_id", "uat");
    }

    @Test void malformedAllowlistClosesInsteadOfAllowingAllAccounts() {
        authenticator = new UatAuthenticator(verifier, true, "https://example.test/privacy", "fixture-v1", "00123,invalid");
        authenticator.authenticate(context);
        authenticator.action(context);
        verifyNoInteractions(verifier, users);
        verify(forms, times(2)).createForm("uat-disabled.ftl");
    }

    @Test void doesNotRequireLocalCredentialsOrRequiredActions() {
        assertFalse(authenticator.requiresUser());
        assertTrue(authenticator.configuredFor(null, null, null));
        authenticator.setRequiredActions(null, null, null);
    }
}
