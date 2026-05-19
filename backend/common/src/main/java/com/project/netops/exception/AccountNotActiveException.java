package com.project.netops.exception;
public class AccountNotActiveException extends RuntimeException {
    public AccountNotActiveException(String message) { super(message); }
}
