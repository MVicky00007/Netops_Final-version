package com.project.netops.api;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class APIResponse<T> {

    private boolean success;
    private String message;
    private T data;

    // Constructor used by fault module controllers (status string, message, data)
    public APIResponse(String status, String message, T data) {
        this.success = "SUCCESS".equalsIgnoreCase(status);
        this.message = message;
        this.data = data;
    }

    public static <T> APIResponse<T> success(T data) {
        return APIResponse.<T>builder()
                .success(true)
                .message("Operation successful")
                .data(data)
                .build();
    }

    public static <T> APIResponse<T> success(String message, T data) {
        return APIResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> APIResponse<T> error(String message) {
        return APIResponse.<T>builder()
                .success(false)
                .message(message)
                .data(null)
                .build();
    }
}
