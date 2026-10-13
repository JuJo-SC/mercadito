package xyz.mercadito.uat;

public final class UatVerificationException extends Exception {
    public enum Reason { CREDENTIALS, INACTIVE, UNAVAILABLE }

    private final Reason reason;

    public UatVerificationException(Reason reason) {
        super(reason.name());
        this.reason = reason;
    }

    public Reason reason() {
        return reason;
    }
}
