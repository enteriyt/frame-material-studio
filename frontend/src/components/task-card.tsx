"use client";
import Link from "next/link";
import { stageLabels, type Task } from "../lib/types";
export function TaskCard({ task }: { task: Task }) {
  const labels = {
    QUEUED: "排队中",
    RUNNING: "制作中",
    SUCCEEDED: "已完成",
    FAILED: "制作失败",
  };
  return (
    <article className="task-card">
      <div className="task-preview">
        {task.resultUrl ? (
          <a
            href={task.resultUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`预览${task.templateTitle}结果`}
          >
            <img src={task.resultUrl} alt={`${task.templateTitle}制作结果`} />
          </a>
        ) : (
          <div className={`placeholder ${task.status.toLowerCase()}`}>
            <span>{task.status === "FAILED" ? "!" : "✳"}</span>
            <p>{stageLabels[task.stage]}</p>
          </div>
        )}
      </div>
      <div className="task-body">
        <div className="row">
          <h3>{task.templateTitle}</h3>
          <span className={`badge ${task.status.toLowerCase()}`}>
            {labels[task.status]}
          </span>
        </div>
        <time dateTime={`${task.createdAt}Z`}>
          {new Date(`${task.createdAt}Z`).toLocaleString("zh-CN")}
        </time>
        {task.status === "RUNNING" || task.status === "QUEUED" ? (
          <>
            <div className="steps" aria-label="任务阶段">
              {(["CHECK", "GENERATE", "FINALIZE"] as const).map((stage) => (
                <span
                  key={stage}
                  className={stage === task.stage ? "active" : ""}
                >
                  {stageLabels[stage]}
                </span>
              ))}
            </div>
            <div className="progress">
              <span
                style={{
                  width:
                    task.stage === "WAITING"
                      ? "5%"
                      : task.stage === "CHECK"
                        ? "25%"
                        : task.stage === "GENERATE"
                          ? "55%"
                          : "85%",
                }}
              />
            </div>
          </>
        ) : null}
        {task.error && (
          <p className="error">
            {stageLabels[task.stage]}：{task.error}
          </p>
        )}
        {task.status === "SUCCEEDED" && (
          <a
            className="text-link"
            href={task.resultUrl}
            target="_blank"
            rel="noreferrer"
          >
            打开图片预览 ↗
          </a>
        )}
        <Link className="subtle-link" href={`/templates/${task.templateId}`}>
          查看模板 →
        </Link>
      </div>
    </article>
  );
}
