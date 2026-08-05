export type SettingsTab = "account" | "brand";

export type TeamProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export type TeamMemberView = TeamProfile & {
  role: string;
};

export type TeamContactOption = {
  id: string;
  name: string | null;
  email: string | null;
  company_name: string | null;
};

export type ConnectionHealth =
  | "connected"
  | "disconnected"
  | "unknown"
  | "expired";

export type SocialAccount = {
  id: string;
  platform: string;
  page_name: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: string | null;
  updated_at?: string | null;
};

export type ConnectedPlatformModal = string | null;

export type ScheduledPost = {
  id?: string;
  user_id?: string;
  caption: string;
  platforms: string[];
  scheduled_for?: string;
  published_at?: string | null;
  status?: "scheduled" | "processing" | "posted" | "failed";
  error_message?: string | null;
  created_at?: string;
};