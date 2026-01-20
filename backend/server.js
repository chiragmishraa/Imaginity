import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// serve extracted models
app.use("/models", express.static("public/models"));

app.get("/api/getModel", async (req, res) => {
  try {
    const q = req.query.q;
    if (!q) return res.status(400).json({ error: "Missing q" });

    // ✅ IMPORTANT: build base URL dynamically (works on other devices)
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // 1) Search Sketchfab
    const searchUrl = `https://api.sketchfab.com/v3/search?type=models&q=${encodeURIComponent(
      q,
    )}&downloadable=true&sort_by=-likeCount`;

    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: `Token ${process.env.SKETCHFAB_TOKEN}` },
    });

    const searchData = await searchRes.json();

    if (!searchData.results?.length) {
      return res.status(404).json({ error: "No models found" });
    }

    const chosen = searchData.results[0];
    const uid = chosen.uid;

    // 2) Download info
    const downloadApiUrl = `https://api.sketchfab.com/v3/models/${uid}/download`;

    const downloadRes = await fetch(downloadApiUrl, {
      headers: { Authorization: `Token ${process.env.SKETCHFAB_TOKEN}` },
    });

    const downloadData = await downloadRes.json();

    const zipUrl = downloadData.gltf?.url;
    if (!zipUrl) {
      return res.status(403).json({ error: "No downloadable glTF zip found" });
    }

    // 3) Local folder for model
    const modelDir = path.join("public", "models", uid);
    const zipPath = path.join(modelDir, "model.zip");

    // already extracted?
    if (fs.existsSync(modelDir)) {
      const files = fs.readdirSync(modelDir, { recursive: true });
      const gltfFile = files.find((f) => f.endsWith(".gltf"));

      if (gltfFile) {
        return res.json({
          query: q,
          uid,
          name: chosen.name,
          localGltfUrl: `${baseUrl}/models/${uid}/${gltfFile}`,
        });
      }
    }

    fs.mkdirSync(modelDir, { recursive: true });

    // 4) Download zip file
    const zipFileRes = await fetch(zipUrl);
    const arrayBuffer = await zipFileRes.arrayBuffer();
    fs.writeFileSync(zipPath, Buffer.from(arrayBuffer));

    // 5) Extract zip
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(modelDir, true);

    // 6) Find .gltf file
    const extractedFiles = fs.readdirSync(modelDir, { recursive: true });
    const gltfFile = extractedFiles.find((f) => f.endsWith(".gltf"));

    if (!gltfFile) {
      return res.status(500).json({ error: "Extracted zip but no .gltf found" });
    }

    return res.json({
      query: q,
      uid,
      name: chosen.name,
      localGltfUrl: `${baseUrl}/models/${uid}/${gltfFile}`,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.listen(3001, "0.0.0.0", () => {
  console.log("✅ Backend running on port 3001");
});
