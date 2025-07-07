
import React from 'react';
import { StyleSheet, View } from 'react-native';
import SkiaFretboard from './skiaFretboard';

export default function Index() {
  return (
    <View style={styles.container}>
      <SkiaFretboard />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderColor: '#009',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
});


