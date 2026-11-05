package com.app.sgelasmart.api.task.dto;

import com.app.sgelasmart.common.TaskLifecycleState;
import com.app.sgelasmart.common.TaskType;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import jakarta.validation.constraints.Max;


public class TaskRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private TaskType taskType;

    private String contentPayload;

    private LocalDate dueDate;

    private Integer estimatedDurationMinutes;

    private TaskLifecycleState lifecycleState;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public TaskType getTaskType() {
        return taskType;
    }

    public void setTaskType(TaskType taskType) {
        this.taskType = taskType;
    }

    public String getContentPayload() {
        return contentPayload;
    }

    public void setContentPayload(String contentPayload) {
        this.contentPayload = contentPayload;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public Integer getEstimatedDurationMinutes() {
        return estimatedDurationMinutes;
    }

    public void setEstimatedDurationMinutes(Integer estimatedDurationMinutes) {
        this.estimatedDurationMinutes = estimatedDurationMinutes;
    }

    public TaskLifecycleState getLifecycleState() {
        return lifecycleState;
    }

    public void setLifecycleState(TaskLifecycleState lifecycleState) {
        this.lifecycleState = lifecycleState;
    }
}
