package com.example.studio;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
    final HttpStatus status;
    public ApiException(HttpStatus status, String message) { super(message); this.status = status; }
    static ApiException bad(String message) { return new ApiException(HttpStatus.BAD_REQUEST, message); }
    static ApiException missing() { return new ApiException(HttpStatus.NOT_FOUND, "记录不存在或不属于当前用户"); }
}
