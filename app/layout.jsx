import "./globals.css";

export const metadata = {
  title: "Makillia's Word Deck",
  description:
    "A 1930s slang word deck with unique categories, random word order, and reveal-on-click definitions.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
