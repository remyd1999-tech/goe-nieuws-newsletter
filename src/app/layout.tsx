import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Goe Nieuws · Newsletter builder",
  description: "Informative newsletter builder for Goe Nieuws",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full font-sans antialiased">{children}</body>
    </html>
  );
}
