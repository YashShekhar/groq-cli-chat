#!/usr/bin/env node
import fs from "fs";
import path from "path";
import chalk from "chalk";
import readline from "readline";
import { Groq } from "groq-sdk";

// CLI args
const args = process.argv.slice(2);
const apiKey = getArgValue("--key") || process.env.GROQ_API_KEY;
const model = getArgValue("--model") || "openai/gpt-oss-120b";
const projectName = getArgValue("--project") || "my-app";

if (!apiKey) {
    console.error(chalk.red("❌ No API key provided. Use --key or set GROQ_API_KEY"));
    process.exit(1);
}

const groq = new Groq({ apiKey });
const projectDir = path.join(process.cwd(), projectName);
fs.mkdirSync(projectDir, { recursive: true });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function getArgValue(flag) {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : null;
}

// === Tool Runner ===
function runTool(toolCall) {
    const { tool, args } = toolCall;

    try {
        if (tool === "createFiles") {
            args.files.forEach((file) => {
                const fullPath = path.join(projectDir, file.path);
                fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                fs.writeFileSync(fullPath, file.content, "utf-8");
                console.log(chalk.yellow(`📝 Created file: ${fullPath}`));
            });
        } else if (tool === "appendFile") {
            const fullPath = path.join(projectDir, args.path);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.appendFileSync(fullPath, "\n" + args.content, "utf-8");
            console.log(chalk.yellow(`✏️ Updated file: ${fullPath}`));
        } else if (tool === "showCommand") {
            console.log(chalk.magenta(`💻 Run this command:\n${args.command}`));
        }
    } catch (err) {
        console.error(chalk.red("Tool Error:"), err.message);
    }
}

// === Streaming Chat ===
async function chat() {
    console.log(chalk.green(`\n🤖 Groq Assistant (${model})`));
    console.log(chalk.blue(`Project folder: ${projectDir}\n`));

    const baseMessages = [
        {
            role: "system",
            content: `
You are a coding assistant for CLI apps.
Rules:
- If user requests file creation or updates, respond ONLY with a JSON object.
- For multiple files, always use the tool: "createFiles".
- JSON format for multiple files:
{
  "tool": "createFiles",
  "args": {
    "files": [
      { "path": "src/index.js", "content": "console.log('Hello');" },
      { "path": "package.json", "content": "{ \\"name\\": \\"demo\\" }" }
    ]
  }
}
- For appending/updating a single file:
{ "tool": "appendFile", "args": { "path": "...", "content": "..." } }
- For commands to run:
{ "tool": "showCommand", "args": { "command": "npm install" } }
- No extra commentary outside JSON.
      `,
        },
    ];

    while (true) {
        const prompt = await new Promise((res) => rl.question(chalk.cyan("You: "), res));
        if (prompt.trim().toLowerCase() === "endchat") {
            console.log(chalk.green("👋 Chat ended."));
            process.exit(0);
        }

        try {
            const stream = await groq.chat.completions.create({
                model,
                messages: [...baseMessages, { role: "user", content: prompt }],
                stream: true,
            });

            process.stdout.write(chalk.yellow("\nAssistant: "));

            let buffer = "";
            for await (const chunk of stream) {
                const delta = chunk.choices[0]?.delta?.content || "";
                if (!delta) continue;

                buffer += delta;
                process.stdout.write(delta);

                // Try parse full JSON
                if (buffer.trim().startsWith("{") && buffer.trim().endsWith("}")) {
                    try {
                        const toolCall = JSON.parse(buffer);
                        runTool(toolCall);
                        buffer = "";
                    } catch (_) {
                        // keep buffering
                    }
                }
            }
            console.log("\n");
        } catch (err) {
            console.error(chalk.red("Error:"), err.message);
        }
    }
}

chat();
