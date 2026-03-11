import "./globals.css";

export const metadata = {
  title: "Workout Timer",
  description: "Interval timer for workouts",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
