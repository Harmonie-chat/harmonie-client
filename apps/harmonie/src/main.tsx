import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import './styles/index.css';
import './i18n';
import { router } from './routes';
import { AuthProvider } from './features/auth/AuthContext';
import { UserProvider } from './features/user/UserContext';
import { ThemeProvider } from './features/user/ThemeContext';
import { RealtimeProvider } from './features/realtime/RealtimeContext';
import { AudioInputProvider } from './features/user/audio/AudioInputContext';
import { AudioOutputProvider } from './features/user/audio/AudioOutputContext';
import { VideoInputProvider } from './features/user/video/VideoInputContext';
import { PwaInstallPrompt } from './shared/pwa/PwaInstallPrompt';
import { registerServiceWorker } from './shared/pwa/registerServiceWorker';
import { syncKeyboardInset } from './shared/viewport/keyboardInset';
import { preventAppZoom } from './shared/viewport/preventAppZoom';
import { PushNotificationProvider } from './shared/notifications/PushNotificationContext';

document.addEventListener('contextmenu', (e) => e.preventDefault());
registerServiceWorker();
syncKeyboardInset();
preventAppZoom();

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <AuthProvider>
      <UserProvider>
        <PushNotificationProvider>
          <AudioInputProvider>
            <AudioOutputProvider>
              <VideoInputProvider>
                <RealtimeProvider>
                  <RouterProvider router={router} />
                  <PwaInstallPrompt />
                </RealtimeProvider>
              </VideoInputProvider>
            </AudioOutputProvider>
          </AudioInputProvider>
        </PushNotificationProvider>
      </UserProvider>
    </AuthProvider>
  </ThemeProvider>
);
