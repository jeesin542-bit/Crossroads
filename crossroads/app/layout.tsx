import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crossroads — A committee for your hardest decisions",
  description:
    "Type a decision and your options. Four AI advisers argue it out, two anonymous reviewers grade the arguments, and clear scores show the winner.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-paper font-sans text-ink">{children}</body>
    </html>
  );
}
