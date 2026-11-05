package com.app.sgelasmart.api.task;

import com.app.sgelasmart.api.ai.StudyIntelligenceEngine;
import com.app.sgelasmart.api.auth.UserRepository;
import com.app.sgelasmart.api.goal.GoalMaterialRepository;
import com.app.sgelasmart.api.goal.GoalRepository;
import com.app.sgelasmart.api.goal.dto.GeminiExamContentResponse;
import com.app.sgelasmart.api.goal.dto.QuizQuestionDto;
import com.app.sgelasmart.api.schedule.TimetableVoidService;
import com.app.sgelasmart.api.settings.UserSettingsRepository;
import com.app.sgelasmart.model.UserSettings;
import com.app.sgelasmart.api.schedule.dto.TimeSlot;
import com.app.sgelasmart.api.task.dto.*;
import com.app.sgelasmart.common.TaskLifecycleState;
import com.app.sgelasmart.common.TaskType;
import com.app.sgelasmart.model.Goal;
import com.app.sgelasmart.model.GoalMaterial;
import com.app.sgelasmart.model.Task;
import com.app.sgelasmart.model.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final GoalMaterialRepository goalMaterialRepository;
    private final StudyIntelligenceEngine intelligenceEngine;
    private final TimetableVoidService timetableVoidService;
    private final UserSettingsRepository userSettingsRepository;
    private final ObjectMapper objectMapper;

    public TaskService(TaskRepository taskRepository,
                       GoalRepository goalRepository,
                       UserRepository userRepository,
                       GoalMaterialRepository goalMaterialRepository,
                       StudyIntelligenceEngine intelligenceEngine,
                       TimetableVoidService timetableVoidService,
                       UserSettingsRepository userSettingsRepository,
                       ObjectMapper objectMapper) {
        this.taskRepository = taskRepository;
        this.goalRepository = goalRepository;
        this.userRepository = userRepository;
        this.goalMaterialRepository = goalMaterialRepository;
        this.intelligenceEngine = intelligenceEngine;
        this.timetableVoidService = timetableVoidService;
        this.userSettingsRepository = userSettingsRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public TaskResponse startTask(Long taskId, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Task task = getTaskAndVerifyOwnership(taskId, user.getId());

        if (task.getLifecycleState() == TaskLifecycleState.COMPLETED) {
            throw new IllegalStateException("Task is already completed");
        }

        LocalDateTime now = LocalDateTime.now();
        int duration = task.getEstimatedDurationMinutes() != null ? task.getEstimatedDurationMinutes() : 45;

        task.setLifecycleState(TaskLifecycleState.IN_PROGRESS);
        task.setStartedAt(now);
        task.setExpiresAt(now.plusMinutes(duration));

        Task saved = taskRepository.save(task);
        return mapToResponseDto(saved);
    }

    @Transactional
    public TaskResponse completeTask(Long taskId, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Task task = getTaskAndVerifyOwnership(taskId, user.getId());

        task.setLifecycleState(TaskLifecycleState.COMPLETED);
        Task saved = taskRepository.save(task);
        return mapToResponseDto(saved);
    }

    @Transactional
    public TaskResponse toggleObjective(Long taskId, int objectiveId, boolean completed, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Task task = getTaskAndVerifyOwnership(taskId, user.getId());

        String payload = task.getContentPayload();
        if (payload != null && !payload.isBlank()) {
            try {
                JsonNode root = objectMapper.readTree(payload);
                JsonNode objectivesNode = root.get("objectives");
                if (objectivesNode != null && objectivesNode.isArray()) {
                    ArrayNode arr = (ArrayNode) objectivesNode;
                    for (JsonNode item : arr) {
                        if (item.has("id") && item.get("id").asInt() == objectiveId) {
                            ((ObjectNode) item).put("completed", completed);
                            break;
                        }
                    }
                    task.setContentPayload(objectMapper.writeValueAsString(root));
                }
            } catch (Exception e) {
                throw new IllegalStateException("Failed to update objective in content payload", e);
            }
        }

        Task saved = taskRepository.save(task);
        return mapToResponseDto(saved);
    }

    @Transactional
    public TaskResponse checkAndRescheduleIfExpired(Long taskId, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Task task = getTaskAndVerifyOwnership(taskId, user.getId());

        if (task.getLifecycleState() != TaskLifecycleState.IN_PROGRESS || task.getExpiresAt() == null) {
            return mapToResponseDto(task);
        }

        LocalDateTime now = LocalDateTime.now();
        if (!now.isAfter(task.getExpiresAt())) {
            return mapToResponseDto(task);
        }

        // Check if all objectives are completed
        boolean allCompleted = areAllObjectivesCompleted(task.getContentPayload());
        if (allCompleted) {
            task.setLifecycleState(TaskLifecycleState.COMPLETED);
            return mapToResponseDto(taskRepository.save(task));
        }

        // Reschedule: Revert to TODO and find next available void
        task.setLifecycleState(TaskLifecycleState.TODO);
        task.setStartedAt(null);
        task.setExpiresAt(null);

        Goal goal = goalRepository.findById(task.getGoalId()).orElse(null);
        LocalDate deadline = (goal != null && goal.getDeadline() != null) ? goal.getDeadline() : LocalDate.now().plusDays(14);
        int duration = task.getEstimatedDurationMinutes() != null ? task.getEstimatedDurationMinutes() : 45;

        List<TimeSlot> freeVoids = timetableVoidService.findFreeVoids(user.getId(), LocalDate.now(), deadline);
        for (TimeSlot slot : freeVoids) {
            if (slot.durationMinutes() >= duration) {
                LocalTime scheduledEnd = slot.startTime().plusMinutes(duration);
                if (!scheduledEnd.isAfter(slot.endTime())) {
                    task.setScheduledDate(slot.date());
                    task.setStartTime(slot.startTime());
                    task.setEndTime(scheduledEnd);
                    break;
                }
            }
        }

        Task saved = taskRepository.save(task);
        return mapToResponseDto(saved);
    }

    @Transactional
    public TaskResponse regenerateQuizTask(Long taskId, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Task task = getTaskAndVerifyOwnership(taskId, user.getId());

        if (task.getTaskType() != TaskType.QUIZ) {
            throw new IllegalArgumentException("Task is not of type QUIZ");
        }

        Goal goal = goalRepository.findById(task.getGoalId())
                .orElseThrow(() -> new NoSuchElementException("Goal not found with id: " + task.getGoalId()));

        List<GoalMaterial> materials = goalMaterialRepository.findByGoalIdOrderByCreatedAtDesc(goal.getId());
        String corpus = materials.stream()
                .filter(m -> m.getExtractedContent() != null && !m.getExtractedContent().isBlank())
                .map(GoalMaterial::getExtractedContent)
                .collect(Collectors.joining("\n\n"));

        List<String> topics = List.of(goal.getTitle());
        GeminiExamContentResponse response = intelligenceEngine.generateExamContent(topics, corpus);

        try {
            task.setContentPayload(objectMapper.writeValueAsString(response.getQuizQuestions()));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize regenerated quiz payload", e);
        }

        task.setLifecycleState(TaskLifecycleState.TODO);
        task.setStartedAt(null);
        task.setExpiresAt(null);

        Task saved = taskRepository.save(task);
        return mapToResponseDto(saved);
    }

    public List<SanitizedQuizQuestionResponse> getSanitizedQuiz(Long taskId, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Task task = getTaskAndVerifyOwnership(taskId, user.getId());

        if (task.getTaskType() != TaskType.QUIZ) {
            throw new IllegalArgumentException("Task with id " + taskId + " is not of type QUIZ");
        }

        List<QuizQuestionDto> questions = parseQuizPayload(task.getContentPayload());
        List<SanitizedQuizQuestionResponse> sanitized = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            QuizQuestionDto q = questions.get(i);
            sanitized.add(new SanitizedQuizQuestionResponse(i, q.getQuestion(), q.getOptions()));
        }
        return sanitized;
    }

    @Transactional
    public QuizSubmissionResponse submitQuiz(Long taskId, QuizSubmissionRequest submissionRequest, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Task task = getTaskAndVerifyOwnership(taskId, user.getId());

        if (task.getTaskType() != TaskType.QUIZ) {
            throw new IllegalArgumentException("Task with id " + taskId + " is not of type QUIZ");
        }

        List<QuizQuestionDto> questions = parseQuizPayload(task.getContentPayload());
        if (questions.isEmpty()) {
            throw new IllegalStateException("Quiz content payload is empty or malformed");
        }

        java.util.Map<Integer, Integer> answersMap = new java.util.HashMap<>();
        if (submissionRequest.answers() != null) {
            for (QuizSubmissionRequest.AnswerItem item : submissionRequest.answers()) {
                // The DTO only checks the numbers are in a sane range; here we check them against THIS quiz.
                if (item.questionIndex() >= questions.size()) {
                    throw new IllegalArgumentException("Question " + item.questionIndex() + " does not exist in this quiz");
                }
                if (answersMap.containsKey(item.questionIndex())) {
                    throw new IllegalArgumentException("Question " + item.questionIndex() + " was answered more than once");
                }
                List<String> options = questions.get(item.questionIndex()).getOptions();
                int optionCount = options == null ? 0 : options.size();
                if (item.selectedOptionIndex() >= optionCount) {
                    throw new IllegalArgumentException("Option " + item.selectedOptionIndex()
                            + " does not exist for question " + item.questionIndex());
                }
                answersMap.put(item.questionIndex(), item.selectedOptionIndex());
            }
        }

        int score = 0;
        List<QuizSubmissionResponse.QuestionReviewItem> reviewItems = new ArrayList<>();

        for (int i = 0; i < questions.size(); i++) {
            QuizQuestionDto q = questions.get(i);
            int selected = answersMap.getOrDefault(i, -1);
            boolean isCorrect = (selected == q.getCorrectAnswerIndex());

            if (isCorrect) {
                score++;
            }

            reviewItems.add(new QuizSubmissionResponse.QuestionReviewItem(
                    i,
                    q.getQuestion(),
                    q.getOptions(),
                    selected,
                    q.getCorrectAnswerIndex(),
                    isCorrect,
                    q.getExplanation()
            ));
        }

        int totalQuestions = questions.size();
        double percentage = ((double) score / totalQuestions) * 100.0;
        double passingThreshold = userSettingsRepository.findByUserId(user.getId())
                .map(UserSettings::getQuizPassingScorePercentage)
                .orElse(60.0);
        boolean passed = percentage >= passingThreshold;

        if (passed) {
            task.setLifecycleState(TaskLifecycleState.COMPLETED);
        } else {
            task.setLifecycleState(TaskLifecycleState.IN_PROGRESS);
        }
        taskRepository.save(task);

        return new QuizSubmissionResponse(
                task.getId(),
                score,
                totalQuestions,
                percentage,
                passed,
                task.getLifecycleState(),
                reviewItems
        );
    }

    public List<TaskResponse> getTasksByUserId(Long targetUserId, String authenticatedEmail) {
        verifyUserOwnership(targetUserId, authenticatedEmail);
        return taskRepository.findByUserId(targetUserId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByGoalId(Long goalId, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new NoSuchElementException("Goal not found with id: " + goalId));

        if (!goal.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Forbidden: You do not own this goal");
        }

        return taskRepository.findByGoalId(goalId).stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    public TaskResponse createTask(Long goalId, TaskRequest requestDto, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new NoSuchElementException("Goal not found with id: " + goalId));

        if (!goal.getUserId().equals(user.getId())) {
            throw new AccessDeniedException("Forbidden: You do not own this goal");
        }

        Task task = new Task();
        task.setGoalId(goalId);
        task.setUserId(user.getId());
        task.setTitle(requestDto.getTitle());
        task.setDescription(requestDto.getDescription());
        task.setTaskType(requestDto.getTaskType() != null ? requestDto.getTaskType() : TaskType.CHECKLIST);
        task.setContentPayload(requestDto.getContentPayload());
        task.setDueDate(requestDto.getDueDate());
        task.setEstimatedDurationMinutes(requestDto.getEstimatedDurationMinutes());
        task.setLifecycleState(requestDto.getLifecycleState() != null ? requestDto.getLifecycleState() : TaskLifecycleState.TODO);

        Task savedTask = taskRepository.save(task);
        return mapToResponseDto(savedTask);
    }

    public TaskResponse updateTask(Long taskId, TaskRequest requestDto, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Task task = getTaskAndVerifyOwnership(taskId, user.getId());

        task.setTitle(requestDto.getTitle());
        task.setDescription(requestDto.getDescription());
        if (requestDto.getTaskType() != null) task.setTaskType(requestDto.getTaskType());
        if (requestDto.getContentPayload() != null) task.setContentPayload(requestDto.getContentPayload());
        if (requestDto.getLifecycleState() != null) task.setLifecycleState(requestDto.getLifecycleState());
        task.setDueDate(requestDto.getDueDate());
        task.setEstimatedDurationMinutes(requestDto.getEstimatedDurationMinutes());

        Task updatedTask = taskRepository.save(task);
        return mapToResponseDto(updatedTask);
    }

    public void deleteTask(Long taskId, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        Task task = getTaskAndVerifyOwnership(taskId, user.getId());
        taskRepository.delete(task);
    }

    private boolean areAllObjectivesCompleted(String payload) {
        if (payload == null || payload.isBlank()) return false;
        try {
            JsonNode root = objectMapper.readTree(payload);
            JsonNode objectives = root.get("objectives");
            if (objectives == null || !objectives.isArray() || objectives.isEmpty()) return true;
            for (JsonNode item : objectives) {
                if (!item.has("completed") || !item.get("completed").asBoolean()) {
                    return false;
                }
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private List<QuizQuestionDto> parseQuizPayload(String payloadJson) {
        if (payloadJson == null || payloadJson.isBlank() || "null".equalsIgnoreCase(payloadJson.trim())) {
            return List.of();
        }
        try {
            List<QuizQuestionDto> parsed = objectMapper.readValue(payloadJson, new TypeReference<List<QuizQuestionDto>>() {});
            return parsed != null ? parsed : List.of();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse quiz content payload", e);
        }
    }

    private Task getTaskAndVerifyOwnership(Long taskId, Long userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new NoSuchElementException("Task not found with id: " + taskId));
        if (!task.getUserId().equals(userId)) {
            throw new AccessDeniedException("Forbidden: You do not own this task");
        }
        return task;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("User not found or unauthenticated"));
    }

    private void verifyUserOwnership(Long targetUserId, String authenticatedEmail) {
        User user = getUserByEmail(authenticatedEmail);
        if (!user.getId().equals(targetUserId)) {
            throw new AccessDeniedException("Forbidden: You cannot access tasks for another user");
        }
    }

    private TaskResponse mapToResponseDto(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getGoalId(),
                task.getUserId(),
                task.getTitle(),
                task.getDescription(),
                task.getLifecycleState(),
                task.getTaskType(),
                task.getContentPayload(),
                task.getDueDate(),
                task.getEstimatedDurationMinutes(),
                task.getCreatedAt(),
                task.getScheduledDate(),
                task.getStartTime(),
                task.getEndTime(),
                task.getStartedAt(),
                task.getExpiresAt()
        );
    }
}
