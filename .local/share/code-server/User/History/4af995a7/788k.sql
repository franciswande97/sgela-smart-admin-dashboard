INSERT INTO users (email, password, name) 
VALUES 
    ('rinavho@sgelasmart.com', '$2a$10$F.XiSixk4SCd5XzMfKj7nuXtxRKmz8bXbIqbqjtJkbZ2sEaC1EC1W', 'Rinavho'),
    ('student2@sgelasmart.com', '$2a$10$F.XiSixk4SCd5XzMfKj7nuXtxRKmz8bXbIqbqjtJkbZ2sEaC1EC1W', 'Thabo')
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password;

-- Seed Goals for Rinavho
INSERT INTO goals (user_id, title, deadline, status, created_at)
SELECT u.id, 'Complete Spring Boot Security Module', CURRENT_DATE + INTERVAL '7 days', 'IN_PROGRESS', NOW()
FROM users u WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM goals g WHERE g.user_id = u.id AND g.title = 'Complete Spring Boot Security Module'
);

INSERT INTO goals (user_id, title, deadline, status, created_at)
SELECT u.id, 'Implement Swagger Documentation', CURRENT_DATE + INTERVAL '2 days', 'COMPLETED', NOW()
FROM users u WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM goals g WHERE g.user_id = u.id AND g.title = 'Implement Swagger Documentation'
);

-- Seed Goals for Student 2 (Thabo)
INSERT INTO goals (user_id, title, deadline, status, created_at)
SELECT u.id, 'Study Discrete Mathematics Chapter 4', CURRENT_DATE + INTERVAL '14 days', 'NOT_STARTED', NOW()
FROM users u WHERE u.email = 'student2@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM goals g WHERE g.user_id = u.id AND g.title = 'Study Discrete Mathematics Chapter 4'
);

-- ============================================================================
-- Seed 3x3 Task Matrix (FOCUS_SESSION, QUIZ, EXTERNAL_PROMPT x TODO, IN_PROGRESS, COMPLETED)
-- ============================================================================

-- 1. FOCUS_SESSION Tasks
-- 1.1 FOCUS_SESSION (TODO)
INSERT INTO tasks (
    goal_id, user_id, title, description, lifecycle_state, task_type, goal_stage, priority,
    content_payload, scheduled_date, start_time, end_time, due_date, estimated_duration_minutes,
    started_at, expires_at, created_at
)
SELECT 
    g.id, u.id,
    'Focus Session: Architecture & Filter Chain Setup',
    'Configure DelegatingFilterProxy, SecurityFilterChain, and declare auth endpoints.',
    'TODO', 'FOCUS_SESSION', 'CUSTOM', 'MEDIUM',
    '{"targetDurationMinutes":90,"intervalMinutes":45,"breakMinutes":10,"objectives":[{"id":1,"text":"Configure SecurityFilterChain bean","completed":false},{"id":2,"text":"Declare public and secured route matchers","completed":false},{"id":3,"text":"Attach JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter","completed":false},{"id":4,"text":"Validate CORS and CSRF configurations","completed":false}]}',
    CURRENT_DATE + INTERVAL '1 day', '09:00:00', '10:30:00', CURRENT_DATE + INTERVAL '3 days', 90,
    NULL, NULL, NOW()
FROM users u
JOIN goals g ON g.user_id = u.id AND g.title = 'Complete Spring Boot Security Module'
WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.goal_id = g.id AND t.title = 'Focus Session: Architecture & Filter Chain Setup'
);

-- 1.2 FOCUS_SESSION (IN_PROGRESS - Partial Progress & Active Timers)
INSERT INTO tasks (
    goal_id, user_id, title, description, lifecycle_state, task_type, goal_stage, priority,
    content_payload, scheduled_date, start_time, end_time, due_date, estimated_duration_minutes,
    started_at, expires_at, created_at
)
SELECT 
    g.id, u.id,
    'Focus Session: JWT Token Provider & Claims Validation',
    'Implement token generation, HMAC-SHA signature verification, and expiration guards.',
    'IN_PROGRESS', 'FOCUS_SESSION', 'CUSTOM', 'HIGH',
    '{"targetDurationMinutes":90,"intervalMinutes":45,"breakMinutes":10,"objectives":[{"id":1,"text":"Implement generateAccessToken with subject claims","completed":true},{"id":2,"text":"Implement extractUsername and isTokenExpired validators","completed":true},{"id":3,"text":"Handle ExpiredJwtException and MalformedJwtException","completed":false},{"id":4,"text":"Write mock unit tests for expired token rejection","completed":false}]}',
    CURRENT_DATE, '10:00:00', '11:30:00', CURRENT_DATE + INTERVAL '2 days', 90,
    NOW() - INTERVAL '25 minutes', NOW() + INTERVAL '65 minutes', NOW() - INTERVAL '25 minutes'
