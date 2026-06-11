import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalWidgets from "./components/GlobalWidgets";
import AuthProvider from "./components/AuthProvider";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://insurance-insight.vercel.app"),

  title: "보험인사이트",

  description: "보험설계사 업무 통합 플랫폼",

  manifest: "/manifest.webmanifest",

  themeColor: "#ffffff",

  openGraph: {
    title: "보험인사이트",

    description: "보험사전산, 상품공시실, 고객센터",

    url: "https://bohuminsight.com",

    siteName: "보험인사이트",

    images: [
      {
        url: "https://bohuminsight.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "보험인사이트",
      },
    ],

    type: "website",
  },
verification: {
  other: {
    "naver-site-verification":
      "05260703e2145a99997577afa0c4ee375a57b183",

    "google-site-verification":
      "nSorRb0EXXKrURSL9GCftAVHtg25EKr7tTgCveyRknw",
  },
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      style={{ colorScheme: "light" }}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
            <body className="min-h-full flex flex-col">
  <AuthProvider>
{children}
<GlobalWidgets />
  </AuthProvider>
</body>

    </html>
  );
}