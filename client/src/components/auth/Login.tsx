import type { FC } from 'react';
import AuthFlip from './AuthFlip';

export const Login: FC = () => {
  return <AuthFlip initialMode="login" />;
};
