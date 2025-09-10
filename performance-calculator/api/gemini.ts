// api/gemini.ts

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Only POST allowed", { status: 405 });
  }

  const { prompt } = await req.json();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("Missing Gemini API key", { status: 500 });
  }

  const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

  const response = await fetch(`${geminiUrl}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  const data = await response.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
