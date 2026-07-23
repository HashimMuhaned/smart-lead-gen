// backend/controllers/contactController.js

exports.insertContactsBulk = async (req, res) => {
  const { businessId, contacts } = req.body;

  if (!businessId || !Array.isArray(contacts)) {
    return res.status(400).json({
      success: false,
      message: "Missing businessId or contacts array.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let insertedCount = 0;

    if (contacts.length > 0) {
      for (const contact of contacts) {
        await client.query(
          `
          INSERT INTO contacts (
            business_id, first_name, last_name, job_title, 
            email, phone, linkedin_url, source, confidence_score, enrichment_status, enrichment_source
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completed', 'serpapi_linkedin')
          `,
          [
            businessId,
            contact.firstName || null,
            contact.lastName || null,
            contact.jobTitle || null,
            contact.email || null,
            contact.phone || null,
            contact.linkedinUrl || null,
            contact.source || "serpapi_linkedin",
            contact.confidenceScore || 75,
          ]
        );
        insertedCount++;
      }
    }

    // Advance business workflow status to 'enriched' regardless of contact count
    await client.query(
      `
      UPDATE businesses 
      SET workflow_status = 'enriched' 
      WHERE id = $1
      `,
      [businessId]
    );

    await client.query("COMMIT");

    // Proceed to website analysis phase
    dispatchWebsiteAnalysis(businessId);

    res.json({
      success: true,
      inserted: insertedCount,
      businessId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk Contact Insertion Error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    client.release();
  }
};