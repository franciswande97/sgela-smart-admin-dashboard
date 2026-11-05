package com.app.sgelasmart.api.task.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record QuizSubmissionRequest(
        @NotNull(message = "Answers are required")
        @Size(min = 1, max = 50, message = "Between 1 and 50 answers are expected")
        List<@Valid AnswerItem> answers
) {
    public record AnswerItem(
            @Min(value = 0, message = "questionIndex must be 0 or more")
            int questionIndex,

            // -1 means "left unanswered", which the grading code already understands
            @Min(value = -1, message = "selectedOptionIndex must be -1 (unanswered) or more")
            int selectedOptionIndex
    ) {}
}