FROM users u
JOIN goals g ON g.user_id = u.id AND g.title = 'Complete Spring Boot Security Module'
WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.goal_id = g.id AND t.title = 'Focus Session: JWT Token Provider & Claims Validation'
);

-- 1.3 FOCUS_SESSION (COMPLETED)
INSERT INTO tasks (
    goal_id, user_id, title, description, lifecycle_state, task_type, goal_stage, priority,
    content_payload, scheduled_date, start_time, end_time, due_date, estimated_duration_minutes,
    started_at, expires_at, created_at
)
SELECT 
    g.id, u.id,
    'Focus Session: UserDetailsService & Password Encoding',
    'Set up BCryptPasswordEncoder and JPA user credential loading.',
    'COMPLETED', 'FOCUS_SESSION', 'CUSTOM', 'MEDIUM',
    '{"targetDurationMinutes":60,"intervalMinutes":30,"breakMinutes":5,"objectives":[{"id":1,"text":"Define BCryptPasswordEncoder bean","completed":true},{"id":2,"text":"Implement UserDetailsService backed by UserRepository","completed":true},{"id":3,"text":"Verify authentication manager provider linkage","completed":true}]}',
    CURRENT_DATE - INTERVAL '1 day', '14:00:00', '15:00:00', CURRENT_DATE, 60,
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '60 minutes', NOW() - INTERVAL '2 days'
FROM users u
JOIN goals g ON g.user_id = u.id AND g.title = 'Complete Spring Boot Security Module'
WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.goal_id = g.id AND t.title = 'Focus Session: UserDetailsService & Password Encoding'
);

-- 2. QUIZ Tasks
-- 2.1 QUIZ (TODO - Ready to Take)
INSERT INTO tasks (
    goal_id, user_id, title, description, lifecycle_state, task_type, goal_stage, priority,
    content_payload, scheduled_date, start_time, end_time, due_date, estimated_duration_minutes,
    started_at, expires_at, created_at
)
SELECT 
    g.id, u.id,
    'Active Recall: Spring Security Architecture Quiz',
    'Test comprehension of filter chains, security contexts, and auth provider delegation.',
    'TODO', 'QUIZ', 'CUSTOM', 'MEDIUM',
    '[{"question":"What role does SecurityContextHolder serve in Spring Security?","options":["It stores authenticated principal details across thread execution","It hashes passwords using BCrypt","It intercepts incoming HTTP requests directly","It manages database transaction rollbacks"],"correct_answer_index":0,"explanation":"SecurityContextHolder provides thread-local access to the current SecurityContext containing the authenticated Authentication token."},{"question":"Which filter precedes UsernamePasswordAuthenticationFilter in standard JWT stateless authentication?","options":["BasicAuthenticationFilter","Custom JwtAuthenticationFilter","CsrfFilter","DefaultLoginPageGeneratingFilter"],"correct_answer_index":1,"explanation":"A custom JwtAuthenticationFilter is positioned before UsernamePasswordAuthenticationFilter to validate bearer tokens before standard credential checks."},{"question":"Why is CSRF protection safely disabled in stateless REST APIs using JWT?","options":["Because JWTs are encrypted with AES","Because stateless APIs authenticate via Authorization headers instead of browser-managed cookies","Because Spring Security enables it automatically on endpoints","Because CORS handles CSRF vulnerabilities"],"correct_answer_index":1,"explanation":"CSRF attacks rely on browsers automatically attaching session cookies to cross-origin requests; APIs storing JWT in client memory or non-cookie headers are immune."}]',
    CURRENT_DATE + INTERVAL '1 day', '11:00:00', '11:20:00', CURRENT_DATE + INTERVAL '4 days', 20,
    NULL, NULL, NOW()
FROM users u
JOIN goals g ON g.user_id = u.id AND g.title = 'Complete Spring Boot Security Module'
WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.goal_id = g.id AND t.title = 'Active Recall: Spring Security Architecture Quiz'
);

