const pool = require("../db");

exports.updateEmail = async (req, res) => {
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