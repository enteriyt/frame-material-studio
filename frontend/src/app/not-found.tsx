import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty">
      <h1>这一页暂时没有作品</h1>
      <Link href="/">返回模板列表 →</Link>
    </main>
  );
}
