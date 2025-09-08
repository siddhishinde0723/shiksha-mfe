// app/layout.tsx
import "./global.css";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import MuiThemeProvider, {
  MuiThemeProviderWithLanguage,
} from "@learner/assets/theme/MuiThemeProvider";
import ClientLayout from "./ClientLayout";
import GoogleAnalyticsTracker from "@learner/components/GoogleAnalyticsTracker/GoogleAnalyticsTracker";

export const metadata = {
  title: "Welcome to shiksha-app",
  description:
    "Shiksha-app is a platform for users to learn and grow by consuming educational content",
  openGraph: {
    title: "Welcome to shiksha-app",
    description:
      "Shiksha-app is a platform for users to learn and grow by consuming educational content",
    images: [
      {
        url: `/logo.png`,
        width: 800,
        height: 600,
      },
    ],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1976d2" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedState = localStorage.getItem('isColorInverted');
                  if (savedState !== null) {
                    const isInverted = JSON.parse(savedState);
                    if (isInverted) {
                      document.documentElement.style.filter = 'invert(1) hue-rotate(180deg)';
                      
                      // Add style for images/videos
                      const style = document.createElement('style');
                      style.id = 'color-inversion-style-initial';
                      style.textContent = \`
                        img, video, iframe, svg, canvas, embed, object {
                          filter: invert(1) hue-rotate(180deg) !important;
                        }
                        [data-no-invert], [data-no-invert] * {
                          filter: invert(1) hue-rotate(180deg) !important;
                        }
                      \`;
                      document.head.appendChild(style);
                    }
                  }
                } catch (e) {
                  // Handle any localStorage errors silently
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ClientLayout>
          <MuiThemeProviderWithLanguage>
            <GoogleAnalyticsTracker />

            <MuiThemeProvider>{children}</MuiThemeProvider>
          </MuiThemeProviderWithLanguage>
          <ToastContainer />
        </ClientLayout>
      </body>
    </html>
  );
}
