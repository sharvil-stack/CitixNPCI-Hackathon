package com.citi_hack.demo.dto;
import java.util.List;
public class ScamAnalysisRes {

    private int riskScore;
    private String riskLevel;
    private String verdict;
    private String explanation;
    private List<ScamSignal> detectedSignals;
    private List<String> recommendations;

    public ScamAnalysisRes() {
    }

    public ScamAnalysisRes(
            int riskScore,
            String riskLevel,
            String verdict,
            String explanation,
            List<ScamSignal> detectedSignals,
            List<String> recommendations) {

        this.riskScore = riskScore;
        this.riskLevel = riskLevel;
        this.verdict = verdict;
        this.explanation = explanation;
        this.detectedSignals = detectedSignals;
        this.recommendations = recommendations;
    }

    public int getRiskScore() {
        return riskScore;
    }

    public void setRiskScore(int riskScore) {
        this.riskScore = riskScore;
    }

    public String getRiskLevel() {
        return riskLevel;
    }

    public void setRiskLevel(String riskLevel) {
        this.riskLevel = riskLevel;
    }

    public String getVerdict() {
        return verdict;
    }

    public void setVerdict(String verdict) {
        this.verdict = verdict;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }

    public List<ScamSignal> getDetectedSignals() {
        return detectedSignals;
    }

    public void setDetectedSignals(List<ScamSignal> detectedSignals) {
        this.detectedSignals = detectedSignals;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }
}