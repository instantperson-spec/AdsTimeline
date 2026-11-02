'use client';

import React from 'react';
import { AppDialogProvider } from '@/components/app-dialog/AppDialogProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AppDialogProvider>{children}</AppDialogProvider>;
}
