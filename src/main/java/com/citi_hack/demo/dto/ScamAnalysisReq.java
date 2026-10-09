package com.citi_hack.demo.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
public class ScamAnalysisReq {
    @NotBlank(message = "Message cannot be empty")
    @Size(
            max = 10000,
            message = "Message cannot exceed 10000 characters"
    )
    private String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
