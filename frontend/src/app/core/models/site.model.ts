export type SiteStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

export interface Site {
  siteId: number;
  siteCode: string;
  name: string;
  region?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status: SiteStatus;
}

export interface SiteRequest {
  siteCode: string;
  name: string;
  region?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  status: SiteStatus | string;
}
