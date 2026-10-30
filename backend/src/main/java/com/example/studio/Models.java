package com.example.studio;

import java.time.LocalDateTime;
import java.util.List;

public final class Models {
    private Models() {}
    public enum Status { QUEUED, RUNNING, SUCCEEDED, FAILED }
    public enum Stage { WAITING, CHECK, GENERATE, FINALIZE, DONE }
    public record Template(String id, String title, String category, String description,
                           String coverUrl, int requiredImageCount, long maxFileSizeBytes) {
        public List<String> acceptedMimeTypes() { return List.of("image/jpeg", "image/png"); }
        @com.fasterxml.jackson.annotation.JsonProperty("acceptedMimeTypes")
        public List<String> getAcceptedMimeTypes() { return acceptedMimeTypes(); }
    }
    public record Asset(String id, String ownerId, String url, long sizeBytes, String mimeType,
                        LocalDateTime createdAt) {}
    public record Task(String id, String ownerId, String templateId, String templateTitle,
                       Status status, Stage stage, String resultUrl, String error,
                       Stage failStage, int delayMs, LocalDateTime createdAt, LocalDateTime updatedAt) {}
    public record CreateTask(String templateId, List<String> assetIds, Stage failStage, Integer delayMs) {}
}
