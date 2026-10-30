/** Shop policies and document defaults. Stored in the browser and used by tickets and forms. */
export interface ShopDocuments {
  liabilityWaiver: string;
  requireWaiverSignature: boolean;
  tradeInEnabled: boolean;
  tradeInRequireId: boolean;
  tradeInPolicy: string;
  warrantyDays: number;
  warrantyCoverage: string;
  warrantyExcludeWater: boolean;
  serviceTerms: string;
  paymentTerms: string;
  supportEmail: string;
}

const KEY = "novaops_documents";

export const DEFAULT_DOCUMENTS: ShopDocuments = {
  liabilityWaiver: "",
  requireWaiverSignature: true,
  tradeInEnabled: true,
  tradeInRequireId: false,
  tradeInPolicy: "",
  warrantyDays: 90,
  warrantyCoverage: "Screen replacement, Battery replacement, Charging port",
  warrantyExcludeWater: true,
  serviceTerms: "",
  paymentTerms: "Full payment due upon device pickup",
  supportEmail: "",
};

export function getDocuments(): ShopDocuments {
  try { return { ...DEFAULT_DOCUMENTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { ...DEFAULT_DOCUMENTS }; }
}

export function saveDocuments(docs: ShopDocuments) {
  try { localStorage.setItem(KEY, JSON.stringify(docs)); } catch { /* storage unavailable */ }
}

/** The avatar chosen in Settings, shown in the app header. */
export const AVATAR_KEY = "novaops_account_avatar";
