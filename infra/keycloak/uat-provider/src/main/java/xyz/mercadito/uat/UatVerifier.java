package xyz.mercadito.uat;

@FunctionalInterface
public interface UatVerifier {
    VerifiedStudent verify(String username, String password) throws UatVerificationException;
}
