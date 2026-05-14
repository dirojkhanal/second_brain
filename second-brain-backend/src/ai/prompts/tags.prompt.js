export const buildTagsPrompt = (title, content) => `
You are a knowledge management assistant. Generate relevant tags for the following note.

Title: ${title}

Content:
${content}

Rules:
- Return between 3 and 8 tags
- Tags must be specific and meaningful (avoid generic words like "note", "text", "content")
- Use lowercase only; single words or short hyphenated phrases (e.g., "machine-learning", "react-hooks")
- Focus on: topics, technologies, concepts, and domains present in the note
- Return ONLY a valid JSON array of strings — no explanation, no markdown code blocks

Example output: ["javascript", "async-await", "error-handling", "promises"]

Tags:`.trim();
