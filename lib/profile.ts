export const basicFieldDefinitions = [
  { key: "fullName", label: "Full name", placeholder: "Valentina Pagliuca" },
  { key: "preferredName", label: "Preferred name", placeholder: "Valentina" },
  { key: "email", label: "Email", placeholder: "valentinap@uchicago.edu" },
  { key: "phone", label: "Phone", placeholder: "+1 ..." },
  { key: "location", label: "Location", placeholder: "Chicago, IL" },
  { key: "linkedinUrl", label: "LinkedIn", placeholder: "https://linkedin.com/in/..." },
  { key: "githubUrl", label: "GitHub", placeholder: "https://github.com/..." },
  { key: "portfolioUrl", label: "Portfolio", placeholder: "https://..." },
  { key: "school", label: "School", placeholder: "University of Chicago" },
  { key: "degree", label: "Degree", placeholder: "Master's" },
  { key: "program", label: "Program", placeholder: "MPCS" },
  { key: "graduationDate", label: "Graduation date", placeholder: "June 2026" },
  { key: "gpa", label: "GPA", placeholder: "3.8 / 4.0" },
  {
    key: "workAuthorization",
    label: "Work authorization",
    placeholder: "Authorized to work in the US",
  },
  {
    key: "sponsorshipAnswer",
    label: "Sponsorship answer",
    placeholder: "Exact wording you want reused",
  },
  {
    key: "noticePeriod",
    label: "Notice period",
    placeholder: "Available immediately / 2 weeks / 1 month",
  },
] as const;

export const identityFieldDefinitions = [
  {
    key: "gender",
    label: "Gender",
    placeholder: "Woman / Man / Non-binary / Prefer not to say / Self-describe",
  },
  {
    key: "raceEthnicity",
    label: "Race / ethnicity",
    placeholder: "Save the category/categories you usually select",
  },
  {
    key: "veteranStatus",
    label: "Veteran status",
    placeholder: "Protected veteran / Not a veteran / Prefer not to say",
  },
  {
    key: "disabilityStatus",
    label: "Disability status",
    placeholder: "Yes / No / Prefer not to answer",
  },
] as const;

export const answerBlockDefinitions = [
  "Tell us about yourself",
  "Why this role?",
  "Why this company?",
  "Short intro for applications",
  "Behavioral story bank",
  "Anything else you want recruiters to know",
] as const;

export type BasicFieldKey = (typeof basicFieldDefinitions)[number]["key"];
export type IdentityFieldKey = (typeof identityFieldDefinitions)[number]["key"];
export type AnswerBlockKey = (typeof answerBlockDefinitions)[number];

export type BasicProfileValues = Record<BasicFieldKey, string>;
export type IdentityProfileValues = Record<IdentityFieldKey, string>;
export type ApplicationAnswerValues = Record<AnswerBlockKey, string>;

export type PersistedProfilePayload = {
  basicInfo: BasicProfileValues;
  identityInfo: IdentityProfileValues;
  applicationAnswers: ApplicationAnswerValues;
};

export const emptyBasicProfileValues: BasicProfileValues = {
  fullName: "",
  preferredName: "",
  email: "",
  phone: "",
  location: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  school: "",
  degree: "",
  program: "",
  graduationDate: "",
  gpa: "",
  workAuthorization: "",
  sponsorshipAnswer: "",
  noticePeriod: "",
};

export const emptyIdentityProfileValues: IdentityProfileValues = {
  gender: "",
  raceEthnicity: "",
  veteranStatus: "",
  disabilityStatus: "",
};

export const emptyApplicationAnswerValues: ApplicationAnswerValues = {
  "Tell us about yourself": "",
  "Why this role?": "",
  "Why this company?": "",
  "Short intro for applications": "",
  "Behavioral story bank": "",
  "Anything else you want recruiters to know": "",
};
