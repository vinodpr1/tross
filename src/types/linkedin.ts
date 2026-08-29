export interface LinkedInProfileAnalytics {
  profileViews?: number;
  postImpressions?: number;
  postImpressionsWindow?: string;
  searchAppearances?: number;
}

export interface LinkedInProfileExperience {
  title: string;
  company: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
  location?: string;
  workType?: string | null;
  skills?: string[];
  companyLogo?: string;
}

export interface LinkedInEducation {
  school?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
}

export interface LinkedInProfile {
  name?: string;
  headline?: string;
  about?: string;
  location?: string;
  education?: string;
  educations?: LinkedInEducation[];
  connections?: string;
  profileImage?: string;
  coverImage?: string;
  profileUrl: string;
  analytics?: LinkedInProfileAnalytics;
  experience: LinkedInProfileExperience[];
  profileLanguage?: string;
  openTo?: string[];
}
