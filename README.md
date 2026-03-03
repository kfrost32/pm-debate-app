# PM Debate App

A React application that simulates multi-agent PM debates to evaluate Product Requirements Documents (PRDs). Built with React, TypeScript, Tailwind CSS, and the Anthropic Claude API.

## Features

- **Split-panel interface**: PRD input on the left, live debate chat on the right
- **Real-time streaming**: Watch agents respond in real-time as they debate
- **Configurable debates**: Choose 1-5 rounds and select 1-4 agents
- **Three default agents**:
  - **MAYA** (Enterprise PM): Focus on data modeling, scalability, and long-term maintenance
  - **DEREK** (Growth PM): Focus on adoption, retention, and usage loops
  - **PRIYA** (Technical PM): Focus on LLM reliability, cost, and production risks
- **Optional fourth agent**:
  - **JULIAN** (Customer-facing PM): Focus on customer value and field workflows
- **Synthesis & recommendations**: Final summary with consensus, disagreements, and actionable improvements
- **Export functionality**: Download complete debate transcript as markdown
- **Resizable panels**: Drag to adjust the split between PRD and debate views

## Getting Started

### Prerequisites

- Node.js 18+
- An Anthropic API key ([get one here](https://console.anthropic.com/))

### Installation

```bash
npm install
```

### Configuration

You can provide your Anthropic API key in two ways:

**Option 1: Environment Variable (Recommended)**

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
VITE_ANTHROPIC_API_KEY=your_api_key_here
```

**Option 2: In-App Input**

Enter your API key in the settings bar at the top of the app. It will be stored in localStorage.

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
npm run build
```

## Usage

1. **Configure your API key** (see Configuration section above)
2. **Paste your PRD** in the left panel
3. **Configure the debate** (optional):
   - Click the settings icon to adjust rounds (default: 2)
   - Select which agents to include (default: Maya, Derek, Priya)
4. **Click "Start Debate"** to begin
5. **Watch the conversation** unfold in real-time on the right
6. **Review the summary** when complete
7. **Export the results** as a markdown file

## Architecture

- **React + TypeScript**: Type-safe component architecture
- **Anthropic SDK**: Streaming API integration with Claude Sonnet 4.5
- **Tailwind CSS**: Utility-first styling
- **Vite**: Fast build tooling

### Key Components

- `SplitView`: Resizable two-panel layout
- `PrdPanel`: PRD text input area
- `DebatePanel`: Chat-style conversation display
- `SettingsBar`: Configuration controls
- `AgentMessage`: Individual agent response with avatar
- `TypingIndicator`: Animated "thinking" state
- `SynthesisModal`: Final recommendations overlay

### Core Logic

- `agents.ts`: Agent personas and system prompts
- `debate.ts`: Orchestration logic with streaming support
- Event-driven architecture for real-time UI updates

## Agent Personas

Each agent brings a unique perspective:

- **Maya** asks: "Will this break in 6 months?"
- **Derek** asks: "Will anyone actually use this?"
- **Priya** asks: "What happens when this breaks in production?"
- **Julian** asks: "Does this actually matter to customers?"

## Technical Details

- Agents see full conversation history and respond to each other
- Streaming responses provide real-time feedback
- Synthesis agent reviews complete debate transcript
- All API calls use Claude Sonnet 4.5
- Client-side API integration (API key required in browser)

## Security Note

This app makes API calls directly from the browser using `dangerouslyAllowBrowser: true`. Your API key is stored in localStorage. For production use, consider implementing a backend proxy to secure API keys.

## License

MIT
