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

// statik audio
app.use("/audio", express.static(path.join(process.cwd(), "public", "audio")));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get("/", (req, res) => res.send("TraumNest backend çalışıyor"));

app.post("/story", async (req, res) => {
  try {
    // 1️⃣ Body’den gelenler
    const { childName, theme, keywords } = req.body;

    // 2️⃣ Prompt
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

    // 3️⃣ Metni üret
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const storyJson = JSON.parse(
      completion.choices[0].message.content
    );

    const { title, storyText } = storyJson;

    // 4️⃣ MP3 dosya adı (⚠️ childName artık TANIMLI)
    const audioDir = path.join(process.cwd(), "public", "audio");
    fs.mkdirSync(audioDir, { recursive: true });

    const safeName = `${Date.now()}-${childName || "child"}.mp3`;
    const outPath = path.join(audioDir, safeName);

    // 5️⃣ TTS → MP3
    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: storyText,
    });

    const buffer = Buffer.from(await speech.arrayBuffer());
    fs.writeFileSync(outPath, buffer);

    // 6️⃣ Response
    return res.json({
      success: true,
      title,
      storyText,
      audioUrl: `/audio/${safeName}`,
    });

  } catch (err) {
    console.error("STORY ERROR:", err);
    return res.status(500).json({
      success: false,
      error: String(err),
    });
  }
});
// 4️⃣ MP3 URL
const baseUrl = `https://${req.get("host")}`;
const audioUrl = `${baseUrl}/audio/${safeName}`;

// 5️⃣ FlutterFlow’a dön
res.json({
  success: true,
  title,
  storyText,
  audioUrl
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend çalışıyor: ${PORT}`);
});