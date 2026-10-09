package com.citi_hack.demo.controller;

import jakarta.validation.Valid;
import com.citi_hack.demo.dto.ScamAnalysisReq;
import com.citi_hack.demo.dto.ScamAnalysisRes;
import com.citi_hack.demo.service.ScamAnalysisService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scams")
public class ScamController {

    private final ScamAnalysisService scamAnalysisService;

    public ScamController(ScamAnalysisService scamAnalysisService) {
        this.scamAnalysisService = scamAnalysisService;
    }


    @PostMapping("/analyze")
    public ScamAnalysisRes analyzeMessage(
            @Valid @RequestBody ScamAnalysisReq request) {

        return scamAnalysisService.analyzeMessage(request.getMessage());
    }


    @PostMapping(
            value = "/analyze-image",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ScamAnalysisRes analyzeImage(
            @RequestParam("image") MultipartFile image) {
        return scamAnalysisService.analyzeImage(image);
    }

    @GetMapping("/examples")
    public List<Map<String, String>> getExamples() {
        return scamAnalysisService.getExamples();
    }
}
