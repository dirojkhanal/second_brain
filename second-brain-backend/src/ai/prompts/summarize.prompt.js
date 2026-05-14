export const buildSummarizePrompt = (title, content) => `
You are a knowledge management assistant. Summarize the following note accurately and concisely.

Title: ${title}

Content:
${content}

Rules:
- Write 2-4 sentences maximum
- Capture the main idea and the most important points
- Use present tense and active voice
- Do NOT start with phrases like "This note", "The author", or "The text"
- Return ONLY the summary text — no labels, no formatting, no explanation

Summary:`.trim();
