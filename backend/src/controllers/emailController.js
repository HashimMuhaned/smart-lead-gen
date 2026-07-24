const pool = require("../db");
const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const updateEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, body } = req.body;

    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Subject and body are required",
      });
    }

    const query = `
      UPDATE emails
      SET 
        subject = $1,
        body = $2,
        updated_at = NOW()
      WHERE id = $3
      RETURNING id, subject, body, updated_at;
    `;

    const result = await pool.query(query, [subject, body, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Email not found",
      });
    }

    res.json({
      success: true,
      message: "Email updated successfully",
      email: result.rows[0],
    });
  } catch (error) {
    console.error("Update Email Error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Regenerate / Paraphrase Email Content
 * POST /api/emails/:id/regenerate
 */
const regenerateEmail = async (req, res) => {
  const buildParaphrasePrompt = (originalEmail, instructions = "") => {
    return `You are an expert email copywriter. Your task is to paraphrase and optimize an existing email to make it more engaging, persuasive, and clear, while preserving the original intent.

Original Email:
"""
${originalEmail}
"""

${instructions ? `Additional Tone/Style Instructions: ${instructions}` : ""}

Please output a JSON object strictly matching this schema:
{
  "subject": "An engaging, concise subject line for the paraphrased email",
  "body": "The complete paraphrased email body text with proper line breaks"
}`;
  };
  try {
    const { id } = req.params;

    // Safely default req.body in case no payload is sent
    const { customInstructions = "" } = req.body || {};

    // 1. Fetch existing email
    const emailResult = await pool.query(
      `
  SELECT id, subject, body
  FROM emails
  WHERE id = $1
  `,
      [id],
    );

    if (emailResult.rows.length === 0) {
      return res.status(404).json({
        error: "Email not found",
      });
    }

    const email = emailResult.rows[0];
    if (!email) {
      return res.status(404).json({ error: "Email not found" });
    }

    // 2. Build prompt
    const prompt = buildParaphrasePrompt(
      email.body || email.content,
      customInstructions,
    );

    // 3. Call Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 800,
      },
    });

    const generatedData = JSON.parse(response.text);
    console.log("Generated Email Data:", generatedData);

    const updatedResult = await pool.query(
      `
  UPDATE emails
  SET
    subject = $1,
    body = $2,
    updated_at = NOW()
  WHERE id = $3
  RETURNING *;
  `,
      [generatedData.subject, generatedData.body, id],
    );
    console.log("Updated Email Result:", updatedResult);
    return res.status(200).json({
      message: "Email successfully regenerated and saved",
      data: updatedResult.rows[0],
    });
  } catch (error) {
    console.error("Error regenerating email:", error);
    return res.status(500).json({
      error: "Failed to regenerate email",
      details: error.message,
    });
  }
};
module.exports = { updateEmail, regenerateEmail };
