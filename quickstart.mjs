import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.CHEAPER_INFERENCE_API_KEY,
  baseURL: "https://api.cheaperinference.com/v1",
});

const response = await client.chat.completions.create({
  model: "claude-fable-5.1",
  messages: [{ role: "user", content: "Hello!" }],
});
console.log(response.choices[0].message.content);