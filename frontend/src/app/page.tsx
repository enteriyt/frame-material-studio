"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { request } from "../lib/api";
import type { Template } from "../lib/types";
export default function Home() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [category, setCategory] = useState("全部");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    request<Template[]>("/templates", "", { signal: abort.signal })
      .then(setTemplates)
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [version]);
  const categories = ["全部", ...new Set(templates.map((t) => t.category))];
  const shown = templates.filter(
    (t) => category === "全部" || t.category === category,
  );
  return (
    <main>
      <section className="hero">
        <div>
          <span className="eyebrow">YOUR EVERYDAY CREATIVE SPACE</span>
          <h1>
            让平凡瞬间，
            <br />
            有一点<span>不平凡。</span>
          </h1>
          <p>
            挑一个喜欢的模板，放入你的照片。
            <br />
            让灵感在后台生长，把时间留给生活。
          </p>
          <a href="#templates" className="primary">
            探索模板 <span>↗</span>
          </a>
          <div className="hero-caption">
            <span className="mini-dot" />
            从一张照片开始，发现更多可能
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="art-orbit" />
          <div className="polaroid back">
            <img src="/demo/portrait.svg" alt="" />
            <span>slow moments</span>
          </div>
          <div className="polaroid front">
            <img src="/demo/postcard.svg" alt="" />
            <span>somewhere, someday.</span>
          </div>
          <div className="floating-label">✳ a little inspiration</div>
          <span className="art-star">✳</span>
        </div>
      </section>
      <section id="templates" className="catalog">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MADE FOR YOUR MOMENTS</span>
            <h2>找到你的下一份灵感</h2>
          </div>
          <span className="muted">简单几步，创作属于你的作品</span>
        </div>
        <div className="filters" aria-label="模板分类">
          {categories.map((c) => (
            <button
              key={c}
              className={category === c ? "selected" : ""}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="empty" role="status">
            正在寻找灵感模板…
          </div>
        ) : error ? (
          <div className="notice error" role="alert">
            {error}
            <button onClick={() => setVersion((v) => v + 1)}>重新加载</button>
          </div>
        ) : shown.length === 0 ? (
          <div className="empty">这个分类还没有模板</div>
        ) : (
          <div className="template-grid">
            {shown.map((t, i) => (
              <Link
                href={`/templates/${t.id}`}
                key={t.id}
                className="template-card"
              >
                <div className="template-image">
                  <img src={t.coverUrl} alt={t.title} />
                  <span className="image-count">
                    {t.requiredImageCount} 张照片
                  </span>
                  <span className="card-arrow">↗</span>
                </div>
                <div className="row">
                  <h3>{t.title}</h3>
                  <span className="category">{t.category}</span>
                </div>
                <p>{t.description}</p>
                <span className="template-number">
                  0{i + 1} / FRAME COLLECTION
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
      <section className="bottom-note">
        <span>✳</span>
        <div>
          <h2>你负责生活，我们负责等待。</h2>
          <p>提交后可以继续探索，作品会在「我的作品」中等你。</p>
        </div>
        <Link href="/history">前往我的作品 ↗</Link>
      </section>
    </main>
  );
}
