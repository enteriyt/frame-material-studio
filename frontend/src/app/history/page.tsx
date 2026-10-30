"use client";
import Link from "next/link";
import { useStudio } from "../../components/studio-provider";
import { TaskCard } from "../../components/task-card";
import { isPending } from "../../lib/types";
export default function History() {
  const { tasks, loading, queryError, retry, user } = useStudio();
  const pending = tasks.filter(isPending).length;
  return (
    <main className="history">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR CREATIVE JOURNEY</span>
          <h1>
            我的作品<span className="brand-dot">.</span>
          </h1>
          <p className="muted">
            {user?.name}的灵感收藏夹 · {tasks.length} 份作品
            {pending > 0 && ` · ${pending} 份正在制作`}
          </p>
        </div>
        <Link href="/" className="primary">
          继续创作 ↗
        </Link>
      </div>
      {queryError && (
        <div className="notice" role="alert">
          <div>
            <strong>状态查询暂时不可用</strong>
            <p>{queryError}。已保留上次任务状态；这不代表制作失败。</p>
          </div>
          <button onClick={retry}>恢复查询</button>
        </div>
      )}
      {loading ? (
        <div className="empty" role="status">
          正在恢复你的作品记录…
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">✳</span>
          <h2>第一份作品，从这里开始</h2>
          <p>挑选模板，放入照片，收藏你的生活片段。</p>
          <Link href="/" className="primary">
            去发现模板 ↗
          </Link>
        </div>
      ) : (
        <div className="task-grid">
          {tasks.map((t) => (
            <TaskCard task={t} key={t.id} />
          ))}
        </div>
      )}
      <p className="history-note">
        记录来自服务端，刷新后自动恢复。完成的任务会停止自动查询。
      </p>
    </main>
  );
}
