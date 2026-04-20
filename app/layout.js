import "./globals.css";

export const metadata = {
  title: "FitTrack",
  description: "Health and fitness tracking for athletes and coaches",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
