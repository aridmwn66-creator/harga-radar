import type { ReactNode } from 'react';

// Native passthrough. The desktop "phone in a frame" layout is web-only, so on
// native (Expo Go) this renders its children unchanged. See WebFrame.web.tsx.
export function WebFrame({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
