package com.app.sgelasmart.api.focussession;

import com.app.sgelasmart.api.auth.UserRepository;
import com.app.sgelasmart.api.focussession.dto.FocusSessionRequest;
import com.app.sgelasmart.api.focussession.dto.FocusSessionResponse;
import com.app.sgelasmart.api.goal.GoalRepository;
import com.app.sgelasmart.api.task.TaskRepository;
import com.app.sgelasmart.common.TaskLifecycleState;
import com.app.sgelasmart.model.FocusSession;
import com.app.sgelasmart.model.Goal;
import com.app.sgelasmart.model.Task;
import com.app.sgelasmart.model.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class FocusSessionService {

    private final FocusSessionRepository focusSessionRepository;
    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final TaskRepository taskRepository;

    public FocusSessionService(FocusSessionRepository focusSessionRepository,
                               UserRepository userRepository,
                               GoalRepository goalRepository,
                               TaskRepository taskRepository) {
        this.focusSessionRepository = focusSessionRepository;
        this.userRepository = userRepository;
        this.goalRepository = goalRepository;
        this.taskRepository = taskRepository;
    }

    public List<FocusSessionResponse> getFocusSessionsByUserId(Long targetUserId, String authenticatedEmail) {
        verifyUserOwnership(targetUserId, authenticatedEmail);

        return focusSessionRepository.findByUserId(targetUserId)
                .stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public FocusSessionResponse createFocusSession(Long targetUserId, FocusSessionRequest requestDto, String authenticatedEmail) {
        User user = verifyUserOwnership(targetUserId, authenticatedEmail);

        // Optional Goal Ownership Verification
        if (requestDto.getGoalId() != null) {
            Goal goal = goalRepository.findById(requestDto.getGoalId())
                    .orElseThrow(() -> new NoSuchElementException("Goal not found with id: " + requestDto.getGoalId()));
            if (!goal.getUserId().equals(user.getId())) {
                throw new AccessDeniedException("Forbidden: You do not own this goal");
            }
        }

        // Optional Task Ownership Verification & Auto-completion Hook
    if (requestDto.getTaskId() != null) {
        Task task = taskRepository.findById(requestDto.getTaskId())
                .orElseThrow(() -> new NoSuchElementException("Task not found with id: " + requestDto.getTaskId()));
        if (!task.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Forbidden: You do not own this task");
        }
        // If both ids are sent they must agree, otherwise the session would be logged against a goal
        // the task does not belong to.
        if (requestDto.getGoalId() != null && !requestDto.getGoalId().equals(task.getGoalId())) {
            throw new IllegalArgumentException("The task does not belong to the given goal");
        }
        // Auto-complete the linked focus task
        task.setLifecycleState(TaskLifecycleState.COMPLETED);
        taskRepository.save(task);
    }

        FocusSession session = new FocusSession(
                user.getId(),
                requestDto.getGoalId(),
                requestDto.getTaskId(),
                requestDto.getDurationSeconds(),
                requestDto.getCompletedIntervals()
        );

        FocusSession savedSession = focusSessionRepository.save(session);
        return mapToResponseDto(savedSession);
    }

    private User verifyUserOwnership(Long targetUserId, String authenticatedEmail) {
        User user = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new AccessDeniedException("User not found or unauthenticated"));

        if (!user.getId().equals(targetUserId)) {
            throw new AccessDeniedException("Forbidden: You cannot access or log focus sessions for another user");
        }
        return user;
    }

    private FocusSessionResponse mapToResponseDto(FocusSession session) {
        return new FocusSessionResponse(
                session.getId(),
                session.getUserId(),
                session.getGoalId(),
                session.getTaskId(),
                session.getDurationSeconds(),
                session.getCompletedIntervals(),
                session.getSessionDate()
        );
    }
}
