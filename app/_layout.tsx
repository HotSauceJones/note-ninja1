

import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function Layout() {
  return (
    <SafeAreaProvider>
      <Slot />
    </SafeAreaProvider>
  );
}





// import { Stack } from "expo-router";

// export default function RootLayout() {
//   return <Stack />;
// }
