export type Stage = "WAITING" | "CHECK" | "GENERATE" | "FINALIZE" | "DONE";
export interface Template {
  id: string;
  title: string;
  category: string;
  description: string;
  coverUrl: string;
  requiredImageCount: number;
  maxFileSizeBytes: number;
  acceptedMimeTypes: string[];
}
export interface Asset {
  id: string;
  url: string;
}
export interface Task {
  id: string;
  templateId: string;
  templateTitle: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  stage: Stage;
  resultUrl?: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
}
export const stageLabels: Record<Stage, string> = {
  WAITING: "等待处理",
  CHECK: "素材检查",
  GENERATE: "模拟生成",
  FINALIZE: "结果整理",
  DONE: "制作完成",
};
export const isPending = (task: Task) =>
  task.status === "QUEUED" || task.status === "RUNNING";
