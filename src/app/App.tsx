import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { CreateTeamScreen } from './components/CreateTeamScreen';
import { JoinTeamScreen } from './components/JoinTeamScreen';
import { AppLayout } from './components/AppLayout';
import { MemberAppLayout } from './components/MemberAppLayout';
import { useAuth } from './context/AuthContext';

type Screen = 'login' | 'createTeam' | 'joinTeam' | 'app';
type Role = 'leader' | 'member';

export default function App() {
  const { user, token, logout } = useAuth();

  const [screen, setScreen] = useState<Screen>(() =>
    user && token ? 'app' : 'login'
  );
  const [role, setRole] = useState<Role>(() =>
    user?.role === 'LEADER' ? 'leader' : user ? 'member' : 'leader'
  );

  const handleLogin = (r: Role) => {
    setRole(r);
    setScreen('app');
  };

  const handleLogout = () => {
    logout();
    setScreen('login');
  };

  if (screen === 'login') {
    return (
      <LoginScreen
        onLogin={handleLogin}
        onCreateTeam={() => setScreen('createTeam')}
        onJoinTeam={() => setScreen('joinTeam')}
      />
    );
  }

  if (screen === 'createTeam') {
    return (
      <CreateTeamScreen
        onSuccess={() => { setRole('leader'); setScreen('app'); }}
        onBack={() => setScreen('login')}
      />
    );
  }

  if (screen === 'joinTeam') {
    return (
      <JoinTeamScreen
        onSuccess={() => { setRole('member'); setScreen('app'); }}
        onBack={() => setScreen('login')}
      />
    );
  }

  if (role === 'member') {
    return <MemberAppLayout onLogout={handleLogout} />;
  }

  return <AppLayout onLogout={handleLogout} />;
}
