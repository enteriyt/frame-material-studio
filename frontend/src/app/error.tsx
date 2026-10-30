"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="empty">
      <h1>页面暂时无法加载</h1>
      <p>请稍后重试。</p>
      <button className="primary" onClick={reset}>
        重新加载
      </button>
    </main>
  );
}
