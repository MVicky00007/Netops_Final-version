# Backend Documentation — Spring Boot Microservices

The backend is a 9-module Maven project: 1 parent + 1 shared library (`common`) + 1 service registry (Eureka) + 1 API gateway + 5 business microservices. All services share one MySQL database. Authentication is stateless JWT, propagated across services via a shared secret.

---

## Table of contents
1. [Tech stack](#1-tech-stack)
2. [Architecture diagram](#2-architecture-diagram)
3. [Maven multi-module layout](#3-maven-multi-module-layout)
4. [The `common` module — shared kernel](#4-the-common-module--shared-kernel)
5. [Service discovery — Eureka](#5-service-discovery--eureka)
6. [API Gateway — routing + CORS](#6-api-gateway--routing--cors)
7. [JWT authentication — issued by `user-service`, validated everywhere](#7-jwt-authentication--issued-by-user-service-validated-everywhere)
8. [Per-service Spring Security configs](#8-per-service-spring-security-configs)
9. [Global exception handling](#9-global-exception-handling)
10. [Each microservice in detail](#10-each-microservice-in-detail)
11. [JPA entity relationships (cross-service)](#11-jpa-entity-relationships-cross-service)
12. [End-to-end request flow](#12-end-to-end-request-flow)
13. [Audit log via AOP](#13-audit-log-via-aop)
14. [Testing strategy](#14-testing-strategy)

---

## 1. Tech stack

| | Version | Purpose |
|---|---|---|
| Java | 21 | LTS, records, pattern matching |
| Spring Boot | 3.4.5 | Auto-config, embedded Tomcat |
| Spring Cloud | 2024.0.1 | Gateway + Eureka |
| Spring Security | 6 (via Boot) | JWT filter + `@PreAuthorize` |
| Spring Data JPA | 3 | Repositories |
| Hibernate | 6.x | ORM, dialect=MySQL |
| MySQL connector | 8 | Driver |
| jjwt | 0.11.5 | JWT encode/decode |
| Lombok | latest | `@Getter`, `@Builder`, etc. |
| Build | Maven (wrapper) | `./mvnw clean install` |
| Tests | JUnit 5, Mockito, H2 | Unit + integration |

---

## 2. Architecture diagram

```
                       ┌─────────────────┐
                       │  Angular front  │
                       │  (port 4200)    │
                       └────────┬────────┘
                                │  HTTP + JWT
                                ▼
                       ┌─────────────────┐         ┌──────────────────┐
                       │  API Gateway    │◄────────│   Eureka         │
                       │  Spring Cloud   │  reads  │   Discovery      │
                       │  port 9097      │  registry │   port 8761    │
                       └────┬─────┬──┬──┬┘         └────────┬─────────┘
                            │     │  │  │ uses lb://*-service to find
                            │     │  │  │ healthy instances dynamically
        ┌───────────────────┘     │  │  │
        ▼                         ▼  ▼  ▼
┌───────────────┐  ┌───────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐
│ user-service  │  │ site-service  │  │ incident-      │  │ capacity-      │  │ task-       │
│ :9101         │  │ :9102         │  │ service :9103  │  │ service :9104  │  │ service :9105│
└──────┬────────┘  └──────┬────────┘  └──────┬─────────┘  └────────┬───────┘  └──────┬──────┘
       │                  │                   │                     │                  │
       └──────────────────┴───────────────────┴─────────────────────┴──────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │   MySQL 8        │
                                    │   netopsone DB   │
                                    │   (shared)       │
                                    └──────────────────┘

Each service depends on the "common" library (JPA entities, repos, JWT util, exceptions).
```

---

## 3. Maven multi-module layout

```
backend/
├── pom.xml                              # PARENT — packaging=pom
│
├── common/                              # shared library (lib JAR)
│   └── src/main/java/com/project/netops/
│       ├── api/APIResponse.java
│       ├── aspect/
│       │   ├── Auditable.java           # @interface annotation
│       │   ├── ActivityAuditAspect.java
│       │   └── LoggingAspect.java
│       ├── exception/
│       │   ├── GlobalExceptionHandler.java
│       │   └── 14 exception classes
│       ├── model/                       # 20 JPA entities
│       ├── repository/                  # 20 JpaRepository interfaces
│       ├── security/
│       │   ├── JwtUtil.java             # token gen/parse
│       │   └── JwtFilter.java           # OncePerRequestFilter
│       └── service/
│           ├── AuditLogService.java
│           └── impl/AuditLogServiceImpl.java
│
├── discovery-server/                    # Eureka server
│   ├── pom.xml
│   └── src/main/.../DiscoveryServerApplication.java   (@EnableEurekaServer)
│
├── api-gateway/                         # Spring Cloud Gateway
│   ├── pom.xml
│   └── src/main/.../ApiGatewayApplication.java
│
├── user-service/                        # Each business service:
│   ├── pom.xml                          # depends on common
│   └── src/main/java/com/project/netops/
│       ├── controller/UserController.java
│       ├── service/UserService.java + impl
│       ├── mapper/UserMapper.java
│       ├── dto/request/UserRequestDto.java
│       ├── dto/response/UserResponseDto.java
│       ├── config/SpringSecurity.java + WebConfig.java
│       └── UserServiceApplication.java  (@SpringBootApplication)
│
├── site-service/                        # Same structure as user-service
├── incident-service/
├── capacity-service/
└── task-service/
```

### Parent `pom.xml` (excerpt)
```xml
<groupId>com.project</groupId>
<artifactId>netops-parent</artifactId>
<packaging>pom</packaging>
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.4.5</version>
</parent>
<properties>
    <java.version>21</java.version>
    <spring-cloud.version>2024.0.1</spring-cloud.version>
</properties>
<modules>
    <module>common</module>
    <module>discovery-server</module>
    <module>api-gateway</module>
    <module>user-service</module>
    <module>site-service</module>
    <module>incident-service</module>
    <module>capacity-service</module>
    <module>task-service</module>
</modules>
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.springframework.cloud</groupId>
            <artifactId>spring-cloud-dependencies</artifactId>
            <version>${spring-cloud.version}</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
        <dependency>
            <groupId>com.project</groupId>
            <artifactId>common</artifactId>
            <version>${project.version}</version>
        </dependency>
    </dependencies>
</dependencyManagement>
```

### A business service `pom.xml` (excerpt)
```xml
<artifactId>user-service</artifactId>
<dependencies>
    <dependency><groupId>com.project</groupId><artifactId>common</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
    <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
    <dependency><groupId>org.springframework.cloud</groupId><artifactId>spring-cloud-starter-netflix-eureka-client</artifactId></dependency>
    <dependency><groupId>com.mysql</groupId><artifactId>mysql-connector-j</artifactId><scope>runtime</scope></dependency>
</dependencies>
```

---

## 4. The `common` module — shared kernel

This is the most opinionated design decision in the project. Instead of each microservice owning its own database and entities, we put **all 20 JPA entities + their repositories** into a shared `common` library that every service depends on.

### Why?
Look at one entity:
```java
@Entity @Table(name = "incident_tickets")
public class IncidentTicket {
    @ManyToOne @JoinColumn(name = "fault_id", nullable = false)
    private FaultReport fault;        // owned by incident-service

    @ManyToOne @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;           // owned by user-service

    @ManyToOne @JoinColumn(name = "assigned_to")
    private User assignedTo;
    // ...
}
```

`IncidentTicket` references `User`. If user-service has its own DB and we tried to make incident-service have its own, this JPA relationship breaks. We'd have to:
- Replace `private User createdBy` with `private Long createdById`
- Replace every `ticket.getCreatedBy().getName()` with a Feign HTTP call to user-service
- Lose all JPA join queries

That's a big refactor. We chose to keep the data layer shared so the relationships keep working unchanged. The trade-off is that the services aren't independently deployable at the *schema* level — they're independently deployable as *processes*.

This pattern is called the **shared kernel** in DDD or **modular monolith deployed as services**.

### `common` contains
| Package | What's in it |
|---|---|
| `api` | `APIResponse<T>` — wrapper used by incident/capacity/task controllers |
| `model` | 20 `@Entity` classes |
| `repository` | 20 `JpaRepository` interfaces |
| `security` | `JwtUtil`, `JwtFilter` |
| `exception` | All custom exceptions + `GlobalExceptionHandler` |
| `aspect` | `@Auditable` annotation, `ActivityAuditAspect`, `LoggingAspect` |
| `service` | `AuditLogService` + impl (any service can write audit entries) |

### Why a service that doesn't own `User` still has access to it
When `user-service` depends on `common` (in `pom.xml`):
```xml
<dependency><groupId>com.project</groupId><artifactId>common</artifactId></dependency>
```

It gets the `common-0.0.1-SNAPSHOT.jar` on its classpath, which contains `User.class`. Same for `incident-service`, `capacity-service`, etc. — all of them can import `com.project.netops.model.User` because all of them depend on `common`.

---

## 5. Service discovery — Eureka

### `discovery-server` (port 8761)
A 1-class Spring Boot app:
```java
@SpringBootApplication
@EnableEurekaServer       // ← that's the whole thing
public class DiscoveryServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(DiscoveryServerApplication.class, args);
    }
}
```

`application.yml`:
```yaml
server:
  port: 8761
eureka:
  client:
    register-with-eureka: false   # the server doesn't register itself
    fetch-registry: false
```

Visit http://localhost:8761 to see the registry dashboard.

### Each service registers as an Eureka client
Their `application.properties` has:
```properties
spring.application.name=user-service
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
eureka.instance.prefer-ip-address=true
```

When `user-service` starts, it tells Eureka "I'm USER-SERVICE at host:9101". Every 30 seconds it sends a heartbeat. If it stops responding for 90 seconds, Eureka marks it `DOWN`.

### How the gateway uses it
In `api-gateway/application.yml`:
```yaml
spring.cloud.gateway.routes:
  - id: user-service-auth
    uri: lb://user-service        # ← lb:// means "look up via Eureka load balancer"
    predicates:
      - Path=/signup,/login,/forgot-password
```

`lb://user-service` resolves at runtime: gateway asks Eureka for healthy USER-SERVICE instances, picks one (usually just 1 in dev), and forwards there.

---

## 6. API Gateway — routing + CORS

### `api-gateway/src/main/resources/application.yml` (excerpt)
```yaml
server:
  port: 9097                          # SAME port the original monolith used

spring:
  application:
    name: api-gateway
  cloud:
    gateway:
      # ── CORS ──────────────────────────────────────────────────
      globalcors:
        cors-configurations:
          '[/**]':
            allowedOriginPatterns:    # patterns, not exact match — supports wildcards
              - "http://localhost:*"  # any localhost port (dev convenience)
              - "http://127.0.0.1:*"
            allowedMethods: [GET, POST, PUT, PATCH, DELETE, OPTIONS]
            allowedHeaders: "*"
            allowCredentials: true
            maxAge: 3600
      default-filters:
        - DedupeResponseHeader=Access-Control-Allow-Credentials Access-Control-Allow-Origin
      # ── Routes ────────────────────────────────────────────────
      routes:
        - id: user-service-auth
          uri: lb://user-service
          predicates: [ Path=/signup,/login,/forgot-password,/update-profile ]
        - id: user-service-admin
          uri: lb://user-service
          predicates: [ Path=/users,/update-role,/block-user,/approve-user,/pending-users ]

        - id: site-service-sites
          uri: lb://site-service
          predicates: [ Path=/sites/** ]
        - id: site-service-nodes
          uri: lb://site-service
          predicates: [ Path=/nodes/** ]
        # ... 13 more routes
```

### Why the gateway runs on port 9097
This is the **same port the original monolith used**. By keeping the same port, any existing HTTP client (Postman collections, curl scripts, the frontend, etc.) keeps working without modification. The gateway routes by URL prefix to the right microservice.

### CORS — why `allowedOriginPatterns` instead of `allowedOrigins`
- `allowedOrigins` accepts only exact-match URLs (`http://localhost:4200`).
- `allowedOriginPatterns` accepts wildcards (`http://localhost:*`) which is what we need when VS Code's preview pane proxies the dev server through a random port.

### Why `DedupeResponseHeader`
Spring's WebMVC inside each microservice (e.g. user-service's `WebConfig`) can ALSO add CORS headers. If both the gateway AND the downstream service add `Access-Control-Allow-Origin`, the browser sees two values and rejects the response. This filter removes the duplicate.

---

## 7. JWT authentication — issued by `user-service`, validated everywhere

### Token generation in `user-service`
```java
// JwtUtil.java (in common)
public String generateToken(String email, String role) {
    return Jwts.builder()
            .setSubject(email)                                // sub = email
            .claim("role", role)                              // custom claim
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
}

private Key getSigningKey() {
    return Keys.hmacShaKeyFor(secretKey.getBytes());
}
```

The `secretKey` comes from `application.properties`:
```properties
jwt.secret=mysecuresecretkeymysecuresecretkey123
jwt.expiration=3600000
```

### `UserController.login()`
```java
@PostMapping("/login")
public ResponseEntity<String> login(@RequestBody UserRequestDto userRequestDto) {
    // Step 1: authenticate with Spring Security → loads user from DB via CustomUserDetailsService
    authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            userRequestDto.getEmail(), userRequestDto.getPassword())
    );
    // Step 2: business check (active? suspended?)
    UserResponseDto user = userService.signIn(userRequestDto.getEmail(), userRequestDto.getPassword());
    // Step 3: mint a JWT
    String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
    return new ResponseEntity<>(token, HttpStatus.OK);
}
```

### Same secret in EVERY service's `application.properties`
```properties
jwt.secret=mysecuresecretkeymysecuresecretkey123
```

Why this matters: a token signed by user-service with this key can be **verified by any service that has the same key**. No round-trip back to user-service for each authenticated request. That's stateless JWT.

### `JwtFilter` runs on every authenticated request (in every service)
```java
@Component
public class JwtFilter extends OncePerRequestFilter {
    @Autowired private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
        // Public paths don't need a token
        String path = req.getServletPath();
        if (path.equals("/login") || path.equals("/signup") || ...) {
            chain.doFilter(req, res); return;
        }

        String header = req.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(req, res); return;   // anonymous → Spring Security will reject
        }

        String token = header.substring(7);
        try {
            String email = jwtUtil.extractEmail(token);
            String role  = jwtUtil.extractRole(token);
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                var authToken = new UsernamePasswordAuthenticationToken(
                    email, null, List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception ex) {
            // Malformed / expired token → clear context, Spring Security will reject the request
            SecurityContextHolder.clearContext();
        }
        chain.doFilter(req, res);
    }
}
```

This is what makes RBAC work: the email and role are extracted from the JWT and placed into Spring Security's `SecurityContext`. Downstream `@PreAuthorize` annotations then check that context.

---

## 8. Per-service Spring Security configs

### user-service has the **most restrictive** config (because of admin endpoints)
```java
@Configuration @EnableWebSecurity @EnableMethodSecurity
public class SpringSecurity {
    @Autowired private JwtFilter jwtFilter;

    @Bean public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
          .csrf(csrf -> csrf.disable())
          .authorizeHttpRequests(auth -> auth
              .requestMatchers("/signup", "/login", "/forgot-password", "/update-profile").permitAll()
              .requestMatchers("/users", "/update-role", "/block-user", "/approve-user", "/pending-users")
                  .hasRole("ADMIN")     // ← these are the role-gated endpoints
              .anyRequest().authenticated()
          )
          .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
          .httpBasic(b -> b.disable())
          .formLogin(f -> f.disable());
        return http.build();
    }
}
```

### Other services use a **simpler** config
```java
// In site-service, incident-service, capacity-service, task-service
@Configuration @EnableWebSecurity @EnableMethodSecurity
public class SecurityConfig {
    @Autowired private JwtFilter jwtFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
          .csrf(csrf -> csrf.disable())
          .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())  // any auth user
          .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
          .httpBasic(b -> b.disable())
          .formLogin(f -> f.disable());
        return http.build();
    }
}
```

These services accept **any** authenticated user. Per-endpoint role checks would go via `@PreAuthorize` on the controller methods (we don't use them on these services today — frontend handles it via role guards + sidebar filtering).

---

## 9. Global exception handling

`common/exception/GlobalExceptionHandler.java` is a `@RestControllerAdvice` that automatically applies to every controller in every service (since they all depend on `common`):

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<String> handleUserNotFound(UserNotFoundException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(AccountNotActiveException.class)
    public ResponseEntity<String> handleAccountNotActive(AccountNotActiveException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<String> handleInvalidCredentials(InvalidCredentialsException ex) {
        return new ResponseEntity<>(ex.getMessage(), HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<String> handleBadCredentials(BadCredentialsException ex) {
        return new ResponseEntity<>("Invalid email or password", HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<APIResponse<Map<String, String>>> handleValidation(...) {
        Map<String, String> fieldErrors = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(err ->
            fieldErrors.put(err.getField(), err.getDefaultMessage()));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(APIResponse.<Map<String,String>>builder()
                    .success(false)
                    .message("Validation failed.")
                    .data(fieldErrors)
                    .build());
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<APIResponse<Void>> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(APIResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)  // catch-all
    public ResponseEntity<APIResponse<Void>> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(APIResponse.error("Unexpected error: " + ex.getMessage()));
    }
}
```

So when `UserServiceImpl.signIn()` throws `AccountNotActiveException`, it bubbles up, hits the handler, and the client gets a clean `403 Forbidden` with the message — not a Java stack trace.

---

## 10. Each microservice in detail

### 🔐 user-service (port 9101)

**Owns:** authentication, user CRUD, role management.

**Public endpoints (anyone):**
- `POST /signup` — create account (status starts `INACTIVE`)
- `POST /login` — exchange credentials for JWT
- `POST /forgot-password` — reset password
- `PUT /update-profile` — update own name/phone

**Admin-only endpoints (`hasRole("ADMIN")`):**
- `GET /users` — list all
- `GET /pending-users` — list `INACTIVE` users
- `PUT /approve-user?userId=X`
- `PUT /block-user?userId=X`
- `PUT /update-role?userId=X&role=Y`

**Key flow — signup:**
```java
public String signUp(UserRequestDto dto) {
    if (userRepo.findByEmail(dto.getEmail()) != null)
        throw new UserAlreadyExistsException("Email already registered: " + dto.getEmail());

    User user = UserMapper.mapToEntity(dto);
    user.setPassword(encoder.encode(dto.getPassword()));          // BCrypt hash
    user.setRole(Role.valueOf(dto.getRole().toUpperCase()));
    user.setStatus(Status.INACTIVE);                              // needs admin approval
    userRepo.save(user);
    return "User registered successfully. Waiting for admin approval.";
}
```

### 🏢 site-service (port 9102)

**Owns:** physical sites, edge nodes (routers/switches), interfaces, vendors.

**Endpoints:**
- `/sites/**` — full CRUD (Spring Data style)
- `/nodes/**`, `/sites/{id}/nodes`, `/nodes/{id}/interfaces`, `/interfaces/{id}` — nested CRUD
- `/vendors` — read-only list (read from `vendor_records` table)

### 🚨 incident-service (port 9103)

**Owns:** fault reports, incident tickets (with SLA records, attachments), notifications.

**Key flow — creating a ticket triggers SLA tracking:**
```java
@Transactional
@Auditable(action = "CREATE_TICKET", resourceType = "IncidentTicket")
public IncidentTicketResponse createTicket(IncidentTicketRequest req) {
    FaultReport fault = faultRepository.findById(req.getFaultId()).orElseThrow(...);
    User creator      = userRepository.findById(req.getCreatedById().intValue()).orElseThrow(...);

    IncidentTicket ticket = IncidentTicket.builder()
            .fault(fault).createdBy(creator)
            .priority(IncidentTicket.Priority.valueOf(req.getPriority()))
            .status(IncidentTicket.Status.OPEN)
            .build();
    IncidentTicket saved = ticketRepository.save(ticket);

    // Auto-create SLA record based on priority
    int resHours = req.getPriority().equalsIgnoreCase("P1") ? 4 : 24;
    SLARecord sla = SLARecord.builder()
            .ticket(saved)
            .responseDueAt(LocalDateTime.now().plusHours(1))
            .resolutionDueAt(LocalDateTime.now().plusHours(resHours))
            .build();
    slaRepository.save(sla);

    return mapper.toTicketResponse(saved);
}
```

`@Auditable(...)` triggers the AOP aspect (see §13).

### 📊 capacity-service (port 9104)

**Owns:** capacity plans, capacity records (measurements), health checks, KPIs, reports, change evidence (file uploads).

**Key flow — manager approves a plan:**
```java
@Transactional
public CapacityApprovalResponse approvePlan(Long planId, Long approvedById,
        CapacityApproval.ApprovalStatus decision, String comments) {

    CapacityPlan plan = planRepository.findById(planId).orElseThrow(...);
    if (plan.getStatus() != CapacityPlan.PlanStatus.PENDING)
        throw new ConflictException("Only PENDING plans can be approved or rejected.");

    User approvedBy = userRepository.findById(approvedById.intValue()).orElseThrow(...);

    CapacityApproval approval = CapacityApproval.builder()
            .plan(plan).approvedBy(approvedBy)
            .comments(comments).status(decision)
            .build();
    approvalRepository.save(approval);

    plan.setStatus(decision == APPROVED ? PlanStatus.APPROVED : PlanStatus.REJECTED);
    planRepository.save(plan);

    auditLogService.logAction(approvedById, decision + "_CAPACITY_PLAN",
            "CapacityPlan", planId, comments);

    return approvalMapper.toResponse(saved);
}
```

Notice: writes to `capacity_approvals` table AND updates the `capacity_plans.status` AND writes an audit log entry — all in one transaction.

### 📋 task-service (port 9105)

**Owns:** tasks assigned to users, the read-only audit log endpoints.

The audit log endpoints (`/audit-logs`, `/audit-logs/by-user`, `/audit-logs/by-action`) are GET-only; entries get *written* by `AuditLogService` (in `common`), called from any service via the `@Auditable` aspect.

---

## 11. JPA entity relationships (cross-service)

```
User ◄────────┬───── IncidentTicket (createdBy, assignedTo)
              ├───── FaultReport (reportedBy)
              ├───── CapacityPlan (requestedBy)
              ├───── CapacityRecord (recordedBy)
              ├───── CapacityApproval (approvedBy)
              ├───── HealthCheck (createdBy)
              ├───── HealthCheckRun (runBy)
              ├───── Report (generatedBy)
              ├───── Task (user)
              ├───── Notification (user)
              ├───── AuditLog (user)
              ├───── TicketAttachment (uploadedBy)
              └───── ChangeEvidence (uploadedBy)

Site ◄────────┬───── EdgeNode (site)
              ├───── FaultReport (site)
              ├───── CapacityPlan (site)
              └───── CapacityRecord (site)

EdgeNode ◄────┬───── Interface (node)
              └───── FaultReport (node, optional)

Interface ◄───┬───── CapacityPlan (iface, optional)
              ├───── CapacityRecord (iface)
              └───── FaultReport (iface, optional)

FaultReport ◄────── IncidentTicket (fault)

IncidentTicket ◄──┬─ SLARecord (ticket, one-to-one)
                  └─ TicketAttachment (ticket)

CapacityPlan ◄────┬─ CapacityApproval (plan, one-to-one)
                  └─ ChangeEvidence (plan)
```

This dense graph is exactly why we kept everything in `common` — splitting it into separate per-service schemas would mean replacing every arrow with an HTTP call.

---

## 12. End-to-end request flow

Here's what happens for **`POST /api/v1/tickets`** from a logged-in user:

```
┌─ 1. Browser ──────────────────────────────────────────────────────────┐
│  fetch('http://localhost:9097/api/v1/tickets', {                      │
│    method: 'POST',                                                    │
│    headers: { 'Authorization': 'Bearer eyJhbGc...',                   │
│                'Content-Type': 'application/json' },                  │
│    body: '{"faultId":10,"createdById":10,"priority":"P2"}'            │
│  })                                                                   │
└───────────────────────────────────┬───────────────────────────────────┘
                                    ▼
┌─ 2. CORS preflight (OPTIONS) ─────────────────────────────────────────┐
│  Gateway checks Origin: http://localhost:4200 → in allowedPatterns    │
│  Returns 200 with Access-Control-Allow-* headers                       │
└───────────────────────────────────┬───────────────────────────────────┘
                                    ▼
┌─ 3. Actual POST hits the gateway (port 9097) ─────────────────────────┐
│  RouteLocator matches: Path=/api/v1/tickets/** → lb://incident-service │
│  Ask Eureka: "Where is INCIDENT-SERVICE?"                              │
│  Eureka: "incident-service @ 10.10.10.10:9103"                         │
│  Gateway forwards POST to http://10.10.10.10:9103/api/v1/tickets       │
└───────────────────────────────────┬───────────────────────────────────┘
                                    ▼
┌─ 4. incident-service (port 9103) ─────────────────────────────────────┐
│  4a. JwtFilter (from common) runs                                     │
│       - Extracts Bearer token                                          │
│       - jwtUtil.extractEmail() → "alice@test.com"                      │
│       - jwtUtil.extractRole() → "ADMIN"                                │
│       - Puts UsernamePasswordAuthenticationToken into SecurityContext  │
│  4b. Spring Security checks .anyRequest().authenticated() → ✓          │
│  4c. Dispatcher → IncidentTicketController.createTicket(@Valid req)    │
│       - @Valid runs JSR-380 validators on IncidentTicketRequest        │
│  4d. Service method @Transactional                                     │
│       - faultRepository.findById(10)  → SELECT … FROM fault_reports   │
│       - userRepository.findById(10)   → SELECT … FROM user             │
│       - ticketRepository.save(ticket) → INSERT INTO incident_tickets   │
│       - slaRepository.save(sla)       → INSERT INTO sla_records        │
│  4e. @Auditable AOP intercepts (if aspect class on classpath)          │
│       - Writes a row into audit_log                                    │
│  4f. mapper.toTicketResponse(saved) → DTO                              │
│  4g. Wrapped in APIResponse → JSON                                     │
└───────────────────────────────────┬───────────────────────────────────┘
                                    ▼
┌─ 5. Response goes back ───────────────────────────────────────────────┐
│  incident-service → gateway → browser                                 │
│  Body: {"success":true,"message":"Ticket created","data":{...}}        │
└───────────────────────────────────────────────────────────────────────┘
```

Total time in dev: ~50-150 ms.

---

## 13. Audit log via AOP

The `@Auditable` annotation in `common`:
```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    String action();         // e.g. "CREATE_TICKET"
    String resourceType();   // e.g. "IncidentTicket"
}
```

The aspect that intercepts it:
```java
@Aspect @Component @RequiredArgsConstructor
public class ActivityAuditAspect {
    private final AuditLogRepo auditLogRepository;
    private final UserRepo userRepository;
    private final AuditorAware<Long> auditorAware;

    @AfterReturning(value = "@annotation(auditable)")
    public void logActivity(JoinPoint jp, Auditable auditable) {
        Long currentUserId = auditorAware.getCurrentAuditor().orElse(1L);
        User currentUser = userRepository.findById(currentUserId.intValue()).orElse(null);

        Long resourceId = null;
        Object[] args = jp.getArgs();
        if (args.length > 0 && args[0] instanceof Long) resourceId = (Long) args[0];

        if (currentUser != null) {
            AuditLog log = AuditLog.builder()
                    .user(currentUser)
                    .action(auditable.action())
                    .resourceType(auditable.resourceType())
                    .resourceId(resourceId != null ? resourceId.toString() : null)
                    .details("Executed backend method: " + jp.getSignature().getName())
                    .timestamp(LocalDateTime.now())
                    .build();
            auditLogRepository.save(log);
        }
    }
}
```

So whenever any `@Transactional` service method completes successfully AND is annotated `@Auditable`, an audit log entry is automatically written. Zero glue code in the service.

Service methods can also write audit entries explicitly:
```java
auditLogService.logAction(approvedById, "APPROVE_CAPACITY_PLAN",
        "CapacityPlan", planId, comments);
```

---

## 14. Testing strategy

The project has **three layers** of tests, each verifying different things:

### Unit tests (Mockito) — `./mvnw test "-Dtest=*Test"`
Test one class in isolation, everything else mocked.

```java
@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {
    @Mock private UserRepo userRepo;
    @Mock private PasswordEncoder encoder;
    @InjectMocks private UserServiceImpl userService;

    @Test
    @DisplayName("signUp persists a new INACTIVE user with encoded password")
    void signUp_savesNewUserAsInactive() {
        when(userRepo.findByEmail("alice@example.com")).thenReturn(null);
        when(encoder.encode("plaintext")).thenReturn("encoded");

        String result = userService.signUp(signUpRequest);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepo).save(captor.capture());
        User saved = captor.getValue();
        assertEquals("encoded", saved.getPassword());
        assertEquals(User.Status.INACTIVE, saved.getStatus());
    }
}
```
**36 tests, ~3 seconds.**

### Integration tests (`@SpringBootTest` + H2)
Boot the full Spring context, hit real HTTP endpoints, use H2 in-memory DB.

```java
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("test")
class UserAuthFlowIntegrationTest {
    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepo userRepo;

    @Test
    void fullAuthFlow() throws Exception {
        mockMvc.perform(post("/signup").contentType(JSON).content(SIGNUP_ALICE))
                .andExpect(status().isCreated());

        User alice = userRepo.findByEmail("alice@itest.com");
        alice.setStatus(User.Status.ACTIVE);
        userRepo.save(alice);

        MvcResult loginResult = mockMvc.perform(post("/login").contentType(JSON).content(LOGIN_ALICE))
                .andExpect(status().isOk())
                .andExpect(content().string(startsWith("eyJ")))
                .andReturn();
        String token = loginResult.getResponse().getContentAsString();

        mockMvc.perform(get("/users").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].email").value("alice@itest.com"));
    }
}
```
The test profile uses H2 in MySQL-compat mode and disables Eureka:
```properties
spring.datasource.url=jdbc:h2:mem:testdb;MODE=MySQL;NON_KEYWORDS=USER
eureka.client.enabled=false
```
**8 tests, ~3 minutes (Spring context boot is slow).**

### End-to-end smoke tests (PowerShell)
Two scripts hit the **live running gateway** through the browser-equivalent flow:
- `test-all-endpoints.ps1` — every GET returns 200 OK with data
- `test-rbac.ps1` — verifies the **RBAC matrix** (5 roles × 32 endpoints + anonymous = 192 access-control checks)

```powershell
# Excerpt from test-rbac.ps1
foreach ($ep in $endpoints) {
    foreach ($u in $users) {
        $tok = $tokens[$u.Role]
        $expected = if ($ep.Expected -is [hashtable]) { $ep.Expected[$u.Role] } else { $ep.Expected }
        $actual   = Invoke-Endpoint $ep.Method "$GW$($ep.Path)" $tok
        $pass = ($expected -eq $actual) -or ($expected -eq 200 -and $actual -eq 404)
        # ...
    }
}
```

---

## Common operations

### Build everything
```bash
./mvnw clean install -DskipTests
```

### Run one service in dev mode
```bash
./mvnw -pl user-service spring-boot:run
```

### Run all 7 services (Windows)
```powershell
./start-all.ps1
```

### Connect to MySQL
```
mysql -u root -p1234 netopsone
```

### Tail a service's logs (when running via spring-boot:run)
The terminal it's running in shows everything. For tests:
```
backend/<service>/target/surefire-reports/*.txt
```

---

## What's intentionally not microservices-pure

A few honest trade-offs worth knowing:

1. **Shared database.** All services hit the same MySQL. Splitting into per-service DBs would require replacing JPA `@ManyToOne` with Feign client calls and accepting eventual consistency.

2. **Shared entities (`common`).** Real microservices wouldn't have a shared library with `User`, `Site`, etc. — they'd each have their own copy. We chose this for code reuse at the cost of strict isolation.

3. **`@Auditable` only fires in services that have the aspect on the classpath.** The aspect lives in `common`, so technically every service has it — but `ActivityAuditAspect` depends on `AuditLogRepo` and `UserRepo`, both available everywhere via `common`. So audit log entries get written from any service that uses `@Auditable`.

4. **Same JWT secret hardcoded in every `application.properties`.** Real prod would use a secret manager (HashiCorp Vault, AWS Secrets Manager, etc.) and rotate keys.

5. **No circuit breakers / retry / bulkheads.** A real microservices stack with cross-service calls would need Resilience4j or similar. We avoided this by not making cross-service network calls (shared DB does the join instead).

These are all reasonable simplifications for a learning / portfolio project. The architecture *shape* is genuinely microservices — service discovery, gateway routing, stateless JWT, separate processes — but the data layer is shared for pragmatism.

---

That's the whole backend. 9 Maven modules, ~100 Java classes, 20 JPA entities, 32 endpoints, 192 verified access-control combinations. Every layer has a clear responsibility and the data flows are traceable end-to-end.
