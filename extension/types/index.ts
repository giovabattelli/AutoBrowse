export interface PageDom {
  rootId: string;
  map: {
    [key: string]: DomNode;
  };
}

export type DomNode = ElementNode | TextNode;

export interface ElementNode {
  tagName: string;
  attributes: { [key: string]: string };
  xpath: string;
  children: string[];
  isVisible: boolean;
  isTopElement?: boolean;
  isInteractive?: boolean;
  isInViewport?: boolean;
  highlightIndex?: number;
  type: "ELEMENT_NODE";
}

export interface TextNode {
  type: "TEXT_NODE";
  text: string;
  isVisible: boolean;
}

export type ActionType =
  | "click"
  | "input"
  | "key_press"
  | "scroll"
  | "navigate"
  | "finish"
  | "upload";

export interface HistoryStep {
  step_number: number;
  action: ActionType;
  value: string | null;
  summary: string;
  screenshot?: string | null;
}

export interface AgentResult {
  highlightIndex: number;
  action: ActionType;
  value: string | null;
  history: string;
}

export type AgentStepResult = {
  history: string | null;
  isRunning: boolean;
};

export interface LoginPageProps {
  onSignIn: () => void;
}

export interface AgentMessage {
  id: string;
  type: "user" | "agent" | "system";
  content: string;
  metadata?: {
    action?: string;
    value?: string;
    timestamp?: number;
  };
}

export interface StripeStatusResponse {
  active: boolean;
  status: string | null;
  current_period_end?: string;
}

export interface StripeCheckoutResponse {
  checkout_url: string;
}

export interface BillingPortalResponse {
  portal_url: string;
}

export interface AgentProps {
  isPremium: boolean;
  checkingPremium: boolean;
}

export interface ProfileProps {
  userInfo: {
    name: string;
    email: string;
  };
  isPremium: boolean;
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  loading: boolean;
  handleUpgrade: () => Promise<void>;
  handleCancelSubscription: () => Promise<void>;
  handleReactivateSubscription: () => Promise<void>;
}

export interface JobApplicationData {
  firstName: string;
  lastName: string;
  preferredName: string;
  email: string;
  phoneNumber: string;
  aboutMe: string;
  school: string;
  startDate: string;
  expectedGraduation: string;
  currentLocation: string;
  currentCompany: string;
  linkedinUrl: string;
  githubUrl: string;
  websiteUrl?: string;
  languages: string;
  hasOfferDeadlines: boolean;
  preferredStartDate: string;
  preferredLocations: string[];
  isFinalInternship: boolean;
  requiresSponsorship: boolean;
  legallyAuthorizedToWork: boolean;
  veteranStatus: string;
  streetAddress: string;
  streetAddress2: string;
  city: string;
  state: string;
  zipCode: string;
  resumeFile?: string;
  resumeFileName?: string;
  resumeFileType?: string;
}

export interface JobApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobApplicationData) => void;
}
