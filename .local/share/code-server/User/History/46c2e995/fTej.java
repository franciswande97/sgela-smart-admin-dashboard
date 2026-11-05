package com.app.sgelasmart.api.goal.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@NotBlank(message = "Title is required")
@Size(max = 255, message = "Title must be at most 255 characters")
private String title;

@NotNull(message = "Deadline is required")
@FutureOrPresent(message = "Deadline cannot be in the past")
private LocalDate deadline;

public class GoalRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must be at most 255 characters")
    private String title;

    @NotNull(message = "Deadline is required")
    @FutureOrPresent(message = "Deadline cannot be in the past")
    private LocalDate deadline;

    @NotBlank(message = "Title is required")
    private String title;

    @FutureOrPresent(message = "Deadline cannot be in the past")
    private LocalDate deadline;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate deadline) {
        this.deadline = deadline;
    }
}
