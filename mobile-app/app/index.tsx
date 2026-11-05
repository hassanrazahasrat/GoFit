import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';

const GOFIT_URL = 'https://waqasali-dev1.github.io/GoFit';

export default function App() {
  return (
    <>
      <StatusBar style={Platform.OS === 'ios' ? 'dark' : 'auto'} />
      <WebView
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
        pullToRefreshEnabled={false}
        onShouldStartLoadWithRequest={(req) => {
          // Keep all navigation inside the WebView (OAuth redirects, etc.)
          return true;
        }}
      />
    </>
  );
}
