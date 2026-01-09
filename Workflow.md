# SmartGov.AI - Complete System Workflow Documentation

This document provides comprehensive workflow diagrams for all major processes in the SmartGov.AI government audit analytics platform.

## Table of Contents
1. [System Architecture](#system-architecture)
2. [User Authentication Flow](#user-authentication-flow)
3. [CSV Upload & Processing Flow](#csv-upload--processing-flow)
4. [Risk Analysis Flow](#risk-analysis-flow)
5. [Data Visualization Flow](#data-visualization-flow)
6. [Database Schema Relationships](#database-schema-relationships)
7. [API Request Flow](#api-request-flow)
8. [Frontend Navigation Flow](#frontend-navigation-flow)

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

### Detailed CSV Processing Steps

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend
    participant API as Express API
    participant Multer as Multer Middleware
    participant CSV as CSV Parser
    participant DB as MongoDB
    participant FS as File System

    U->>FE: Select & upload CSV file
    FE->>API: POST /api/v1/admin/upload (FormData)
    API->>Multer: Process file upload
    Multer->>FS: Save file to /uploads
    FS-->>Multer: File path
    Multer-->>API: req.file object
    
    API->>FS: Calculate checksum (SHA-256)
    FS-->>API: Checksum hash
    
    API->>DB: Create FileUpload document
    DB-->>API: FileUpload ID
    
    API->>CSV: Parse CSV file
    
    loop For each CSV row
        CSV->>API: Row data
        API->>API: Clean & validate data
        
        API->>DB: Check if transaction exists
        DB-->>API: Exists/Not exists
        
        alt Transaction exists
            API->>API: Increment duplicate counter
        else New transaction
            API->>DB: Find/Create Vendor
            DB-->>API: Vendor document
            
            API->>DB: Find/Create Department
            DB-->>API: Department document
            
            API->>DB: Create Payment
            DB-->>API: Payment document
            
            API->>DB: Create Transaction
            DB-->>API: Transaction document
            
            API->>API: Increment new transaction counter
        end
    end
    
    CSV-->>API: Parsing complete
    
    API->>DB: Update FileUpload stats
    DB-->>API: Updated document
    
    API-->>FE: Upload results (stats, file info)
    FE-->>U: Display success & statistics
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

## Database Schema Relationships

```mermaid
erDiagram
    USER ||--o{ FILE_UPLOAD : uploads
    FILE_UPLOAD ||--o{ TRANSACTION : contains
    TRANSACTION ||--|| PAYMENT : has
    TRANSACTION ||--|| VENDOR : references
    TRANSACTION ||--|| DEPARTMENT : belongs_to
    
    USER {
        ObjectId _id PK
        string email UK
        string password
        string role
        boolean isActive
        datetime createdAt
        datetime updatedAt
    }
    
    FILE_UPLOAD {
        ObjectId _id PK
        string filename
        string originalName
        string path
        number size
        string mimeType
        ObjectId uploadedBy FK
        string checksum UK
        string status
        object stats
        datetime processingStartedAt
        datetime processingCompletedAt
        datetime createdAt
        datetime updatedAt
    }
    
    TRANSACTION {
        ObjectId _id PK
        string transaction_id UK
        date transactionDate
        ObjectId payment FK
        ObjectId vendor FK
        ObjectId department FK
        string purpose
        string financialYear
        number month
        boolean isMonthEnd
        ObjectId fileUpload FK
        datetime createdAt
        datetime updatedAt
    }
    
    PAYMENT {
        ObjectId _id PK
        string payment_uid UK
        number amount
        string paymentMode
        datetime createdAt
        datetime updatedAt
    }
    
    VENDOR {
        ObjectId _id PK
        string name
        string vendor_id UK
        datetime createdAt
        datetime updatedAt
    }
    
    DEPARTMENT {
        ObjectId _id PK
        string name UK
        datetime createdAt
        datetime updatedAt
    }
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

## Frontend Navigation Flow

```mermaid
stateDiagram-v2
    [*] --> Login: Initial Load
    
    Login --> Register: Click Register
    Register --> Login: Click Login
    
    Login --> Dashboard: Successful Auth
    
    state Dashboard {
        [*] --> StatsView
        StatsView --> QuickActions
        QuickActions --> RecentUploads
    }
    
    Dashboard --> Upload: Click Upload
    Dashboard --> History: Click History
    Dashboard --> Logout: Click Logout
    
    state Upload {
        [*] --> FileSelection
        FileSelection --> FileUploaded: Select File
        FileUploaded --> Processing: Click Upload
        Processing --> Success: Upload Complete
        Success --> FileSelection: Upload Another
    }
    
    Upload --> TransactionDetails: View Transactions
    Upload --> Dashboard: Back to Dashboard
    
    state History {
        [*] --> UploadsList
        UploadsList --> SearchFilter
        SearchFilter --> PaginatedView
    }
    
    History --> TransactionDetails: Click Upload
    History --> Dashboard: Back to Dashboard
    
    state TransactionDetails {
        [*] --> TransactionsTable
        TransactionsTable --> AnalysisView: Run Analysis
        
        state AnalysisView {
            [*] --> Overview
            Overview --> DepartmentAnalysis: Click Tab
            Overview --> VendorAnalysis: Click Tab
            Overview --> TimelineAnalysis: Click Tab
            Overview --> HighRiskTransactions: Click Tab
            
            DepartmentAnalysis --> Overview: Click Tab
            VendorAnalysis --> Overview: Click Tab
            TimelineAnalysis --> Overview: Click Tab
            HighRiskTransactions --> Overview: Click Tab
            
            DepartmentAnalysis --> VendorAnalysis: Click Tab
            VendorAnalysis --> TimelineAnalysis: Click Tab
            TimelineAnalysis --> HighRiskTransactions: Click Tab
        }
    }
    
    TransactionDetails --> History: Back to History
    TransactionDetails --> Dashboard: Back to Dashboard
    
    Logout --> Login: Auth Cleared
```

---

## Complete End-to-End Flow

```mermaid
sequenceDiagram
    autonumber
    
    participant User
    participant Browser
    participant React
    participant AuthContext
    participant ExpressAPI
    participant MongoDB
    participant FlaskAI
    participant FileSystem
    
    Note over User,FileSystem: 1. Authentication Phase
    User->>Browser: Enter credentials
    Browser->>React: Submit login form
    React->>ExpressAPI: POST /api/v1/user/login
    ExpressAPI->>MongoDB: Verify credentials
    MongoDB-->>ExpressAPI: User data
    ExpressAPI->>ExpressAPI: Generate JWT
    ExpressAPI-->>React: Token + User info
    React->>AuthContext: Store user context
    React-->>Browser: Navigate to Dashboard
    Browser-->>User: Show Dashboard
    
    Note over User,FileSystem: 2. File Upload Phase
    User->>Browser: Select CSV file
    Browser->>React: File selected
    User->>Browser: Click upload
    React->>ExpressAPI: POST /upload (FormData)
    ExpressAPI->>FileSystem: Save CSV file
    FileSystem-->>ExpressAPI: File path
    ExpressAPI->>ExpressAPI: Calculate checksum
    ExpressAPI->>MongoDB: Create FileUpload record
    MongoDB-->>ExpressAPI: FileUpload ID
    
    Note over User,FileSystem: 3. CSV Processing Phase
    ExpressAPI->>FileSystem: Read & parse CSV
    loop For each row
        FileSystem-->>ExpressAPI: Row data
        ExpressAPI->>MongoDB: Check duplicate
        MongoDB-->>ExpressAPI: Duplicate status
        alt New transaction
            ExpressAPI->>MongoDB: Create Vendor/Dept/Payment
            MongoDB-->>ExpressAPI: Created records
            ExpressAPI->>MongoDB: Create Transaction
            MongoDB-->>ExpressAPI: Transaction created
        end
    end
    ExpressAPI->>MongoDB: Update FileUpload stats
    MongoDB-->>ExpressAPI: Updated record
    ExpressAPI-->>React: Upload results
    React-->>Browser: Show success + stats
    Browser-->>User: Display results
    
    Note over User,FileSystem: 4. Analysis Request Phase
    User->>Browser: Click 'Run Analysis'
    React->>ExpressAPI: GET /uploads/:id/analysis
    ExpressAPI->>MongoDB: Fetch all transactions
    MongoDB-->>ExpressAPI: Transaction data
    ExpressAPI->>ExpressAPI: Transform to AI format
    ExpressAPI->>FlaskAI: POST /analyze
    
    Note over User,FileSystem: 5. AI Processing Phase
    FlaskAI->>FlaskAI: Load into DataFrame
    FlaskAI->>FlaskAI: Calculate dept statistics
    FlaskAI->>FlaskAI: Calculate vendor frequency
    FlaskAI->>FlaskAI: Apply risk rules
    FlaskAI->>FlaskAI: Generate analytics
    FlaskAI->>FlaskAI: Dept/Vendor/Time analysis
    FlaskAI-->>ExpressAPI: Complete analytics
    
    Note over User,FileSystem: 6. Visualization Phase
    ExpressAPI-->>React: Analysis + Analytics
    React->>React: Update state
    React->>React: Render charts (Recharts)
    React-->>Browser: Interactive visualizations
    Browser-->>User: Display analytics dashboard
    
    Note over User,FileSystem: 7. User Interaction Phase
    User->>Browser: Switch tabs / Hover charts
    Browser->>React: Handle events
    React->>React: Update active view
    React-->>Browser: Re-render components
    Browser-->>User: Updated visualization
```

---

## Technology Stack Flow

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React 19.2.0] --> B[React Router 7.12.0]
        A --> C[Framer Motion 12.24.12]
        A --> D[Recharts 3.6.0]
        A --> E[Axios 1.13.2]
        A --> F[Lucide React Icons]
        G[Vite 7.2.4] --> A
        H[Tailwind CSS 3.4.18] --> A
    end
    
    subgraph "Backend Layer"
        I[Node.js + Express] --> J[Mongoose 8.x]
        I --> K[Multer - File Upload]
        I --> L[JWT - Authentication]
        I --> M[Bcrypt - Password Hash]
        I --> N[CSV Parser]
        I --> O[Axios - HTTP Client]
    end
    
    subgraph "AI Layer"
        P[Flask 3.x] --> Q[Pandas]
        P --> R[NumPy]
        P --> S[Python 3.x]
    end
    
    subgraph "Database Layer"
        T[MongoDB Atlas] --> U[User Collection]
        T --> V[Transaction Collection]
        T --> W[Vendor Collection]
        T --> X[Department Collection]
        T --> Y[Payment Collection]
        T --> Z[FileUpload Collection]
    end
    
    subgraph "File Storage"
        AA[Local File System] --> AB[uploads/ directory]
        AB --> AC[CSV Files]
    end
    
    A -->|HTTP/REST| I
    I -->|MongoDB Driver| T
    I -->|HTTP| P
    I -->|Read/Write| AA
    
    style A fill:#61dafb
    style I fill:#68a063
    style P fill:#ffde57
    style T fill:#4db33d
```

---

## Error Handling Flow

```mermaid
flowchart TD
    A[Request Received] --> B{Try Block}
    B -->|Success| C[Process Request]
    B -->|Error Thrown| D{Error Type}
    
    D -->|Validation Error| E[400 Bad Request]
    D -->|Auth Error| F[401 Unauthorized]
    D -->|Permission Error| G[403 Forbidden]
    D -->|Not Found| H[404 Not Found]
    D -->|Server Error| I[500 Internal Server Error]
    
    C --> J{Result Check}
    J -->|Success| K[Format Success Response]
    J -->|Failure| D
    
    E --> L[Error Middleware]
    F --> L
    G --> L
    H --> L
    I --> L
    
    L --> M[Log Error]
    M --> N[Send Error Response]
    
    K --> O[Send Success Response]
    
    N --> P[Frontend Error Handler]
    O --> Q[Frontend Success Handler]
    
    P --> R[Display Error Toast/Alert]
    Q --> S[Update UI State]
    
    style E fill:#ffcdd2
    style F fill:#ffcdd2
    style G fill:#ffcdd2
    style H fill:#ffcdd2
    style I fill:#ffcdd2
    style K fill:#c8e6c9
    style O fill:#c8e6c9
```

---

## Performance Optimization Flow

```mermaid
graph TD
    A[User Request] --> B{Cached Data?}
    B -->|Yes| C[Return Cached Response]
    B -->|No| D[Process Request]
    
    D --> E{Database Query?}
    E -->|Yes| F[Use Indexes]
    E -->|No| G[Continue Processing]
    
    F --> H[Optimize Query]
    H --> I[Pagination]
    I --> J[Field Selection]
    
    G --> K{Large Dataset?}
    J --> K
    
    K -->|Yes| L[Stream Processing]
    K -->|No| M[Normal Processing]
    
    L --> N[Chunk Data]
    M --> O[Process Complete]
    N --> O
    
    O --> P[Cache Result]
    P --> Q[Return Response]
    C --> Q
    
    Q --> R{Frontend Optimization}
    R --> S[Lazy Loading]
    R --> T[Code Splitting]
    R --> U[Memoization]
    R --> V[Virtual Scrolling]
    
    style C fill:#c8e6c9
    style Q fill:#c8e6c9
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Frontend Deployment"
            A[Vercel/Netlify] --> B[CDN Distribution]
            B --> C[Static Assets]
            C --> D[React SPA]
        end
        
        subgraph "Backend Deployment"
            E[Node.js Server] --> F[PM2 Process Manager]
            F --> G[Express API]
            G --> H[Load Balancer]
        end
        
        subgraph "AI Service Deployment"
            I[Flask Server] --> J[Gunicorn]
            J --> K[Python Workers]
        end
        
        subgraph "Database"
            L[MongoDB Atlas] --> M[Replica Set]
            M --> N[Primary Node]
            M --> O[Secondary Nodes]
        end
        
        subgraph "File Storage"
            P[Cloud Storage] --> Q[S3/Azure Blob]
            Q --> R[CSV Files]
        end
    end
    
    D -->|HTTPS| G
    G -->|HTTPS| K
    G -->|MongoDB Driver| L
    G -->|SDK| P
    
    style A fill:#00c7b7
    style E fill:#68a063
    style I fill:#ffde57
    style L fill:#4db33d
    style P fill:#ff9900
```

---

## Security Flow

```mermaid
flowchart TD
    A[HTTP Request] --> B{HTTPS Enabled?}
    B -->|No| C[Redirect to HTTPS]
    B -->|Yes| D{CORS Check}
    
    D -->|Invalid Origin| E[403 Forbidden]
    D -->|Valid| F{Authentication Required?}
    
    F -->|No| G[Public Route]
    F -->|Yes| H{JWT Token Present?}
    
    H -->|No| I[401 Unauthorized]
    H -->|Yes| J[Verify JWT Signature]
    
    J -->|Invalid| K[401 Invalid Token]
    J -->|Valid| L{Token Expired?}
    
    L -->|Yes| M[401 Token Expired]
    L -->|No| N{Admin Required?}
    
    N -->|No| O[Authorize User]
    N -->|Yes| P{User Role = admin?}
    
    P -->|No| Q[403 Forbidden]
    P -->|Yes| O
    
    O --> R{File Upload?}
    R -->|Yes| S[Validate File Type]
    R -->|No| T[Process Request]
    
    S -->|Invalid| U[400 Invalid File]
    S -->|Valid| V[Check File Size]
    
    V -->|Too Large| W[413 File Too Large]
    V -->|Valid| X[Virus Scan]
    
    X -->|Infected| Y[400 Malicious File]
    X -->|Clean| T
    
    T --> Z[Sanitize Input]
    Z --> AA[Execute Logic]
    AA --> AB[Return Response]
    
    G --> T
    
    style E fill:#ffcdd2
    style I fill:#ffcdd2
    style K fill:#ffcdd2
    style M fill:#ffcdd2
    style Q fill:#ffcdd2
    style U fill:#ffcdd2
    style W fill:#ffcdd2
    style Y fill:#ffcdd2
    style AB fill:#c8e6c9
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

---

## Monitoring & Logging Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant Logger as Logger Service
    participant Console as Console
    participant File as Log Files
    participant Monitor as Monitoring Service
    
    Note over App,Monitor: Request Logging
    App->>Logger: Log incoming request
    Logger->>Console: Output to console
    Logger->>File: Write to access.log
    
    Note over App,Monitor: Processing
    App->>App: Process request
    
    alt Success
        App->>Logger: Log success
        Logger->>File: Write to success.log
        Logger->>Monitor: Update metrics (success)
    else Error
        App->>Logger: Log error with stack trace
        Logger->>Console: Output error
        Logger->>File: Write to error.log
        Logger->>Monitor: Update metrics (error)
        Monitor->>Monitor: Check error rate
        alt Critical error rate
            Monitor->>Monitor: Trigger alert
        end
    end
    
    Note over App,Monitor: Performance Monitoring
    App->>Monitor: Send performance metrics
    Monitor->>Monitor: Calculate response time
    Monitor->>Monitor: Calculate throughput
    
    Note over App,Monitor: Resource Monitoring
    App->>Monitor: CPU usage
    App->>Monitor: Memory usage
    App->>Monitor: Database connections
    
    Monitor->>Monitor: Aggregate metrics
    Monitor->>Monitor: Generate dashboards
```

---

## Future Enhancements Flow

```mermaid
mindmap
  root((SmartGov.AI<br/>Future Features))
    Machine Learning
      Advanced Anomaly Detection
      Predictive Analytics
      Pattern Recognition
      Automated Flagging
    Real-time Processing
      WebSocket Integration
      Live Dashboard Updates
      Streaming Analytics
      Real-time Alerts
    Enhanced Security
      Two-Factor Authentication
      Role-Based Access Control
      Audit Trail
      Data Encryption
    Reporting
      PDF Report Generation
      Scheduled Reports
      Custom Report Builder
      Export to Excel
    Integration
      Government APIs
      Third-party Tools
      Webhook Support
      REST API Documentation
    Scalability
      Microservices Architecture
      Container Orchestration
      Caching Layer
      Message Queue
    User Experience
      Dark/Light Theme Toggle
      Mobile App
      Accessibility Features
      Multi-language Support
```

---

## Summary

This workflow documentation provides a comprehensive view of the SmartGov.AI platform's architecture, data flows, and operational processes. The system is designed with:

- **Security-first approach**: JWT authentication, role-based access control, and data validation
- **Scalable architecture**: Modular design with separate frontend, backend, and AI services
- **Robust error handling**: Comprehensive error checking and graceful failure recovery
- **Performance optimization**: Pagination, caching, and efficient database queries
- **User-centric design**: Intuitive UI with interactive visualizations and clear feedback

The platform successfully combines modern web technologies (React, Node.js, Flask) with advanced analytics to provide government auditors with powerful tools for detecting financial anomalies and generating actionable insights.
