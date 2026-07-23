export type LeadStatus =
  | "Hot Lead"
  | "Warm Lead"
  | "Cold Lead"
  | "Contacted"
  | "Replied"
  | "Booked";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  jobTitle: string;
  email: string | null;
  phone: string | null;
  confidenceScore?: number;
}

export interface Business {
  id: string;
  name: string;
  category: string;
  location: string;
  website: string | null;
  phone: string;

  // Contacts list
  contacts?: Contact[];

  // Legacy / optional direct contact fields
  email?: string | null;
  contactPerson?: string;

  rating: number;
  reviews: number;
  aiScore: number;
  status: string;
  logoInitials: string;
  logoColor: string;
  employeeCount: string;
  detectedProblems: string[];
  recommendedServices: string[];

  // Email fields
  emailId?: string | null; // 👈 Added optional emailId
  emailSubject: string;
  emailBody: string;

  source: string;
  addedAt: string;
}

export interface SearchRun {
  id: string;
  industry: string;
  location: string;
  leadsFound: number;
  status: "Completed" | "Processing" | "Failed";
  startedAt: string;
  filters: string[];
}

export interface Campaign {
  id: string;
  name: string;
  industry: string;
  location: string;
  leads: number;
  sent: number;
  opened: number;
  replies: number;
  meetings: number;
  status: "Running" | "Paused" | "Completed" | "Draft";
  createdAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  industry: string;
  useCase: string;
  subject: string;
  preview: string;
  timesUsed: number;
  replyRate: number;
  updatedAt: string;
}

export interface AnalyticsPoint {
  label: string;
  sent: number;
  opened: number;
  replies: number;
}

export interface LeadQualityPoint {
  label: string;
  hot: number;
  warm: number;
  cold: number;
}
