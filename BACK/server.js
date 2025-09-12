import express from "express";
import dotenv from "dotenv";
import path from "path";
import OpenAI from "openai";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Vérif clé Perplexity pour le bot IA
if (!process.env.PPLX_API_KEY) {
  console.error("PPLX_API_KEY manquante dans .env");
  process.exit(1);
}

// Client OpenAI compatible Perplexity
const client = new OpenAI({
  apiKey: process.env.PPLX_API_KEY,
  baseURL: "https://api.perplexity.ai"
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "Public")));

// Transport SMTP (Gmail via App Password) - CORRIGÉ
let transporter = null;
try {
  transporter = nodemailer.createTransport({ // CORRECTION ICI
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: (process.env.SMTP_PASS || "").replace(/\s+/g, "")
    },
    logger: true,
    debug: true
  });

  transporter.verify((err, ok) => {
    if (err) {
      console.error("SMTP verify failed:", err);
    } else {
      console.log("SMTP ready:", ok);
    }
  });
} catch (e) {
  console.error("SMTP init error:", e);
  transporter = null;
}

// Santé
app.get("/health", (_req, res) => res.json({ ok: true }));

// Bot IA /ask - CORRIGÉ
app.post("/ask", async (req, res) => {
  try {
    const question = (req.body && req.body.question) ? String(req.body.question) : "";
    if (!question.trim()) {
      return res.status(400).json({ error: "Question requise" });
    }

    console.log("ASK received:", question.slice(0, 50));

    const resp = await client.chat.completions.create({
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: `
Tu es l'assistant recrutement du portfolio de Pendy Glenn Aster. Tes réponses doivent s'appuyer EXCLUSIVEMENT sur les informations ci‑dessous (CV + portfolio). Interdiction de donner des définitions générales (ex: définir « diplôme »). Si une information n'est pas listée, dis-le et propose un échange. Réponds en 2–4 phrases, ton professionnel, positif, orienté alternance.

Contexte & disponibilité
- Basé à Saint‑Ouen‑sur‑Seine (Île‑de‑France). Disponible pour une alternance (4 jours entreprise / 1 jour formation) sur 2025–2027. Télétravail/hybride possibles selon le poste.
- Objectifs: développement web front / intégration IA • ou technicien support IT (N1/N2).

Parcours diplômant (pour les questions « diplôme ? », « niveau ? », « études ? »)
- Diplôme obtenu: Baccalauréat Scientifique (2022) — Lycée privé Awassi.
- Enseignement supérieur: L1 Commerce (2023–2024) — EGC Normandie; L1 Informatique (2024–2025) — Université de Caen. À ce jour: pas encore de diplôme universitaire validé; compétences et expériences acquises en projets réels.
- En formation: Bachelor Développement Web (ISCOD, 2025–2027) en alternance.

Expériences / réalisations
- CESAM (2025): charte graphique complète, logo 3D, supports visuels commerciaux, site web.
- Prospection — Unia Suisse: vente directe, phoning, terrain, négociation.
- 2024 — Stage SARL Harel Suret: vente, accompagnement clients, devis personnalisés, relationnel.
- Projets: sites vitrine/e‑commerce; contenus IA (Runway Gen‑3 Alpha) pour acquisition/monétisation.

Compétences (mots‑clés pour recruteurs)
- Web front: HTML5, CSS3, JavaScript (ES6+), responsive design, accessibilité, SEO de base.
- Outillage dev: Git/GitHub, npm, Node/Express (bases), APIs REST (consommation front), JSON, fetch.
- UI/Branding: logos 3D, chartes graphiques, flyers; pipeline créa → livrables web/print.
- IA/créa: Runway Gen‑3 Alpha (génération vidéo), workflows de prompts; exploration ElevenLabs, Veo3; intégrations simples dans des projets web.
- Support IT: Windows (install/config de base), Office (Word/Excel/PowerPoint), réseau local (IP/DHCP/Wi‑Fi de base), helpdesk N1 (prise en main, pédagogie).
- Soft skills: esprit d'équipe, autonomie, discipline. Langues: Français, Anglais.

Règles de réponse (prioritaires)
- Disponibilité: si on demande "disponible ?" → répondre explicitement "Oui, disponible pour une alternance (4j entreprise/1j formation)" + proposer un échange de 15 min et demander un bref descriptif (mission, stack/outils, rythme, lieu).
- "Diplôme ? / niveau ? / études ?" → ne pas définir les termes; répondre directement avec: Bac S obtenu; L1 Commerce; L1 Informatique; pas de diplôme universitaire encore validé; en cours: Bachelor Dév Web (ISCOD).
- Adaptation: si question dev web → mettre en avant HTML/CSS/JS, responsive, Git, Node/Express (bases), intégration IA; si technicien IT → mettre en avant support N1, Windows/Office, réseau local de base, pédagogie.
- Hors périmètre (actu générale, infos privées) → expliquer que tu couvres uniquement les infos du portfolio/CV et proposer un échange si pertinent.
- Pas d'invention: si une techno précise n'est pas listée, le dire et proposer d'évaluer l'adéquation en call.

Contact & call‑to‑action
- Email: pendyglennaster@email.com — Téléphone: 06 24 69 08 55 — Localisation: Saint‑Ouen‑sur‑Seine.
- Proposer systématiquement: "Un échange de 15 minutes est possible cette semaine pour cadrer mission, stack et rythme d'alternance."
`
        },
        { role: "user", content: question }
      ],
      temperature: 0.2,
      max_tokens: 300
    });

    console.log("API response received");

    // Extraction correcte du contenu
    const choices = resp && Array.isArray(resp.choices) ? resp.choices : [];
    const first = choices.length > 0 ? choices[0] : null;
    const msg = first && first.message ? first.message : null;
    const answer = msg && typeof msg.content === "string" ? msg.content : "";

    console.log("Extracted answer:", answer ? "present" : "empty");

    if (!answer.trim()) {
      console.error("ASK empty answer payload");
    }
    return res.json({ answer });
  } catch (e) {
    const status = e && e.response && e.response.status ? e.response.status : 500;
    const payload = e && e.response && e.response.data ? e.response.data : (e && e.message ? e.message : "Erreur serveur");
    console.error("ASK error:", status, payload);
    const code = (status === 401 || status === 429) ? status : 500;
    return res.status(code).json({ error: payload });
  }
});

