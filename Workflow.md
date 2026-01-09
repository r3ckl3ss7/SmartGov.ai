# SmartGov.AI - Complete System Workflow Documentation

This document provides comprehensive workflow diagrams for all major processes in the SmartGov.AI government audit analytics platform.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [User Authentication Flow](#user-authentication-flow)
3. [CSV Upload & Processing Flow](#csv-upload--processing-flow)
4. [Risk Analysis Flow](#risk-analysis-flow)
5. [Data Visualization Flow](#data-visualization-flow)
7. [API Request Flow](#api-request-flow)

---

## System Architecture

```mermaid
graph TB
    subgraph "Frontend - React + Vite"
        A[User Interface] --> B[React Router]
        B --> C[Authentication Context]
        B --> D[Page Components]
        D --> E[Dashboard]
        D --> F[Upload]
        D --> G[History]
        D --> H[Transaction Details]
        D --> I[Login/Register]
    end
    
    subgraph "Backend - Node.js + Express"
        J[Express Server] --> K[Middleware]
        K --> L[Auth Middleware]
        K --> M[Multer Upload]
        J --> N[Controllers]
        N --> O[User Controller]
        N --> P[Admin Controller]
        J --> Q[Routes]
        Q --> R[User Routes]
        Q --> S[Admin Routes]
    end
    
    subgraph "AI Service - Flask + Python"
        T[Flask API] --> U[Analysis Engine]
        U --> V[Risk Scoring]
        U --> W[Department Analytics]
        U --> X[Vendor Analytics]
        U --> Y[Time Series Analysis]
    end
    
    subgraph "Database - MongoDB"
        Z[MongoDB Atlas] --> AA[Collections]
        AA --> AB[Users]
        AA --> AC[Transactions]
        AA --> AD[Vendors]
        AA --> AE[Departments]
        AA --> AF[Payments]
        AA --> AG[FileUploads]
    end
    
    D -->|HTTP Requests| J
    P -->|Analysis Request| T
    N -->|CRUD Operations| Z
    T -->|Returns Analytics| P
    P -->|JSON Response| D
```

---

## User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend (React)
    participant AC as Auth Context
    participant BE as Backend API
    participant DB as MongoDB
    participant JWT as JWT Service

    Note over U,JWT: Registration Flow
    U->>FE: Enter credentials (Register)
    FE->>BE: POST /api/v1/user/register
    BE->>DB: Check if user exists
    alt User exists
        DB-->>BE: User found
        BE-->>FE: 400 - User already exists
        FE-->>U: Show error message
    else New user
        DB-->>BE: User not found
        BE->>BE: Hash password (bcrypt)
        BE->>DB: Create new user
        DB-->>BE: User created
        BE->>JWT: Generate token
        JWT-->>BE: JWT token
        BE->>BE: Set HTTP-only cookie
        BE-->>FE: 201 - User data + token
        FE->>AC: Store user in context
        FE-->>U: Redirect to Dashboard
    end

    Note over U,JWT: Login Flow
    U->>FE: Enter credentials (Login)
    FE->>BE: POST /api/v1/user/login
    BE->>DB: Find user by email
    alt User not found
        DB-->>BE: No user
        BE-->>FE: 401 - Invalid credentials
        FE-->>U: Show error message
    else User found
        DB-->>BE: User data
        BE->>BE: Compare password (bcrypt)
        alt Password invalid
            BE-->>FE: 401 - Invalid credentials
            FE-->>U: Show error message
        else Password valid
            BE->>JWT: Generate token
            JWT-->>BE: JWT token
            BE->>BE: Set HTTP-only cookie
            BE-->>FE: 200 - User data + token
            FE->>AC: Store user in context
            FE-->>U: Redirect to Dashboard
        end
    end

    Note over U,JWT: Logout Flow
    U->>FE: Click logout
    FE->>BE: POST /api/v1/user/logout
    BE->>BE: Clear JWT cookie
    BE-->>FE: 200 - Success
    FE->>AC: Clear user context
    FE-->>U: Redirect to Login
```

---

## CSV Upload & Processing Flow

```mermaid
flowchart TD
    A[User selects CSV file] --> B{File validation}
    B -->|Invalid| C[Show error message]
    B -->|Valid CSV| D[Upload file to server]
    
    D --> E[Multer middleware processes upload]
    E --> F[Save to uploads directory]
    
    F --> G[Calculate SHA-256 checksum]
    G --> H[Create FileUpload record]
    H --> I[Set status: 'processing']
    
    I --> J[Parse CSV with csv-parser]
    J --> K[Clean & validate data]
    
    K --> L{For each row}
    L --> M[Check duplicate transaction_id]
    
    M -->|Duplicate| N[Increment duplicate count]
    M -->|New| O[Process transaction]
    
    O --> P[Find or create Vendor]
    P --> Q[Find or create Department]
    Q --> R[Create Payment record]
    R --> S[Create Transaction record]
    
    S --> T{More rows?}
    T -->|Yes| L
    T -->|No| U[Update FileUpload stats]
    
    U --> V[Calculate statistics]
    V --> W[totalRows, validRows, newTransactions, duplicates, rejected]
    
    W --> X[Set status: 'completed']
    X --> Y[Update processingCompletedAt]
    
    Y --> Z[Return response to frontend]
    Z --> AA[Display upload results]
    
    N --> T
    
    style A fill:#e1f5ff
    style Z fill:#c8e6c9
    style C fill:#ffcdd2
    style X fill:#c8e6c9
```
---

## Risk Analysis Flow

```mermaid
flowchart TD
    A[User clicks 'Run Risk Analysis'] --> B[Frontend sends GET request]
    B --> C[Backend: /api/v1/admin/uploads/:fileId/analysis]
    
    C --> D[Fetch all transactions for fileId]
    D --> E[Transform to AI service format]
    
    E --> F[Send POST to Flask AI service]
    F --> G[Flask: /analyze endpoint]
    
    G --> H[Load transactions into Pandas DataFrame]
    H --> I[Data preprocessing & cleaning]
    
    I --> J[Calculate department statistics]
    J --> K[dept_mean, dept_std per department]
    
    K --> L[Calculate vendor frequency]
    L --> M[vendor_dept_count per vendor-dept pair]
    
    M --> N[Apply risk scoring rules]
    
    N --> O[Rule 1: Amount > 2× dept_mean +30]
    O --> P[Rule 2: Vendor appears >3 times +20]
    P --> Q[Rule 3: Month-end transaction +15]
    Q --> R[Rule 4: Statistical outlier +25]
    
    R --> S[Clip risk score max=100]
    S --> T[Categorize: Low<40, Medium<70, High≥70]
    
    T --> U[Generate detailed analytics]
    
    U --> V1[Department-wise Analysis]
    U --> V2[Vendor-wise Analysis]
    U --> V3[Time Series Analysis]
    U --> V4[Payment Mode Analysis]
    U --> V5[Risk Distribution]
    U --> V6[Statistical Summary]
    
    V1 --> W[Aggregate by department]
    V2 --> X[Top 20 vendors by amount]
    V3 --> Y[Daily transaction patterns]
    V4 --> Z[Payment mode statistics]
    V5 --> AA[High/Medium/Low counts]
    V6 --> AB[Total, avg, median metrics]
    
    W --> AC[Compile complete analytics response]
    X --> AC
    Y --> AC
    Z --> AC
    AA --> AC
    AB --> AC
    
    AC --> AD[Return JSON to Backend]
    AD --> AE[Backend forwards to Frontend]
    
    AE --> AF[Frontend displays visualizations]
    AF --> AG[Render charts with Recharts]
    
    AG --> AH[Pie Chart: Risk Distribution]
    AG --> AI[Bar Charts: Departments]
    AG --> AJ[Bar Charts: Vendors]
    AG --> AK[Line/Area Charts: Timeline]
    AG --> AL[Tables: High-risk transactions]
    
    style A fill:#e1f5ff
    style AF fill:#c8e6c9
    style N fill:#fff9c4
    style U fill:#f3e5f5
```

### Risk Scoring Algorithm Detail

```mermaid
graph LR
    A[Transaction] --> B{Amount > 2× dept_mean?}
    B -->|Yes| C[+30 points]
    B -->|No| D[Continue]
    C --> E{Vendor count > 3?}
    D --> E
    
    E -->|Yes| F[+20 points]
    E -->|No| G[Continue]
    F --> H{Month-end transaction?}
    G --> H
    
    H -->|Yes| I[+15 points]
    H -->|No| J[Continue]
    I --> K{Amount > mean + 2×std?}
    J --> K
    
    K -->|Yes| L[+25 points]
    K -->|No| M[Continue]
    L --> N[Clip score ≤ 100]
    M --> N
    
    N --> O{Score categorization}
    O -->|0-39| P[Low Risk]
    O -->|40-69| Q[Medium Risk]
    O -->|70-100| R[High Risk]
    
    style C fill:#ffcdd2
    style F fill:#ffcdd2
    style I fill:#ffcdd2
    style L fill:#ffcdd2
    style P fill:#c8e6c9
    style Q fill:#fff9c4
    style R fill:#ffcdd2
```

---

## Data Visualization Flow

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend Component
    participant State as React State
    participant API as Backend API
    participant AI as Flask AI Service

    Note over U,AI: Initial Page Load
    U->>FE: Navigate to Transaction Details
    FE->>API: GET /api/v1/admin/uploads/:fileId
    API-->>FE: File metadata
    FE->>State: Store file info
    
    FE->>API: GET /api/v1/admin/uploads/:fileId/transactions
    API-->>FE: Paginated transactions
    FE->>State: Store transactions
    FE-->>U: Display transaction table

    Note over U,AI: Analysis Trigger
    U->>FE: Click 'Run Risk Analysis'
    FE->>State: Set analyzing=true
    FE->>API: GET /api/v1/admin/uploads/:fileId/analysis
    
    API->>API: Fetch all transactions
    API->>AI: POST /analyze (transactions data)
    
    AI->>AI: Process & analyze data
    AI->>AI: Generate analytics
    AI-->>API: Complete analytics response
    
    API-->>FE: Analysis results + analytics
    FE->>State: Store analysis data
    FE->>State: Set activeTab='overview'
    
    Note over U,AI: Visualization Rendering
    FE->>FE: Render Analytics Header
    FE->>FE: Render Key Metrics Cards
    FE->>FE: Render Tab Navigation
    
    alt Overview Tab
        FE->>FE: Render Pie Chart (Risk Distribution)
        FE->>FE: Render Statistical Summary
        FE->>FE: Render Payment Mode Bar Chart
    else Department Tab
        FE->>FE: Render Transaction Volume Chart
        FE->>FE: Render Risk Score Chart
        FE->>FE: Render Risk Distribution Chart
    else Vendor Tab
        FE->>FE: Render Top Vendors Chart
        FE->>FE: Render Vendor Risk Profile
        FE->>FE: Render Vendor Statistics Table
    else Timeline Tab
        FE->>FE: Render Daily Volume Area Chart
        FE->>FE: Render Count & Risk Line Chart
        FE->>FE: Render Month-End Comparison
    else Transactions Tab
        FE->>FE: Render Top 50 High-Risk List
    end
    
    FE-->>U: Display interactive visualizations
    
    Note over U,AI: User Interaction
    U->>FE: Switch tabs / Hover charts
    FE->>FE: Update active tab
    FE->>FE: Show tooltips
    FE-->>U: Update visualization view
```

---


## API Request Flow

```mermaid
flowchart TD
    A[HTTP Request] --> B{Authentication Required?}
    B -->|Yes| C[JWT Token Verification]
    B -->|No| D[Public Route Handler]
    
    C --> E{Token Valid?}
    E -->|No| F[401 Unauthorized]
    E -->|Yes| G{Admin Only Route?}
    
    G -->|Yes| H{User Role = admin?}
    G -->|No| I[Route Handler]
    
    H -->|No| J[403 Forbidden]
    H -->|Yes| I
    
    I --> K{Route Type}
    
    K -->|Upload| L[Multer Middleware]
    K -->|Query| M[Direct to Controller]
    K -->|Analysis| N[Controller to AI Service]
    
    L --> O[Upload Controller]
    M --> P[Query Controller]
    N --> Q[Analysis Controller]
    
    O --> R[Process CSV]
    P --> S[Database Query]
    Q --> T[Flask AI Request]
    
    R --> U[Database Operations]
    S --> U
    T --> V[AI Processing]
    
    U --> W[Format Response]
    V --> W
    
    W --> X[Send JSON Response]
    
    F --> Y[Error Response]
    J --> Y
    D --> I
    
    style F fill:#ffcdd2
    style J fill:#ffcdd2
    style X fill:#c8e6c9
    style Y fill:#ffcdd2
```

### Middleware Chain

```mermaid
graph LR
    A[Request] --> B[Express]
    B --> C[CORS Middleware]
    C --> D[JSON Body Parser]
    D --> E[Cookie Parser]
    E --> F{Protected Route?}
    
    F -->|No| G[Route Handler]
    F -->|Yes| H[protect Middleware]
    
    H --> I{JWT Valid?}
    I -->|No| J[401 Error]
    I -->|Yes| K{Admin Route?}
    
    K -->|No| G
    K -->|Yes| L[adminOnly Middleware]
    
    L --> M{User is admin?}
    M -->|No| N[403 Error]
    M -->|Yes| G
    
    G --> O{File Upload?}
    O -->|Yes| P[Multer Middleware]
    O -->|No| Q[Controller]
    
    P --> Q
    Q --> R[Response]
    
    style J fill:#ffcdd2
    style N fill:#ffcdd2
    style R fill:#c8e6c9
```
---

## Analytics Calculation Flow

```mermaid
graph TD
    A[Transaction Data] --> B[Load into Pandas DataFrame]
    
    B --> C[Data Preprocessing]
    C --> D[Convert amounts to numeric]
    C --> E[Parse dates]
    C --> F[Set boolean flags]
    
    D --> G[Calculate Department Statistics]
    E --> G
    F --> G
    
    G --> H[Group by department]
    H --> I[dept_mean = mean amount]
    H --> J[dept_std = std deviation]
    
    I --> K[Calculate Vendor Frequency]
    J --> K
    
    K --> L[Group by department + vendor]
    L --> M[vendor_dept_count = transaction count]
    
    M --> N[Merge statistics back to main DataFrame]
    
    N --> O[Apply Risk Rules]
    
    O --> P1[Rule 1: High Amount]
    O --> P2[Rule 2: Frequent Vendor]
    O --> P3[Rule 3: Month-End]
    O --> P4[Rule 4: Statistical Outlier]
    
    P1 --> Q[Sum risk scores]
    P2 --> Q
    P3 --> Q
    P4 --> Q
    
    Q --> R[Clip scores to 0-100]
    R --> S[Categorize risk levels]
    
    S --> T[Calculate Analytics]
    
    T --> U1[Department Analytics]
    T --> U2[Vendor Analytics]
    T --> U3[Time Series]
    T --> U4[Payment Mode]
    T --> U5[Risk Distribution]
    T --> U6[Statistical Summary]
    
    U1 --> V[Aggregate by department<br/>sum, mean, median, count]
    U2 --> W[Sort vendors by total amount<br/>Take top 20]
    U3 --> X[Group by date<br/>Calculate daily metrics]
    U4 --> Y[Group by payment mode<br/>Calculate statistics]
    U5 --> Z[Count by risk level]
    U6 --> AA[Overall statistics]
    
    V --> AB[Compile Complete Response]
    W --> AB
    X --> AB
    Y --> AB
    Z --> AB
    AA --> AB
    
    AB --> AC[Return JSON]
    
    style A fill:#e1f5ff
    style AC fill:#c8e6c9
    style O fill:#fff9c4
```

