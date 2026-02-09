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

    const prompt =
`Erstelle ein liebevolles deutsches Einschlafmärchen für ein Kind.

Name des Kindes: ${childName}
Thema: ${theme}
Stichwörter: ${keywords}

Gib die Antwort AUSSCHLIESSLICH als JSON zurück:
{"title":"Titel der Geschichte","storyText":"Die komplette Geschichte als Text"}`;

    return res.json({ success: true, promptPreview: prompt });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend çalışıyor: ${PORT}`);
});