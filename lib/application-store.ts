import type { AtsType } from "@/lib/job-url";

export type DemoApplicationRecord = {
  id: string;
  atsType: AtsType;
  companyName: string;
  roleTitle: string;
  jobUrl: string;
  jobDescription: string;
  location: string | null;
  status: string;
  createdAt: string;
};

declare global {
  var demoApplicationStore: Map<string, DemoApplicationRecord> | undefined;
}

const applicationStore = globalThis.demoApplicationStore ?? new Map();

if (!globalThis.demoApplicationStore) {
  globalThis.demoApplicationStore = applicationStore;
}

export function createDemoApplication(
  input: Omit<DemoApplicationRecord, "id" | "createdAt" | "status">,
) {
  const id = crypto.randomUUID().slice(0, 8);

  const record: DemoApplicationRecord = {
    ...input,
    id,
    status: "Intake complete",
    createdAt: new Date().toISOString(),
  };

  applicationStore.set(id, record);

  return record;
}

export function getDemoApplication(id: string) {
  return applicationStore.get(id) ?? null;
}

export function listDemoApplications() {
  return [...applicationStore.values()].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}

export function updateDemoApplicationStatus(id: string, status: string) {
  const record = applicationStore.get(id);

  if (!record) {
    return null;
  }

  const updated = {
    ...record,
    status,
  };

  applicationStore.set(id, updated);

  return updated;
}
