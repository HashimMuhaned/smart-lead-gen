const axios = require("axios");

async function startCampaignWorkflow(payload) {
  console.log("Sending to n8n:");
  console.log(JSON.stringify(payload, null, 2));

  return axios.post(
    "https://n8nselfhostedautomations.tech/webhook-test/campaign/start",
    payload,
  );
}

module.exports = {
  startCampaignWorkflow,
};
