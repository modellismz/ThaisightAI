# ThaisightAI - Advanced Agentic Survey Platform

ThaisightAI is a modern, enterprise-grade survey platform designed to deliver premium user experiences and deep insights. Built with a focus on scalability, type safety, and developer experience, it enables the creation of complex, logic-driven surveys with an intuitive drag-and-drop interface.

## 🚀 Why We Built This

Traditional survey tools often fall into two categories: simple but limited, or powerful but clunky. ThaisightAI bridges this gap by providing:
- **Consumer-Grade UX**: A "premium" feel that engages respondents and increases completion rates.
- **Developer-Grade Logic**: Complex branching, jumping, and carry-forward logic that powers sophisticated research.
- **Scalability First**: Architecture designed to handle millions of responses without degradation.

## ✨ Key Features

### 1. Advanced Survey Builder
- **Drag-and-Drop Canvas**: Intuitively reorder questions and blocks with smooth animations (`@dnd-kit`).
- **Rich Question Types**: Support for Single/Multi Choice, Matrix Tables, NPS, Sliders, Ranking, Open Text, and Date/Time.
- **Block-Based Logic**: Organize questions into logical blocks for better flow management.
- **Real-Time Preview**: WYSIWYG editor showing exactly what respondents will see.
- **Draft & Publish System**: Version control for surveys (Draft vs. Published/Immutable states).

### 2. Powerful Survey Engine (`@repo/survey-engine`)
- **Pure Functional Core**: The logic engine is separated from the UI, ensuring 100% testability and consistency.
- **Complex Routing**: Supports "Skip Logic" (hide/show) and "Jump Logic" (skip to block) based on previous answers.
- **State Management**: Robust session tracking for partial completions and ensuring data integrity.

### 3. Management Dashboard
- **Survey Listings**: Grid view of all surveys with status indicators (Draft, Published, Closed).
- **CRUD Operations**: Complete management including deep-cloning (duplication) of complex surveys.
- **Context Menus**: Quick access to analytics, preview, and sharing options.

### 4. Analytics & Insights
- **Real-Time Dashboard**: See response counts and completion rates instantly.
- **Visualizations**: Automatic bar charts for choices, NPS score calculation, and average computations.
- **Data Export**: Full CSV export capability for external analysis.
- **Responsiveness**: Fully responsive design for viewing analytics on mobile or desktop.

## 🛠 Tech Stack & Architecture

We chose a modern, type-safe stack to ensure maintainability and performance.

### Monorepo Structure (Turborepo)
- **`apps/web`**: Next.js 14+ (App Router) frontend. Handles the Builder, Runner, and Dashboard.
- **`apps/api`**: Node.js/Express server. Handles complex business logic and database interactions.
- **`packages/shared`**: Shared Zod schemas and TypeScript types. Ensures the frontend and backend always agree on data structures.
- **`packages/survey-engine`**: The logic brain. A standalone package that can be used in any environment (web, mobile, server).

### Backend & Data
- **node.js & Express**: For a robust, high-performance API layer.
- **tRPC**: For end-to-end type safety between frontend and backend. No more API contract drifts.
- **PostgreSQL**: The gold standard for relational data. Used for structured survey data and responses.
- **Redis**: For high-speed caching and session management.
- **Drizzle ORM**: Lightweight and type-safe SQL query builder.

### Frontend
- **React 18 & Next.js**: For server-side rendering (SEO) and static generation performance.
- **Zustand**: For simple, scalable client-side state management (Builder state).
- **TanStack Query (React Query)**: For managing asynchronous server state and caching.
- **CSS Modules**: For scoped, maintainable styling without style conflicts.

## 🐳 Why Docker?

We started with Docker to ensure **reproducibility** and **scalability**.
1.  **Dev/Prod Parity**: The environment you run locally is identical to production. No "it works on my machine" issues.
2.  **Instant Setup**: New developers can spin up the entire stack (Postgres, Redis, MinIO, API, Web) with a single command: `docker compose up`.
3.  **Scalability**:
    *   **Stateless Services**: The API and Web apps are stateless containerized services.
    *   **Horizontally Scalable**: You can easily spin up 10 instances of the API container behind a load balancer to handle high traffic.
    *   **Microservices Ready**: The containerized architecture allows us to easily split the "Survey Runner" or "Analytics Worker" into separate services in the future if specific scaling needs arise.

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm or pnpm

### Running Locally

1.  **Start Infrastructure Services**
    ```bash
    docker compose up -d
    ```
    This starts PostgreSQL, Redis, and MinIO.

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Initialize Database**
    ```bash
    # Push schema to DB
    npm run db:push --prefix apps/api
    ```

4.  **Start Development Servers**
    ```bash
    # Run both web and api in parallel
    npm run dev
    ```

5.  **Access the App**
    *   Web App: `http://localhost:3000`
    *   API: `http://localhost:4000`
    *   Studio (DB GUI): `https://local.drizzle.studio` (if configured)

## 📈 Scalability Roadmap

1.  **Read/Write Splitting**: As read traffic (survey takers) grows, we can use Read Replicas for PostgreSQL.
2.  **Queue-Based Processing**: For massive distinct bursts (e.g., sending 1M emails), we will introduce a message queue (RabbitMQ/Redis Streams) and separate worker containers.
3.  **CDN & Edge**: Serve the static "Survey Runner" assets from the Edge to reduce latency for global respondents.

---
© 2026 ThaisightAI. Built for scalability.
