package com.citi_hack.demo.client;

import com.citi_hack.demo.dto.MlResponse;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Map;

@Component
public class MlServiceClient {
    private final RestClient client;

    public MlServiceClient(RestClient mlRestClient) {
        this.client = mlRestClient;
    }

    public MlResponse analyzeText(String message) {
        try {
            return client.post()
                    .uri("/analyze")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("message", message))
                    .retrieve()
                    .body(MlResponse.class);
        } catch (RestClientException e) {
            throw unavailable(e);
        }
    }

    public MlResponse analyzeImage(MultipartFile image) {
        try {
            final String filename = image.getOriginalFilename() != null
                    ? image.getOriginalFilename() : "upload.png";

            ByteArrayResource resource = new ByteArrayResource(image.getBytes()) {
                @Override
                public String getFilename() {
                    return filename;   // required so the part is sent as a file
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("image", resource);

            return client.post()
                    .uri("/analyze-image")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(body)
                    .retrieve()
                    .body(MlResponse.class);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded image", e);
        } catch (RestClientException e) {
            throw unavailable(e);
        }
    }

    private ResponseStatusException unavailable(RestClientException e) {
        return new ResponseStatusException(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Scam detection service is unavailable. Please try again shortly.", e);
    }
}
