package com.citi_hack.demo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MlResponse(
        @JsonProperty("risk_score") int riskScore,
        String verdict,
        List<String> reasons,
        String advice,
        @JsonProperty("is_scam") boolean isScam,
        @JsonProperty("ocr_text") String ocrText
) {
}
