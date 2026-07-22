import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import LeadDiscovery from "@/pages/LeadDiscovery";
import Businesses from "@/pages/Businesses";
import BusinessDetails from "@/pages/BusinessDetails";
import AIAnalysis from "@/pages/AIAnalysis";
import EmailCampaigns from "@/pages/EmailCampaigns";
import Templates from "@/pages/Templates";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Businesses />} />
        <Route path="/discovery" element={<LeadDiscovery />} />
        {/* <Route path="/businesses" element={<Businesses />} /> */}
        <Route path="/businesses/:id" element={<BusinessDetails />} />
        {/* <Route path="/analysis" element={<AIAnalysis />} /> */}
        {/* <Route path="/campaigns" element={<EmailCampaigns />} /> */}
        {/* <Route path="/templates" element={<Templates />} /> */}
        {/* <Route path="/analytics" element={<Analytics />} /> */}
        {/* <Route path="/settings" element={<Settings />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
