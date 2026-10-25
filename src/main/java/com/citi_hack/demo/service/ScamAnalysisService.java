package com.citi_hack.demo.service;

import com.citi_hack.demo.client.MlServiceClient;
import com.citi_hack.demo.dto.MlResponse;
import com.citi_hack.demo.dto.ScamAnalysisRes;
import com.citi_hack.demo.dto.ScamSignal;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Service
public class ScamAnalysisService {

    private static final int HIGH_THRESHOLD = 75;
    private static final int MEDIUM_THRESHOLD = 50;   // matches THRESHOLD in scam_core.py

    // Signal text coming from scam_core.find_flags() -> severity + description
    private static final Map<String, String[]> SIGNAL_INFO = Map.of(
            "External link in the message",
            new String[]{"HIGH", "The message contains a link that may lead to a phishing site."},
            "Account / KYC verification request",
            new String[]{"HIGH", "The message asks you to verify or update account or KYC details."},
            "Mentions OTP / PIN / password",
            new String[]{"HIGH", "The message refers to OTPs, PINs or passwords, which banks never ask for."},
            "Unexpected money / reward claim",
            new String[]{"MEDIUM", "The message promises money or a reward you did not expect."},
            "Urgent or threatening language",
            new String[]{"MEDIUM", "The message pressures you to act quickly or threatens consequences."},
            "Asks you to call or pay a phone number",
            new String[]{"MEDIUM", "The message asks you to call or send money to a phone number."}
    );

    private final MlServiceClient mlClient;

    public ScamAnalysisService(MlServiceClient mlClient) {
        this.mlClient = mlClient;
    }

    public ScamAnalysisRes analyzeMessage(String message) {
        if (message == null || message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message cannot be empty");
        }
        return toResponse(mlClient.analyzeText(message));
    }

    public ScamAnalysisRes analyzeImage(MultipartFile image) {
        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Please upload an image");
        }
        return toResponse(mlClient.analyzeImage(image));
    }

    private ScamAnalysisRes toResponse(MlResponse ml) {
        if (ml == null) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Empty response from ML service");
        }

        List<ScamSignal> signals = ml.reasons() == null ? List.of() : ml.reasons().stream()
                .map(r -> {
                    String[] info = SIGNAL_INFO.getOrDefault(r, new String[]{"MEDIUM", r});
                    return new ScamSignal(r, info[0], info[1]);
                })
                .toList();

        String explanation = ml.isScam()
                ? "Our model rates this message " + ml.riskScore() + "% likely to be a scam."
                : "Our model rates this message only " + ml.riskScore() + "% likely to be a scam.";
        if (ml.ocrText() != null && !ml.ocrText().isBlank()) {
            explanation += " Text read from the image: \"" + ml.ocrText().strip() + "\"";
        }

        // advice from Python is a few sentences; split into a list for the UI
        List<String> recommendations = ml.advice() == null ? List.of()
                : Arrays.stream(ml.advice().split("(?<=\\.)\\s+"))
                .map(String::strip)
                .filter(s -> !s.isEmpty())
                .toList();

        return new ScamAnalysisRes(
                ml.riskScore(),
                riskLevel(ml.riskScore()),
                ml.verdict(),
                explanation,
                signals,
                recommendations
        );
    }

    private String riskLevel(int score) {
        if (score >= HIGH_THRESHOLD) return "HIGH";
        if (score >= MEDIUM_THRESHOLD) return "MEDIUM";
        return "LOW";
    }

    // Unchanged from your version
    public List<Map<String, String>> getExamples() {
        return List.of(
                Map.of("category", "Bank SMS",
                        "message", "Your bank account will be blocked today. Verify your details immediately."),
                Map.of("category", "Lottery/Prize",
                        "message", "Congratulations! You have won a prize. Pay a processing fee to claim it."),
                Map.of("category", "KYC Update",
                        "message", "Your KYC has expired. Update your details or your account will be suspended."),
                Map.of("category", "Job Offer",
                        "message", "You have been selected for a job. Pay a registration fee to receive your offer letter.")
        );
    }
}
