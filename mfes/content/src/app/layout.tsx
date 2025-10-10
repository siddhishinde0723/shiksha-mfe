// app/layout.tsx
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import MuiThemeProvider from '@content-mfes/assets/theme/MuiThemeProvider';

export const metadata = {
  title: 'Welcome to learner-web-app',
  description:
    'Learner web app is a platform for users to learn and grow by consuming educational content',
  openGraph: {
    title: 'Welcome to learner-web-app',
    description:
      'Learner web app is a platform for users to learn and grow by consuming educational content',
    images: [
      {
        url: `/logo.png`,
        width: 800,
        height: 600,
      },
    ],
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head />
      <body>
        <MuiThemeProvider>{children}</MuiThemeProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