-- 2.2 QUIZ (IN_PROGRESS - Active Session Running)
INSERT INTO tasks (
    goal_id, user_id, title, description, lifecycle_state, task_type, goal_stage, priority,
    content_payload, scheduled_date, start_time, end_time, due_date, estimated_duration_minutes,
    started_at, expires_at, created_at
)
SELECT 
    g.id, u.id,
    'Active Recall: JWT Claims & Token Lifecycle Quiz',
    'Evaluates token expiration, signature verification algorithms, and payload validation.',
    'IN_PROGRESS', 'QUIZ', 'CUSTOM', 'HIGH',
    '[{"question":"What happens if the expiration claim (exp) in a JWT is in the past?","options":["The token is refreshed automatically","ExpiredJwtException is thrown during parsing","Spring defaults to guest permissions","The signature check is bypassed"],"correct_answer_index":1,"explanation":"jjwt parser validates standard claims and raises ExpiredJwtException when the token expires."},{"question":"Where should the signing key secret ideally be stored?","options":["Hardcoded inside the JwtService class","In an environment variable or secure vault","Inside the JWT payload claim","In public Git repository properties"],"correct_answer_index":1,"explanation":"Secrets must always be supplied via runtime environment variables or vault secret managers."}]',
    CURRENT_DATE, '14:00:00', '14:20:00', CURRENT_DATE + INTERVAL '2 days', 20,
    NOW() - INTERVAL '5 minutes', NOW() + INTERVAL '15 minutes', NOW() - INTERVAL '5 minutes'
FROM users u
JOIN goals g ON g.user_id = u.id AND g.title = 'Complete Spring Boot Security Module'
WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.goal_id = g.id AND t.title = 'Active Recall: JWT Claims & Token Lifecycle Quiz'
);

-- 2.3 QUIZ (COMPLETED - Review Key Available)
INSERT INTO tasks (
    goal_id, user_id, title, description, lifecycle_state, task_type, goal_stage, priority,
    content_payload, scheduled_date, start_time, end_time, due_date, estimated_duration_minutes,
    started_at, expires_at, created_at
)
SELECT 
    g.id, u.id,
    'Active Recall: Password Hashing & Salt Verification',
    'Diagnostic review covering BCrypt salting, work factor rounds, and timing attack prevention.',
    'COMPLETED', 'QUIZ', 'CUSTOM', 'MEDIUM',
    '[{"question":"Why is BCrypt preferred over raw SHA-256 for password hashing?","options":["BCrypt is faster to compute on GPUs","BCrypt incorporates per-hash salt and adjustable work factor to resist brute-force attacks","SHA-256 does not support strings longer than 16 characters","BCrypt generates symmetric decryption keys"],"correct_answer_index":1,"explanation":"BCrypt is deliberately slow and automatically embeds a salt to prevent rainbow table and high-speed ASIC cracking."}]',
    CURRENT_DATE - INTERVAL '1 day', '16:00:00', '16:20:00', CURRENT_DATE, 20,
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '20 minutes', NOW() - INTERVAL '2 days'
FROM users u
JOIN goals g ON g.user_id = u.id AND g.title = 'Complete Spring Boot Security Module'
WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.goal_id = g.id AND t.title = 'Active Recall: Password Hashing & Salt Verification'
);

-- 3. EXTERNAL_PROMPT Tasks
-- 3.1 EXTERNAL_PROMPT (TODO - Ready to Copy)
INSERT INTO tasks (
    goal_id, user_id, title, description, lifecycle_state, task_type, goal_stage, priority,
    content_payload, scheduled_date, start_time, end_time, due_date, estimated_duration_minutes,
    started_at, expires_at, created_at
)
SELECT 
    g.id, u.id,
    'Claude Prompt: Security Filter Chain & RBAC Audit',
    'Review filter registration order, method security annotations, and role-based access rules.',
    'TODO', 'EXTERNAL_PROMPT', 'CUSTOM', 'MEDIUM',
    '{"recommended_engine":"Claude 3.7 Sonnet","prompt_text":"I am implementing stateless JWT authentication in Spring Boot 3.4. Here is my SecurityFilterChain setup: I have disabled CSRF, configured SessionCreationPolicy.STATELESS, and added a JwtAuthenticationFilter before UsernamePasswordAuthenticationFilter. Act as a Senior AppSec Engineer: 1) Identify any misconfigurations or bypass risks in this setup. 2) What edge cases exist if an expired token is supplied to a public endpoint? 3) Provide 3 test scenarios for role-based endpoint authorization."}',
    CURRENT_DATE + INTERVAL '2 days', '15:00:00', '15:30:00', CURRENT_DATE + INTERVAL '5 days', 30,
    NULL, NULL, NOW()
