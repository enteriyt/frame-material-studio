"use client";
import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { request } from "../../../lib/api";
import type { Template, Asset, Task } from "../../../lib/types";
import { useStudio } from "../../../components/studio-provider";
import { TaskCard } from "../../../components/task-card";
type Slot = {
  preview?: string;
  asset?: Asset;
  loading?: boolean;
  error?: string;
};
export default function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const studio = useStudio();
  const [template, setTemplate] = useState<Template | null>(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setTemplate(null);
    setError("");
    request<Template>(`/templates/${encodeURIComponent(id)}`, "", {
      signal: abort.signal,
    })
      .then(setTemplate)
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      });
    return () => abort.abort();
  }, [id, version]);
  return (
    <main className="detail">
      <Link href="/" className="back-link">
        ← 返回模板
      </Link>
      {error ? (
        <div className="empty error">
          {error}
          <button onClick={() => setVersion((v) => v + 1)}>重试</button>
        </div>
      ) : !template || !studio.user ? (
        <div className="empty" role="status">
          正在准备创作空间…
        </div>
      ) : (
        <Editor
          key={`${template.id}-${studio.user.id}`}
          template={template}
          token={studio.user.token}
        />
      )}
    </main>
  );
}
function Editor({ template, token }: { template: Template; token: string }) {
  const { accepted, tasks } = useStudio();
  const [slots, setSlots] = useState<Slot[]>(
    Array.from({ length: template.requiredImageCount }, () => ({})),
  );
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [error, setError] = useState("");
  const [lastId, setLastId] = useState("");
  const [failStage, setFailStage] = useState("");
  const [delay, setDelay] = useState(1500);
  const mounted = useRef(true);
  const operations = useRef(new Map<number, AbortController>());
  const submitAbort = useRef<AbortController | null>(null);
  const urls = useRef(new Set<string>());
  useEffect(() => {
    mounted.current = true;
    const active = operations.current;
    const previews = urls.current;
    return () => {
      mounted.current = false;
      active.forEach((c) => c.abort());
      submitAbort.current?.abort();
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);
  function patch(index: number, slot: Slot) {
    setSlots((current) =>
      current.map((s, i) => (i === index ? { ...s, ...slot } : s)),
    );
  }
  function remove(index: number) {
    operations.current.get(index)?.abort();
    const previous = slots[index].preview;
    if (previous) {
      URL.revokeObjectURL(previous);
      urls.current.delete(previous);
    }
    setSlots((current) => current.map((s, i) => (i === index ? {} : s)));
  }
  async function upload(index: number, file: File) {
    operations.current.get(index)?.abort();
    remove(index);
    if (
      !template.acceptedMimeTypes.includes(file.type) ||
      file.size === 0 ||
      file.size > template.maxFileSizeBytes
    ) {
      patch(index, { error: "请选择 5MB 以内的 JPEG 或 PNG 图片" });
      return;
    }
    const controller = new AbortController();
    operations.current.set(index, controller);
    const preview = URL.createObjectURL(file);
    urls.current.add(preview);
    patch(index, { preview, loading: true, error: undefined });
    const form = new FormData();
    form.set("file", file);
    try {
      const asset = await request<Asset>("/assets", token, {
        method: "POST",
        body: form,
        signal: controller.signal,
      });
      if (mounted.current && operations.current.get(index) === controller)
        patch(index, { asset, loading: false });
    } catch (e) {
      if (mounted.current && !controller.signal.aborted)
        patch(index, {
          loading: false,
          error: e instanceof Error ? e.message : "上传失败，请重新选择",
        });
    }
  }
  async function submit() {
    if (submittingRef.current || slots.some((s) => !s.asset || s.loading))
      return;
    submittingRef.current = true;
    setSubmitting(true);
    setError("");
    const controller = new AbortController();
    submitAbort.current = controller;
    try {
      const task = await request<Task>("/tasks", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          assetIds: slots.map((s) => s.asset!.id),
          delayMs: delay,
          failStage: failStage || null,
        }),
        signal: controller.signal,
      });
      if (mounted.current) {
        accepted(task);
        setLastId(task.id);
      }
    } catch (e) {
      if (mounted.current && !controller.signal.aborted)
        setError(e instanceof Error ? e.message : "提交失败");
    } finally {
      if (mounted.current) {
        submittingRef.current = false;
        setSubmitting(false);
      }
    }
  }
  const latest = tasks.find((t) => t.id === lastId);
  return (
    <>
      <div className="detail-grid">
        <section className="detail-art">
          <img src={template.coverUrl} alt={`${template.title}模板示例`} />
          <span className="detail-art-label">
            FRAME COLLECTION / {template.category}
          </span>
        </section>
        <section className="editor">
          <span className="eyebrow">LET’S MAKE SOMETHING</span>
          <h1>{template.title}</h1>
          <p className="description">{template.description}</p>
          <div className="divider" />
          <div className="row">
            <h2>放入你的照片</h2>
            <span className="muted">
              {slots.filter((s) => s.asset).length} /{" "}
              {template.requiredImageCount}
            </span>
          </div>
          <p className="upload-hint">
            需要 {template.requiredImageCount} 张不同图片 · JPEG / PNG ·
            每张不超过 5MB
          </p>
          <div className="upload-grid">
            {slots.map((slot, index) => (
              <div className="upload-slot" key={index}>
                {slot.preview && (
                  <img src={slot.preview} alt={`图片 ${index + 1} 预览`} />
                )}
                <label className={slot.preview ? "replace" : "upload-label"}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={submitting}
                    aria-label={`选择或替换第 ${index + 1} 张图片`}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void upload(index, file);
                    }}
                  />
                  {slot.preview ? (
                    "替换图片"
                  ) : (
                    <>
                      <span>＋</span>选择图片 {index + 1}
                    </>
                  )}
                </label>
                {slot.preview && (
                  <button
                    className="remove"
                    disabled={submitting}
                    aria-label={`移除第 ${index + 1} 张图片`}
                    onClick={() => remove(index)}
                  >
                    ×
                  </button>
                )}
                {slot.loading && (
                  <span className="upload-status" role="status">
                    上传中…
                  </span>
                )}
                {slot.asset && (
                  <span className="upload-status uploaded">✓ 已上传</span>
                )}
                {slot.error && (
                  <p className="slot-error" role="alert">
                    {slot.error}，请选择图片重试。
                  </p>
                )}
              </div>
            ))}
          </div>
          <details className="simulation">
            <summary>演示设置</summary>
            <p>可重复演示每个处理阶段的成功与失败。</p>
            <label>
              指定失败阶段
              <select
                value={failStage}
                onChange={(e) => setFailStage(e.target.value)}
              >
                <option value="">全部成功</option>
                <option value="CHECK">素材检查失败</option>
                <option value="GENERATE">模拟生成失败</option>
                <option value="FINALIZE">结果整理失败</option>
              </select>
            </label>
            <label>
              每阶段耗时
              <select
                value={delay}
                onChange={(e) => setDelay(Number(e.target.value))}
              >
                <option value={300}>0.3 秒</option>
                <option value={1500}>1.5 秒</option>
                <option value={5000}>5 秒</option>
                <option value={10000}>10 秒</option>
              </select>
            </label>
          </details>
          {error && (
            <p className="error" role="alert">
              {error}。如提交响应丢失，请先查看历史记录，避免重复创建。
            </p>
          )}
          <button
            className="primary submit"
            disabled={submitting || slots.some((s) => !s.asset || s.loading)}
            onClick={() => void submit()}
          >
            {submitting ? "正在提交…" : "开始制作"}
            <span>↗</span>
          </button>
          <p className="muted small">
            提交后由后台继续处理，你可以继续浏览或创建其他任务。
          </p>
          {lastId && (
            <p className="success" role="status">
              ✓ 已受理任务 <Link href="/history">查看我的作品 →</Link>
            </p>
          )}
        </section>
      </div>
      {latest && (
        <section className="latest-task">
          <h2>刚刚创建的作品</h2>
          <TaskCard task={latest} />
        </section>
      )}
    </>
  );
}
