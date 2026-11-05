package com.app.sgelasmart.api.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class TimetableOcrRequest {

    @NotBlank(message = "OCR raw text is required")
    @Size(max = 50000, message = "OCR text must be at most 50,000 characters")
    private String ocrRawText;
    public TimetableOcrRequest() {}

    public TimetableOcrRequest(String ocrRawText) {
        this.ocrRawText = ocrRawText;
    }

    public String getOcrRawText() {
        return ocrRawText;
    }

    public void setOcrRawText(String ocrRawText) {
        this.ocrRawText = ocrRawText;
    }
}
