export const buildInsightsPrompt = (title, content) => `
You are a knowledge management assistant. Extract the key insights and actionable takeaways from the following note.

Title: ${title}

Content:
${content}

Rules:
- Extract between 3 and 7 key insights
- Each insight must be a complete, self-contained sentence (1-2 sentences maximum)
- Focus on: main conclusions, actionable items, important facts, and key learnings
- Skip vague, obvious, or filler statements
- Return ONLY a valid JSON array of strings — no explanation, no markdown code blocks

Example output: ["JWT tokens should be stored in httpOnly cookies to prevent XSS attacks", "Refresh tokens enable long-lived sessions without embedding sensitive data in the access token"]

Key Insights:`.trim();
