export type Setting = "tree" | "planter" | "garden" | "other";

export type FieldCard = {
  title: string;
  focus: string;
  actions: [string, string];
  spokenScript: string;
  durationMinutes: 10 | 15;
};

export type Observation = {
  id: string;
  visitId: string;
  noteText: string;
  inputMethod: "speech" | "typed";
  createdAt: string;
  memoryStatus: "synced" | "pending";
};

export type Visit = {
  id: string;
  placeId: string;
  ordinal: number;
  card: FieldCard;
  audioReady: boolean;
  audioError: string | null;
  retrievedMemory: string | null;
  createdAt: string;
  observation: Observation | null;
};

export type Place = {
  id: string;
  nickname: string;
  setting: Setting;
  createdAt: string;
  assistantReady: boolean;
  visits: Visit[];
  comparison: string | null;
};

export type PlaceSummary = Pick<Place, "id" | "nickname" | "setting" | "createdAt" | "assistantReady"> & {
  visitCount: number;
};
