# 🚀 GroqCLI 🤖⚡

Instead of opening ChatGPT, copy-pasting code, creating files, and wiring things together manually.

You just chat with your terminal, and it writes + organizes the whole project for you.
That’s exactly what I built using Groq’s SDK. Similar to other CLI like Cursor CLI, etc.

This can work with all models available in Groq. You just need your API Key to use this. By default it is using OpenAI Open source model(openai/gpt-oss-120b)

🔧 What it does:
Opens an interactive chat in your terminal
You type something like:
“create a simple react todo application”
The AI responds not just with text, but with tool calls (structured JSON)
Tools handle: <br />
✅ Creating multiple files (package.json, App.jsx, etc.) <br />
✅ Organizing them into a project folder <br />
✅ Suggesting commands to run (like npm i && npm run dev) <br />

Supports different models with a simple flag (--model)

You can pass your API key directly (--key)

# HOW_TO_RUN

`groqchat --key <YOUR_GROQ_API_KEY> --model openai/gpt-oss-120b`

`endchat` - to end the chat session
