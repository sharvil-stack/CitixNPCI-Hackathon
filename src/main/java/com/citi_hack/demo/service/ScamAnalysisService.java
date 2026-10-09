package com.citi_hack.demo.service;

import com.citi_hack.demo.dto.ScamAnalysisRes;
import com.citi_hack.demo.dto.ScamSignal;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Service
public class ScamAnalysisService {

    public ScamAnalysisRes analyzeMessage(String message) {

        if (message == null || message.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Message cannot be empty"
            );
        }

        return new ScamAnalysisRes(
                91,
                "HIGH",
                "Likely Scam",
                "This is a mock response. ML analysis will be integrated later.",
                List.of(
                        new ScamSignal(
                                "Urgent language",
                                "HIGH",
                                "The message pressures the recipient to act quickly."
                        ),
                        new ScamSignal(
                                "Account threat",
                                "HIGH",
                                "The message threatens account suspension."
                        )
                ),
                List.of(
                        "Do not click suspicious links.",
                        "Never share OTPs or PINs.",
                        "Contact your bank using its official helpline."
                )
        );
    }

    public ScamAnalysisRes analyzeImage(MultipartFile image) {

        if (image == null || image.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Please upload an image"
            );
        }

        // Temporary mock response.
        // OCR and image-based scam detection will be integrated later.
        return new ScamAnalysisRes(
                85,
                "HIGH",
                "Potential Scam",
                "This is a mock image-analysis response. "
                        + "OCR and ML analysis will be integrated later.",
                List.of(
                        new ScamSignal(
                                "Image requires verification",
                                "HIGH",
                                "The uploaded image has not yet been analyzed "
                                        + "by the scam detection model."
                        )
                ),
                List.of(
                        "Verify the sender before trusting the image.",
                        "Do not scan suspicious QR codes or open unknown links.",
                        "Never share OTPs, PINs, or banking credentials."
                )
        );
    }

    public List<Map<String, String>> getExamples() {

        return List.of(
                Map.of(
                        "category", "Bank SMS",
                        "message",
                        "Your bank account will be blocked today. Verify your details immediately."
                ),
                Map.of(
                        "category", "Lottery/Prize",
                        "message",
                        "Congratulations! You have won a prize. Pay a processing fee to claim it."
                ),
                Map.of(
                        "category", "KYC Update",
                        "message",
                        "Your KYC has expired. Update your details or your account will be suspended."
                ),
                Map.of(
                        "category", "Job Offer",
                        "message",
                        "You have been selected for a job. Pay a registration fee to receive your offer letter."
                )
        );
    }
}
