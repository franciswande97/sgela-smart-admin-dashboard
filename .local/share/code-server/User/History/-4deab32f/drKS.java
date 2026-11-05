package com.app.sgelasmart.api.calendar;

import com.app.sgelasmart.api.ai.StudyIntelligenceEngine;
import com.app.sgelasmart.api.auth.UserRepository;
import com.app.sgelasmart.api.calendar.dto.CalendarEventRequest;
import com.app.sgelasmart.api.calendar.dto.CalendarEventResponse;
import com.app.sgelasmart.api.goal.dto.TimetableSlotDto;
import com.app.sgelasmart.common.EventSource;
import com.app.sgelasmart.model.CalendarEvent;
import com.app.sgelasmart.model.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CalendarEventService {

    private final CalendarEventRepository calendarEventRepository;
    private final UserRepository userRepository;
    private final StudyIntelligenceEngine intelligenceEngine;

    public CalendarEventService(CalendarEventRepository calendarEventRepository,
                                UserRepository userRepository,
                                StudyIntelligenceEngine intelligenceEngine) {
        this.calendarEventRepository = calendarEventRepository;
        this.userRepository = userRepository;
        this.intelligenceEngine = intelligenceEngine;
    }

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getEventsByUserId(Long userId, String authenticatedEmail) {
        verifyUserAccess(userId, authenticatedEmail);
        return calendarEventRepository.findByUserId(userId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CalendarEventResponse createEvent(Long userId, CalendarEventRequest request, String authenticatedEmail) {
        verifyUserAccess(userId, authenticatedEmail);
        validateEventTimes(request);

        CalendarEvent event = new CalendarEvent(
                userId,
                request.getTitle(),
                request.getDayOfWeek(),
                request.getEventDate(),
                request.getStartTime(),
                request.getEndTime(),
                request.getSource() != null ? request.getSource() : EventSource.MANUAL,
                request.getIsRecurring() != null ? request.getIsRecurring() : true
        );

        CalendarEvent saved = calendarEventRepository.save(event);
        return mapToResponse(saved);
    }

    @Transactional
    public List<CalendarEventResponse> uploadAndParseTimetable(Long userId, MultipartFile file, String authenticatedEmail) {
        verifyUserAccess(userId, authenticatedEmail);

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Timetable file cannot be empty");
        }

        String contentType = file.getContentType() != null ? file.getContentType() : "image/jpeg";
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Failed to read timetable file", e);
        }

        List<TimetableSlotDto> extractedSlots = intelligenceEngine.parseTimetable(bytes, contentType);

        calendarEventRepository.deleteByUserIdAndSource(userId, EventSource.OCR);

        List<CalendarEvent> newEvents = new ArrayList<>();
        for (TimetableSlotDto slot : extractedSlots) {
            DayOfWeek day = parseDayOfWeek(slot.getDayOfWeek());
            LocalTime start = parseLocalTime(slot.getStartTime(), LocalTime.of(9, 0));
            LocalTime end = parseLocalTime(slot.getEndTime(), start.plusHours(2));

            newEvents.add(new CalendarEvent(
                    userId,
                    slot.getTitle(),
                    day,
                    null,
                    start,
                    end,
                    EventSource.OCR,
                    true
            ));
        }

        List<CalendarEvent> saved = calendarEventRepository.saveAll(newEvents);
        return saved.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public List<CalendarEventResponse> parseTimetableOcr(Long userId, String rawOcrText, String authenticatedEmail) {
        verifyUserAccess(userId, authenticatedEmail);

        calendarEventRepository.deleteByUserIdAndSource(userId, EventSource.OCR);

        CalendarEvent fallbackEvent = new CalendarEvent(
                userId,
                "Sample Class from Timetable",
                DayOfWeek.MONDAY,
                null,
                LocalTime.of(9, 0),
                LocalTime.of(11, 0),
                EventSource.OCR,
                true
        );

        CalendarEvent saved = calendarEventRepository.save(fallbackEvent);
        return List.of(mapToResponse(saved));
    }

    private void verifyUserAccess(Long userId, String authenticatedEmail) {
        User user = userRepository.findByEmail(authenticatedEmail)
                .orElseThrow(() -> new AccessDeniedException("User not authenticated"));
        if (!user.getId().equals(userId)) {
            throw new AccessDeniedException("Forbidden: User mismatch");
        }
    }

    private DayOfWeek parseDayOfWeek(String dayStr) {
        if (dayStr == null) return DayOfWeek.MONDAY;
        try {
            return DayOfWeek.valueOf(dayStr.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return DayOfWeek.MONDAY;
        }
    }

    private LocalTime parseLocalTime(String timeStr, LocalTime fallback) {
        if (timeStr == null || timeStr.isBlank()) return fallback;
        try {
            String clean = timeStr.trim();
            if (clean.length() == 4 && clean.indexOf(':') == 1) {
                clean = "0" + clean;
            }
            return LocalTime.parse(clean);
        } catch (Exception e) {
            return fallback;
        }
    }

    private CalendarEventResponse mapToResponse(CalendarEvent event) {
        return new CalendarEventResponse(
                event.getId(),
                event.getUserId(),
                event.getTitle(),
                event.getDayOfWeek(),
                event.getEventDate(),
                event.getStartTime(),
                event.getEndTime(),
                event.getSource(),
                event.getIsRecurring()
        );
    }
}