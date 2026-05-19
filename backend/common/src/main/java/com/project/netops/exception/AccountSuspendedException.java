package com.project.netops.exception;
public class AccountSuspendedException extends RuntimeException {
    public AccountSuspendedException(String message) { super(message); }
}
