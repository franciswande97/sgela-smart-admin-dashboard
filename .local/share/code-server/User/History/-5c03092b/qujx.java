package com.app.sgelasmart.api.focussession.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Max;

public class FocusSessionRequest {

    private Long goalId;

    private Long taskId;

    @NotNull(message = "duration_seconds is required")
    @Min(value = 1, message = "duration_seconds must be at least 1")
    @Max(value = 86400, message = "duration_seconds cannot exceed 86400 (24 hours)")
    private Integer durationSeconds;

    @NotNull(message = "completed_intervals is required")
    @Min(value = 0, message = "completed_intervals must be a non-negative integer")
    @Max(value = 500, message = "completed_intervals cannot exceed 500")
    private Integer completedIntervals;

    public Long getGoalId() {
        return goalId;
    }

    public void setGoalId(Long goalId) {
        this.goalId = goalId;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public void setDurationSeconds(Integer durationSeconds) {
        this.durationSeconds = durationSeconds;
    }

    public Integer getCompletedIntervals() {
        return completedIntervals;
    }

    public void setCompletedIntervals(Integer completedIntervals) {
        this.completedIntervals = completedIntervals;
    }
}
