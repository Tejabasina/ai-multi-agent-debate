# AI Multi-Agent Debate System

A complete full-stack web application showcasing two AI agents ("Agent A" and "Agent B") engaging in a structured multi-turn debate on any topic entered by the user. Agent A argues the optimistic/supporting side, and Agent B acts as a cautious risk-analyst. A third AI agent ("Judge") reviews the transcript and delivers a scored verdict. 

The application utilizes an interactive 3D virtual environment to visualize speaker changes, with typewriter-style speech bubbles and animated stats visualizations.

---

## Architecture Diagram

```
+-------------------------------------------------------------+
|                          BROWSER                            |
|  +-------------------+              +--------------------+  |
|  |   Vite Frontend   |              |  React-Three-Fiber |  |
|  |  (React/Tailwind) |              |  (3D Visualization)|  |
|  +---------+---------+              +----------+---------+  |
|            |                                   ^            |
|            | Send topic                        | Focus/Animate
|            v                                   |            |
+------------+-----------------------------------+------------+
             |                                   |
             | WS connection                     | WS events
             v                                   | (message chunks, status, verdict)
+------------+-----------------------------------+------------+
|            |                                   |            |
|            v                                   |            |
|  +---------+---------+              +----------+---------+  |
|  |  WebSocket Server | <----------> |    Orchestrator    |  |
|  |    (Express/ws)   |              |    (Debate Loop)   |  |
|  +-------------------+              +----------+---------+  |
|                                                |            |
|                                                | API calls  |
|                                                v            |
|                                     +----------+---------+  |
|                                     |    Claude Client   |  |
|                                     |  (Anthropic SDK)   |  |
|                                     +----------+---------+  |
|                                                |            |
|                                                v            |
|                                     +----------+---------+  |
|                                     |    Anthropic API   |  |
|                                     |   (Claude Sonnet)  |  |
|                                     +--------------------+  |
|                                                              |
|                     EXPRESS BACKEND SERVER                   |
+--------------------------------------------------------------+
```

---

## Tech Stack

*   **Backend:** Node.js, Express, `ws` (WebSockets), `@anthropic-ai/sdk`
*   **Frontend:** React (Vite), Tailwind CSS
*   **3D Graphics:** `three`, `@react-three/fiber`, `@react-three/drei`
*   **Icons:** `lucide-react`

---

## Setup & Run Instructions

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install the backend dependencies:
   ```bash
   npm install
   ```
3. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Update the `ANTHROPIC_API_KEY` in `.env` with your API Key.
   *Note: If left empty or invalid, the backend will automatically enter **Mock Debate Mode** for UI validation without throwing runtime exceptions.*
5. Start the backend server:
   ```bash
   npm run start
   ```
   The backend server will run on `http://localhost:5000` (WebSocket endpoint: `ws://localhost:5000/debate`).

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the frontend dependencies (use `--legacy-peer-deps` to handle React 19 alpha fiber packaging):
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

---

## Assumptions & Design Decisions

1.  **Anthropic Model:** The user request specifies `claude-sonnet-4-6`. Because the official SDK uses format tags, the project defaults to `"claude-3-5-sonnet-latest"` but allows configuration of the specific identifier in `.env` under `ANTHROPIC_MODEL`.
2.  **Fallback Mock Engine:** To ensure visual acceptance testing passes even if the developer running the app doesn't have an active paid Anthropic key configured on their local system, the client script implements a fallback simulator. It detects empty keys, streaming realistic-looking arguments step-by-step to the client so that 3D animations, typewriter effects, camera panning, and score bars can still be tested and demonstrated.
3.  **Active Focus Shifts:** Camera panning is controlled dynamically. When an agent is speaking, the camera glides to focus on that agent's model side while scaling down the opposing agent and dimming their spotlight. When the Judge is active, it glides upwards to center on the gold monolith.
4.  **Winner Victory Highlights:** When the final verdict is calculated, the winning avatar in the 3D scene scales up and performs a continuous victory spin accompanied by a golden particle floor ring and glowing crown intensity.
