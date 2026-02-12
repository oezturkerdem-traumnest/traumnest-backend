import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// statik audio (Railway uyumlu)
const audioDir = path.join(process.cwd(), "public", "audio");
await fs.promises.mkdir(audioDir, { recursive: true });
app.use("/audio", express.static(audioDir));

const speech = await client.audio.speech.create({
  model: "gpt-4o-mini-tts",
  voice: "alloy",
  input: storyText
});

const buffer = Buffer.from(await speech.arrayBuffer());

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/", (req, res) => res.send("TraumNest backend çalışıyor"));

app.post("/story", async (req, res) => {
  try {
    const { childName, theme, keywords } = req.body || {};

    const prompt = `
Erstelle ein liebevolles deutsches Einschlafmärchen für ein Kind.

Name des Kindes: ${childName || ""}
Thema: ${theme || ""}
Stichwörter: ${keywords || ""}

Gib die Antwort AUSSCHLIESSLICH als JSON zurück:
{"title":"Titel der Geschichte","storyText":"Die komplette Geschichte als Text"}
`.trim();

    // 1) Masal metni üret
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const content = completion?.choices?.[0]?.message?.content || "{}";

    let storyJson;
    try {
      storyJson = JSON.parse(content);
    } catch (e) {
      // JSON parse patlarsa fallback
      storyJson = { title: "Geschichte", storyText: content };
    }

    const title = storyJson.title || "Geschichte";
    const storyText = storyJson.storyText || "";

    // 2) MP3 dosya adı (SADECE route içinde!)
const safeName = `${Date.now()}-${(childName || "child").replace(/[^a-z0-9_-]/gi, "")}.mp3`;

// MP3 klasörü + path
const audioDir = path.join(process.cwd(), "public", "audio");
await fs.promises.mkdir(audioDir, { recursive: true });
const outPath = path.join(audioDir, safeName);

// TTS üret (MP3)
const speech = await client.audio.speech.create({
  model: "gpt-4o-mini-tts",
  voice: "alloy",
  input: storyText,
  format: "mp3",
});

// Dosyaya yaz
const buffer = Buffer.from(await speech.arrayBuffer());
await fs.promises.writeFile(outPath, buffer);

// audioUrl üret
const baseUrl = `https://${req.get("host")}`;
const audioUrl = `${baseUrl}/audio/${safeName}`;
// FlutterFlow’a dön
return res.json({
  success: true,
  title,
  storyText,
  audioUrl,
  fileName: safeName,
});
 