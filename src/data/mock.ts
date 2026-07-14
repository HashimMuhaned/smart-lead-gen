import type { SearchRun, Campaign, EmailTemplate, AnalyticsPoint, LeadQualityPoint } from "@/types";

export const searchRuns: SearchRun[] = [
  {
    id: "s-001",
    industry: "Dental Clinics",
    location: "Dubai, UAE",
    leadsFound: 500,
    status: "Completed",
    startedAt: "2026-07-10 09:12",
    filters: ["Has Website", "Google Rating ≥ 4.0"],
  },
  {
    id: "s-002",
    industry: "Restaurants",
    location: "Dubai, UAE",
    leadsFound: 300,
    status: "Processing",
    startedAt: "2026-07-13 08:40",
    filters: ["Has Website", "Has Email"],
  },
  {
    id: "s-003",
    industry: "Car Rentals",
    location: "Abu Dhabi, UAE",
    leadsFound: 210,
    status: "Completed",
    startedAt: "2026-07-08 14:03",
    filters: ["Review Count ≥ 50"],
  },
  {
    id: "s-004",
    industry: "Real Estate",
    location: "Dubai, UAE",
    leadsFound: 180,
    status: "Failed",
    startedAt: "2026-07-06 11:20",
    filters: ["Has Website", "Company Size: 10-50"],
  },
  {
    id: "s-005",
    industry: "Medical Clinics",
    location: "Sharjah, UAE",
    leadsFound: 145,
    status: "Completed",
    startedAt: "2026-07-01 10:00",
    filters: ["Has Email", "Google Rating ≥ 4.2"],
  },
];

export const campaigns: Campaign[] = [
  {
    id: "c-001",
    name: "Dubai Dental Outreach",
    industry: "Dental Clinics",
    location: "Dubai, UAE",
    leads: 500,
    sent: 450,
    opened: 144,
    replies: 12,
    meetings: 4,
    status: "Running",
    createdAt: "2026-07-01",
  },
  {
    id: "c-002",
    name: "Marina Restaurants Wave 1",
    industry: "Restaurants",
    location: "Dubai Marina",
    leads: 300,
    sent: 280,
    opened: 96,
    replies: 9,
    meetings: 2,
    status: "Running",
    createdAt: "2026-07-05",
  },
  {
    id: "c-003",
    name: "Car Rentals — Abu Dhabi",
    industry: "Car Rentals",
    location: "Abu Dhabi, UAE",
    leads: 210,
    sent: 210,
    opened: 58,
    replies: 6,
    meetings: 1,
    status: "Completed",
    createdAt: "2026-06-18",
  },
  {
    id: "c-004",
    name: "Real Estate Follow-up Q3",
    industry: "Real Estate",
    location: "Dubai, UAE",
    leads: 180,
    sent: 0,
    opened: 0,
    replies: 0,
    meetings: 0,
    status: "Draft",
    createdAt: "2026-07-12",
  },
  {
    id: "c-005",
    name: "Medical Clinics Sharjah",
    industry: "Medical Clinics",
    location: "Sharjah, UAE",
    leads: 145,
    sent: 145,
    opened: 51,
    replies: 8,
    meetings: 1,
    status: "Paused",
    createdAt: "2026-06-25",
  },
];

export const emailTemplates: EmailTemplate[] = [
  {
    id: "t-001",
    name: "Dental Clinic AI Receptionist",
    industry: "Dental Clinics",
    useCase: "Online booking + reminders pitch",
    subject: "Helping {{clinic_name}} improve patient bookings",
    preview:
      "I noticed your clinic has excellent reviews but your website doesn't currently offer online appointment scheduling...",
    timesUsed: 214,
    replyRate: 8.4,
    updatedAt: "2026-07-02",
  },
  {
    id: "t-002",
    name: "Restaurant Customer Automation",
    industry: "Restaurants",
    useCase: "Reservations + review automation",
    subject: "A quick win for {{restaurant_name}}'s weekend bookings",
    preview:
      "Your reviews are fantastic, but reservations still go through phone calls only — that usually means missed tables on busy nights...",
    timesUsed: 168,
    replyRate: 6.1,
    updatedAt: "2026-06-28",
  },
  {
    id: "t-003",
    name: "Car Rental Booking System",
    industry: "Car Rentals",
    useCase: "Instant quote automation",
    subject: "Cut {{company_name}}'s quote turnaround from hours to seconds",
    preview:
      "I noticed availability and pricing still need a follow-up email — a lot of friction for a renter comparing five sites at once...",
    timesUsed: 97,
    replyRate: 5.7,
    updatedAt: "2026-06-20",
  },
  {
    id: "t-004",
    name: "Real Estate Lead Qualification",
    industry: "Real Estate",
    useCase: "CRM automation + instant follow-up",
    subject: "A faster way for {{agency_name}} to qualify leads",
    preview:
      "Every listing enquiry that goes unanswered for more than a few minutes converts far less — automated follow-up fixes that...",
    timesUsed: 83,
    replyRate: 4.9,
    updatedAt: "2026-06-15",
  },
  {
    id: "t-005",
    name: "Medical Clinic No-Show Reduction",
    industry: "Medical Clinics",
    useCase: "Automated reminders pitch",
    subject: "Reducing no-shows at {{clinic_name}}",
    preview:
      "With reviews like yours, patients clearly trust you — but without reminders, 15-20% of appointments are typically lost to no-shows...",
    timesUsed: 61,
    replyRate: 9.2,
    updatedAt: "2026-07-01",
  },
];

export const outreachPerformance: AnalyticsPoint[] = [
  { label: "Mon", sent: 68, opened: 24, replies: 3 },
  { label: "Tue", sent: 92, opened: 35, replies: 5 },
  { label: "Wed", sent: 74, opened: 28, replies: 2 },
  { label: "Thu", sent: 110, opened: 47, replies: 6 },
  { label: "Fri", sent: 88, opened: 31, replies: 4 },
  { label: "Sat", sent: 42, opened: 12, replies: 1 },
  { label: "Sun", sent: 38, opened: 9, replies: 1 },
];

export const leadQualityTrend: LeadQualityPoint[] = [
  { label: "Week 1", hot: 42, warm: 88, cold: 120 },
  { label: "Week 2", hot: 58, warm: 95, cold: 110 },
  { label: "Week 3", hot: 51, warm: 102, cold: 98 },
  { label: "Week 4", hot: 67, warm: 110, cold: 90 },
  { label: "Week 5", hot: 74, warm: 121, cold: 85 },
  { label: "Week 6", hot: 81, warm: 118, cold: 79 },
];

export const leadSourceBreakdown = [
  { name: "Google Maps", value: 1420, color: "#4F5BFF" },
  { name: "Apollo", value: 780, color: "#7B83FF" },
  { name: "Manual", value: 340, color: "#F2A93B" },
];

export const conversionFunnel = [
  { stage: "Businesses Found", value: 2540 },
  { stage: "Websites Analyzed", value: 1230 },
  { stage: "Emails Generated", value: 850 },
  { stage: "Emails Sent", value: 620 },
  { stage: "Replies", value: 42 },
  { stage: "Meetings Booked", value: 8 },
];
