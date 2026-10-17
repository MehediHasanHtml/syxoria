import { mockFinance, mockGoals, mockMarketing, mockSales, periods } from "@/lib/mock-data/business";
import { mockConversations, mockPrompts, mockSearchIndex } from "@/lib/mock-data/conversations";
import { mockDocuments, mockHistory, mockMemory, mockReports } from "@/lib/mock-data/knowledge";
import { mockCalendar, mockClients } from "@/lib/mock-data/relations";
import { mockApprovals, mockLimits, mockRestricted, mockSafetyStops, mockTeam, mockTools } from "@/lib/mock-data/tools";
import { mockWorkspaceActions } from "@/lib/mock-data/workspace-actions";
import { clone } from "./_client";

/**
 * The workspace's data, one function per area. Today they resolve the demo company's fictional
 * data; each says the endpoint it stands for. Keep the signatures when connecting the API.
 */

/** TODO(api): GET /business/sales?period= */
export const getSales = async () => clone(mockSales);
/** TODO(api): GET /business/marketing?period= */
export const getMarketing = async () => clone(mockMarketing);
/** TODO(api): GET /business/finance?period= */
export const getFinance = async () => clone(mockFinance);
/** TODO(api): GET /business/goals?period= */
export const getGoals = async () => clone(mockGoals);
export const getPeriods = async () => clone(periods);

/** TODO(api): GET /clients */
export const getClients = async () => clone(mockClients);
/** TODO(api): GET /calendar?from=today — meetings, deadlines, follow ups and scheduled actions */
export const getCalendar = async () => clone(mockCalendar);

/** TODO(api): GET /actions — every action and its execution stages */
export const getWorkspaceActions = async () => clone(mockWorkspaceActions);

/** TODO(api): GET /documents */
export const getDocuments = async () => clone(mockDocuments);
/** TODO(api): GET /memory — what Syxoria has learned, with where it came from */
export const getMemory = async () => clone(mockMemory);

/** TODO(api): GET /history?type=&period= */
export const getHistory = async () => clone(mockHistory);
/** TODO(api): GET /reports */
export const getReports = async () => clone(mockReports);

/** TODO(api): GET /integrations */
export const getTools = async () => clone(mockTools);

/** TODO(api): GET /team */
export const getTeam = async () => clone(mockTeam);
/** TODO(api): GET /autonomy/safety — approval requirements, limits, restricted actions, past safety stops */
export const getSafetySettings = async () => clone({ approvals: mockApprovals, limits: mockLimits, restricted: mockRestricted, stops: mockSafetyStops });

/** TODO(api): GET /assistant/conversations */
export const getConversations = async () => clone({ conversations: mockConversations, prompts: mockPrompts });

/** TODO(api): GET /search?q= — one index across clients, documents, conversations, actions and decisions */
export const getSearchIndex = async () => clone(mockSearchIndex);
