import { useState, useEffect } from 'react';
import { syncPendingActions, getPendingActions } from '../lib/offlineQueue';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setSyncing(true);
      try {
        await syncPendingActions(async (action) => {
          // Handler de sync seria injetado aqui
          console.log('Sincronizando ação:', action.type);
        });
        setPendingCount(0);
      } catch (e) {
        // silent
      } finally {
        setSyncing(false);
      }
    };

    const handleOffline = async () => {
      setIsOnline(false);
      const pending = await getPendingActions();
      setPendingCount(pending.length);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !syncing) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: syncing ? '#1A7F56' : '#E5A44D',
      color: '#fff',
      textAlign: 'center',
      padding: '6px 16px',
      fontSize: '13px',
      fontWeight: 500,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {syncing
        ? 'Sincronizando dados...'
        : `Sem conexão${pendingCount > 0 ? ` — ${pendingCount} ação(ões) pendente(s)` : ' — dados serão sincronizados ao reconectar'}`
      }
    </div>
  );
}
