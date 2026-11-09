import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { fetchHealthData, type HealthPayload } from '../services/health';

const GOFIT_URL = 'https://waqasali-dev1.github.io/GoFit';

export default function App() {
  const webViewRef = useRef<any>(null);
  const [pageReady, setPageReady] = useState(false);
  const [healthData, setHealthData] = useState<HealthPayload | null>(null);

  useEffect(() => {
    fetchHealthData().then(setHealthData);
  }, []);

  useEffect(() => {
    if (pageReady && healthData) {
      const hasData =
        Object.keys(healthData.steps).length > 0 ||
        healthData.weight ||
        healthData.workouts.length > 0;
      if (hasData) {
        webViewRef.current?.injectJavaScript(
          `window.__gofitHealth&&window.__gofitHealth(${JSON.stringify(healthData)});true;`,
        );
      }
    }
  }, [healthData, pageReady]);

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
        applicationNameForUserAgent="GoFitApp"
        pullToRefreshEnabled
        startInLoadingState
        injectedJavaScriptBeforeContentLoaded={`
          window.__GOFIT_APP__=1;
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
          setPageReady(true);
        }}
        onShouldStartLoadWithRequest={() => true}
      />
    </>
  );
}
