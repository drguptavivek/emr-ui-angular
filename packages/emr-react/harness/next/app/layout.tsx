import type { ReactNode } from 'react';
import { RNWStyleRegistry } from './rnw-style-registry';

export const metadata = { title: 'emr-react harness' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        <RNWStyleRegistry>{children}</RNWStyleRegistry>
      </body>
    </html>
  );
}
