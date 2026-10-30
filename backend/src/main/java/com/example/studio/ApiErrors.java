package com.example.studio;

import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import java.util.Map;

@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler(ApiException.class)
    ResponseEntity<?> known(ApiException e) { return ResponseEntity.status(e.status).body(Map.of("message", e.getMessage())); }
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<?> large() { return ResponseEntity.status(413).body(Map.of("message", "图片不能超过 5MB")); }
    @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class,
            org.springframework.web.bind.MissingServletRequestParameterException.class,
            org.springframework.web.multipart.support.MissingServletRequestPartException.class})
    ResponseEntity<?> malformed() { return ResponseEntity.badRequest().body(Map.of("message", "请求字段缺失或格式不正确")); }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> unknown(Exception e) {
        LoggerFactory.getLogger(ApiErrors.class).error("Request failed", e);
        return ResponseEntity.internalServerError().body(Map.of("message", "服务暂时不可用，请稍后重试"));
    }
}
