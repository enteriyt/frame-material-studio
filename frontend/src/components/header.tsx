"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStudio } from "./studio-provider";
import { isPending } from "../lib/types";
export function Header() {
  const pathname = usePathname();
  const { user, users, switchUser, addUser, tasks } = useStudio();
  const pending = tasks.filter(isPending).length;
  return (
    <header>
      <Link href="/" className="brand">
        <span className="brand-icon">f</span> frame
        <span className="brand-dot">.</span>
      </Link>
      <nav aria-label="主导航">
        <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
          发现模板
        </Link>
        <Link
          href="/history"
          aria-current={pathname === "/history" ? "page" : undefined}
        >
          我的作品 {pending > 0 && <span className="count">{pending}</span>}
        </Link>
      </nav>
      <div className="identity">
        <span className="avatar">{user?.name.slice(0, 1) || "·"}</span>
        <select
          aria-label="当前演示用户"
          value={user?.id || ""}
          onChange={(e) => switchUser(e.target.value)}
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <button
          className="icon-button"
          aria-label="创建新演示用户"
          title="创建独立的演示用户"
          onClick={addUser}
        >
          ＋
        </button>
      </div>
    </header>
  );
}
