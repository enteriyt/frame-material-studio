import type { Metadata } from "next";
import { StudioProvider } from "../components/studio-provider";
import { Header } from "../components/header";
import "./globals.css";
export const metadata: Metadata = {
  title: "Frame · 把灵感变成作品",
  description: "轻松制作，收藏每一份灵感。素材制作演示工作室。",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <StudioProvider>
          <Header />
          {children}
          <footer>
            <span className="brand">frame.</span>
            <span>每一个瞬间，都值得好好表达。</span>
            <small>模拟制作演示 · 无真实 AI 服务</small>
          </footer>
        </StudioProvider>
      </body>
    </html>
  );
}
