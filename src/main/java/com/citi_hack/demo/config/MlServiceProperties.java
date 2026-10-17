package com.citi_hack.demo.config;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
public record MlServiceProperties( String url,
                                   Duration connectTimeout,
                                   Duration readTimeout) {
    public MlServiceProperties {
        if (url == null || url.isBlank()) url = "http://localhost:8000";
        if (connectTimeout == null) connectTimeout = Duration.ofSeconds(3);
        // First OCR call loads EasyOCR models, so allow a generous read timeout.
        if (readTimeout == null) readTimeout = Duration.ofSeconds(60);
    }
}
