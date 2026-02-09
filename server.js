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
    const { childName, theme, keywords } = req.body;

    const safeName = `${Date.now()}-${(childName || "child")}.mp3`;

    // devam...
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success:false, error: String(err) });
  }
});
   const prompt = `
Erstelle ein liebevolles deutsches Einschlafmärchen für ein Kind.
{
  "title": "Titel der Geschichte",
  "storyText": "Die komplette Geschichte als Text"
}
`;
    // 1️⃣ Masal metni üret
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "user", content: prompt }
      ]
    });

    const storyJson = JSON.parse(completion.choices[0].message.content);
    const storyText = storyJson.storyText;
    const title = storyJson.title;

    // ŞİMDİLİK sadece text dönelim
   // return res.json({
   //   success: true,
   //   title,
   //   storyText
  //  });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      error: String(err)
    });
  }
});


// 2️⃣ MP3 dosya adı
const safeName = `${Date.now()}-${childName || "child"}.mp3`;
const outPath = path.join(audioDir, safeName);

// 3️⃣ TTS → MP3 üret
const speech = await client.audio.speech.create({
  model: "gpt-4o-mini-tts",
  voice: "alloy",
  input: storyText,
});

const buffer = Buffer.from(await speech.arrayBuffer());
fs.writeFileSync(outPath, buffer);

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