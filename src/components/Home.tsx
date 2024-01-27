import { Fragment } from 'react';
import { useAuth } from '../providers/AuthProvider';

export function Home() {
  const user = useAuth();

  return (
    <Fragment>{user ? <Fragment>{`Hello ${user.email}`}</Fragment> : 'Welcome stranger'}</Fragment>
  );
}
