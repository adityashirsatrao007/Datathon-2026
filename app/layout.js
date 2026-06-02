import "./globals.css";

export const metadata = {
  title: "KSP Crime Database AI Console",
  description: "SCRB Intelligent Conversational AI for Crime Records Bureau",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
