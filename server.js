import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
dotenv.config();

const app = express();
app.use(cors());
app.options("*", cors());
app.use(express.json());
app.use(
  "/audio",
  express.static(path.join(process.cwd(), "public", "audio"))
);

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("TraumNest backend çalışıyor");
});
app.post("/story", async (req, res) 
 => {
  try {
    const { childName, theme, keywords } = req.body;
    const audioDir = path.join(process.cwd(), "public", "audio");
    fs.mkdirSync(audioDir, { recursive: true });
    const prompt = `
Erstelle ein liebevolles deutsches Einschlafmärchen für ein Kind.

Name des Kindes: ${childName}
Thema: ${theme}
Stichwörter: ${keywords}

Gib die Antwort AUSSCHLIESSLICH als JSON zurück:
{
  "title": "Titel der Geschichte",
  "storyText": "Die komplette Geschichte als Text"
}
`;

    // 1) STORY TEXT üret
    const storyResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const raw = storyResp.choices?.[0]?.message?.content || "{}";
    const storyJson = JSON.parse(raw);

    const title = storyJson.title || "TraumNest Story";
    const storyText = storyJson.storyText || "";

    // 2) MP3 üret (OpenAI TTS)
    // voice seçenekleri: alloy, verse, aria, nova (birini seç)
    const ttsResp = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      format: "mp3",
      input: `${title}\n\n${storyText}`
    });

    // 3) MP3 dosyasını kaydet
    const audioDir = 
path.join(process.cwd(), "public", "audio");
fs.mkdirSync(audioDir, { recursive: true });

const safeName = `${Date.now()}_${(childName || "child").replace(/[^a-z0-9_-]/gi, "")}.mp3`;
const outPath = path.join(audioDir, safeName);

    const buffer = Buffer.from(await ttsResp.arrayBuffer());
    fs.writeFileSync(outPath, buffer);

    // 4) Telefonun erişeceği URL
    const baseUrl = `https://${req.get("host")}`;// örn: http://192.168.0.150:3000
    const audioUrl = `${baseUrl}/audio/${safeName}`;

    // 5) FlutterFlow'a dön
    res.json({
      success: true,
      childName,
      title,
      storyText,
      audioUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: String(err) });
  }
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend çalışıyor: http://localhost:${PORT}`);
});