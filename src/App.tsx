import React, { useEffect } from 'react';

import { AppProvider } from '@/app/AppProvider';
import { AppNavigator } from '@/navigation/AppNavigator';
import notificationService from '@/services/NotificationService';
import offlineService from '@/services/OfflineService';

const App: React.FC = () => {
  useEffect(() => {
    notificationService.initialize();
    offlineService.initialize();
  }, []);

  return (
    <AppProvider>
      <AppNavigator />
    </AppProvider>
  );
};

export default App;