FROM users u
JOIN goals g ON g.user_id = u.id AND g.title = 'Complete Spring Boot Security Module'
WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.goal_id = g.id AND t.title = 'Claude Prompt: Security Filter Chain & RBAC Audit'
);

-- 3.2 EXTERNAL_PROMPT (IN_PROGRESS - User in External Session)
INSERT INTO tasks (
    goal_id, user_id, title, description, lifecycle_state, task_type, goal_stage, priority,
    content_payload, scheduled_date, start_time, end_time, due_date, estimated_duration_minutes,
    started_at, expires_at, created_at
)
SELECT 
    g.id, u.id,
    'ChatGPT Prompt: JWT Refresh Rotation & Revocation Strategy',
    'Evaluate refresh token rotation, revocation blacklists, and database storage tradeoffs.',
    'IN_PROGRESS', 'EXTERNAL_PROMPT', 'CUSTOM', 'HIGH',
    '{"recommended_engine":"GPT-4o","prompt_text":"I need to implement secure Refresh Token Rotation for my mobile app backend. 1) Compare using Redis vs PostgreSQL for maintaining active refresh tokens and revocation families. 2) How should the backend handle a refresh token replay attack where an old token is reused? 3) Provide a concise algorithm for invalidating the entire token family when theft is detected."}',
    CURRENT_DATE, '15:30:00', '16:00:00', CURRENT_DATE + INTERVAL '3 days', 30,
    NOW() - INTERVAL '10 minutes', NOW() + INTERVAL '20 minutes', NOW() - INTERVAL '10 minutes'
FROM users u
JOIN goals g ON g.user_id = u.id AND g.title = 'Complete Spring Boot Security Module'
WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.goal_id = g.id AND t.title = 'ChatGPT Prompt: JWT Refresh Rotation & Revocation Strategy'
);

-- 3.3 EXTERNAL_PROMPT (COMPLETED)
INSERT INTO tasks (
    goal_id, user_id, title, description, lifecycle_state, task_type, goal_stage, priority,
    content_payload, scheduled_date, start_time, end_time, due_date, estimated_duration_minutes,
    started_at, expires_at, created_at
)
SELECT 
    g.id, u.id,
    'Claude Prompt: Exception Translation & AuthEntryPoint Design',
    'Architecture prompt analyzing AuthenticationEntryPoint and AccessDeniedHandler separation.',
    'COMPLETED', 'EXTERNAL_PROMPT', 'CUSTOM', 'LOW',
    '{"recommended_engine":"Claude 3.7 Sonnet","prompt_text":"Explain the difference between AuthenticationEntryPoint (401 Unauthorized) and AccessDeniedHandler (403 Forbidden) in Spring Security. How should custom JSON error responses be written to HttpServletResponse without breaking the filter dispatch chain?"}',
    CURRENT_DATE - INTERVAL '1 day', '17:00:00', '17:30:00', CURRENT_DATE, 30,
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '30 minutes', NOW() - INTERVAL '2 days'
FROM users u
JOIN goals g ON g.user_id = u.id AND g.title = 'Complete Spring Boot Security Module'
WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM tasks t WHERE t.goal_id = g.id AND t.title = 'Claude Prompt: Exception Translation & AuthEntryPoint Design'
);

INSERT INTO user_settings (
    user_id, quiz_question_count, quiz_passing_score_percentage,
    focus_duration_minutes, break_duration_minutes, reschedule_window_start, reschedule_window_end,
    allow_weekend_reschedule, exam_buffer_days, updated_at
)
SELECT u.id, 6, 60.0, 45, 10, '08:00:00', '21:00:00', true, 3, NOW()
FROM users u WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM user_settings s WHERE s.user_id = u.id
);
-- ============================================================================
-- Seed Default User Settings for Rinavho
-- ============================================================================
INSERT INTO user_settings (
    user_id, quiz_question_count, quiz_passing_score_percentage,
    focus_duration_minutes, break_duration_minutes, reschedule_window_start, reschedule_window_end,
    allow_weekend_reschedule, exam_buffer_days, updated_at
)
SELECT u.id, 6, 60.0, 45, 10, '08:00:00', '21:00:00', true, 3, NOW()
FROM users u WHERE u.email = 'rinavho@sgelasmart.com'
AND NOT EXISTS (
    SELECT 1 FROM user_settings s WHERE s.user_id = u.id
);
