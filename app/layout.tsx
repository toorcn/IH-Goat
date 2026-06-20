import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Advisors' Advisor",
  description: "AI memory and meeting companion for financial advisors",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
