import {
  mockCurrentUserId,
  mockNotificationPreferences,
  mockNotifications,
  mockPresence,
  mockUsers,
  mockWorkspace,
} from "@/lib/mock-data/users";
import type { Notification, NotificationPreferences, Presence, User, Workspace } from "@/types";
import { clone, ServiceError, simulateLatency } from "./_client";

/** TODO(auth): resolve from the session (cookies) server-side. */
export async function getCurrentUser(): Promise<User> {
  return clone(mockUsers.find((u) => u.id === mockCurrentUserId)!);
}

/** TODO(api): GET /workspace/members */
export async function getMembers(): Promise<User[]> {
  return clone(mockUsers);
}

/** TODO(api): GET /workspace/presence — ideally pushed over a realtime channel */
export async function getPresence(): Promise<Presence[]> {
  return clone(mockPresence);
}

/** TODO(api): GET /workspace */
export async function getWorkspace(): Promise<Workspace> {
  return clone(mockWorkspace);
}

/** TODO(api): GET /notifications */
export async function getNotifications(): Promise<Notification[]> {
  return clone(mockNotifications);
}

/** TODO(api): GET /me/preferences/notifications */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return clone(mockNotificationPreferences);
}

/** TODO(api): PATCH /me */
export async function updateProfile(input: Pick<User, "name" | "email"> & { title?: string }): Promise<void> {
  await simulateLatency();
  if (input.email.endsWith("@example.invalid")) {
    throw new ServiceError("This email is already used by another account.", "validation");
  }
}

/** TODO(api): PATCH /workspace */
export async function updateWorkspace(input: Pick<Workspace, "name" | "region">): Promise<Pick<Workspace, "name" | "region">> {
  await simulateLatency();
  return input;
}

/** TODO(api): PATCH /me/preferences/notifications */
export async function updateNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
  await simulateLatency(400);
  return prefs;
}
