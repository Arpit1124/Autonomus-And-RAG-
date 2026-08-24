import React from 'react';
import { UserProfile } from '../types';
import { AuthPage } from './auth/AuthPage';

interface Props {
  onLoginWithDemo: (userId: string) => Promise<void>;
  onLoginWithEmail: (email: string, password?: string) => Promise<void>;
  availableUsers: UserProfile[];
  logoutReason?: string | null;
  onLoginSuccess?: (user: UserProfile, token: string, expiresAt: number) => void;
  onLoginWithOAuth?: (provider: 'google' | 'github' | 'microsoft', payload?: any) => Promise<void>;
}

export const WaferGuardLogin: React.FC<Props> = ({
  onLoginWithDemo,
  onLoginWithEmail,
  availableUsers,
  logoutReason,
  onLoginSuccess,
  onLoginWithOAuth
}) => {
  return (
    <AuthPage
      availableUsers={availableUsers}
      logoutReason={logoutReason}
      onLoginWithOAuth={onLoginWithOAuth}
      onLoginSuccess={(user, token, expiresAt) => {
        if (onLoginSuccess) {
          onLoginSuccess(user, token, expiresAt);
        } else {
          onLoginWithEmail(user.email);
        }
      }}
    />
  );
};

