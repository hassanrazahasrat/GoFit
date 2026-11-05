import { useCallback, useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { fetchHealthData } from '../services/health';

const GOFIT_URL = 'https://waqasali-dev1.github.io/GoFit';
const SYNC_INTERVAL_MS = 10 * 60 * 1000;

export default function App() {
  const webViewRef = useRef<any>(null);
  const pageReady = useRef(false);

  const syncHealth = useCallback(async () => {
    if (!pageReady.current) return;
    const data = await fetchHealthData();
    if (!data) return;
    const hasData =
      Object.keys(data.steps).length > 0 || data.weight || data.workouts.length > 0;
    if (!hasData) return;
    webViewRef.current?.injectJavaScript(
      `window.__gofitHealth&&window.__gofitHealth(${JSON.stringify(data)});true;`,
    );
  }, []);

  useEffect(() => {
    syncHealth();
    const interval = setInterval(syncHealth, SYNC_INTERVAL_MS);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') syncHealth();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, [syncHealth]);

  return (
    <>
      <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
      <WebView
        ref={webViewRef}
        source={{ uri: GOFIT_URL }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsBackForwardNavigationGestures
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        injectedJavaScriptBeforeContentLoaded={`
          (function(){
            var apply=function(){
              var m=document.querySelector('meta[name="viewport"]');
              if(!m){m=document.createElement('meta');m.name='viewport';document.head.appendChild(m)}
              m.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
            };
            if(document.head)apply();else document.addEventListener('DOMContentLoaded',apply);
            document.addEventListener('gesturestart',function(e){e.preventDefault()});
            document.addEventListener('gesturechange',function(e){e.preventDefault()});
          })();
          true;
        `}
        onLoadEnd={() => {
          pageReady.current = true;
          // Give the page a moment to boot, then push health data
          setTimeout(syncHealth, 1500);
        }}
        onShouldStartLoadWithRequest={() => true}
      />
    </>
  );
}