// Contact: envoi + accusé
app.post('/api/contact', async (req, res) => {
  try {
    const name = (req.body && req.body.name) ? String(req.body.name) : "";
    const email = (req.body && req.body.email) ? String(req.body.email) : "";
    const subject = (req.body && req.body.subject) ? String(req.body.subject) : "";
    const message = (req.body && req.body.message) ? String(req.body.message) : "";
    if (!name.trim() || !email.trim() || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Champs requis manquants' });
    }

    if (!transporter) {
      return res.status(503).json({ ok: false, error: "SMTP non initialisé" });
    }

    const brand = process.env.BRAND_NAME || 'Portfolio';
    const toBox = process.env.CONTACT_TO || process.env.SMTP_USER;

    // 1) Email interne
    const info1 = await transporter.sendMail({
      from: `"${name}" <${process.env.SMTP_USER}>`,
      replyTo: email,
      to: toBox,
      subject: `[Portfolio] ${subject || 'Nouveau message'}`,
      text: `De: ${name} <${email}>\n\n${message}`
    });

    // 2) Accusé
    const info2 = await transporter.sendMail({
      from: `"${brand}" <${process.env.SMTP_USER}>`,
      to: email,
      replyTo: toBox,
      subject: `Accusé de réception — ${brand}`,
      text:
`Bonjour ${name},

Ton message a bien été reçu. Réf: ${Date.now()}.
Résumé: ${subject || 'Contact'} — ${message.slice(0, 200)}

— ${brand}`
    });

    console.log('Sent internal:', info1 && info1.messageId ? info1.messageId : "", 'Ack:', info2 && info2.messageId ? info2.messageId : "");
    return res.json({ ok: true });
  } catch (e) {
    console.error('contact send error:', e);
    return res.status(500).json({ ok: false, error: (e && e.message) ? e.message : String(e) });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré: http://localhost:${PORT}`);
});
