export interface Integration {
  service: IntegrationService;
  community: Community;
}

export interface UIntegration {
  service: IntegrationService | undefined;
  community: Community | undefined;
}

export interface Stock {
  ticker: string;
  names: string[];
}

export interface UStock {
  ticker: string | undefined;
  names: string[] | undefined;
}

export interface Community {
  name: string;
  id: string;
  followers: number;
  description: string;
}

export type IntegrationService = "reddit" | "twitch";

export interface ProfileData {
  id: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

export interface Credentials {
  email: string;
  password: string;
}
