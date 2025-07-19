// SkiaFretboard.tsx
import { Canvas, Circle, Line, Rect } from '@shopify/react-native-skia';
import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

const FRETS = 12;
const STRINGS = 6;

const inlayFrets = [3, 5, 7, 9];
const doubleDotFret = 12;
const openStringArea = 80;

// Realistic string gauges for .056 to .013 range
const stringGauges = [1.0, 1.4, 1.8, 2.4, 3.2, 4];

export default function SkiaFretboard() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const screenWidth = isLandscape ? width : height;
  const screenHeight = isLandscape ? height : width;

  const fretboardWidth = screenWidth * 0.90;
  const fretboardHeight = screenHeight * 0.60;
  const fretWidth = fretboardWidth / FRETS;
  const stringSpacing = fretboardHeight / (STRINGS + 1);
  const totalScrollWidth = openStringArea + fretboardWidth + 30;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>🎵 Fretboard Ninja</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
        <View style={[styles.fretboardRow, { width: totalScrollWidth }]}>
          <Pressable
            onPress={() => console.log('Pressed open string area')}
            style={{
              width: openStringArea,
              height: fretboardHeight,
              backgroundColor: '#fff',
              marginRight: 4
            }}
          />

          <View style={[styles.fretboardContainer, {
            width: fretboardWidth,
            height: fretboardHeight,
            borderWidth: 2,
            borderColor: '#000',
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 50
          }]}> 
            <Canvas style={{ width: fretboardWidth, height: fretboardHeight, borderRadius: 8 }}>
              {/* Nut */}
              <Line
                p1={{ x: 0, y: 0 }}
                p2={{ x: 0, y: fretboardHeight }}
                strokeWidth={20}
                color="#4514a7"
              />

              {/* Fretboard wood */}
              {/* <Rect x={0} y={0} width={fretboardWidth} height={fretboardHeight} color="#f5e7ad" /> */}
              <Rect x={15} y={0} width={fretboardWidth - 15} height={fretboardHeight} color="#f5e7ad" />

              {/* Frets */}
              {Array.from({ length: FRETS + 1 }).map((_, i) => (
                <Line
                  key={`fret-${i}`}
                  p1={{ x: i * fretWidth, y: 0 }}
                  p2={{ x: i * fretWidth, y: fretboardHeight }}
                  strokeWidth={2}
                  color="#b88746"
                />
              ))}

              {/* Strings */}
              {Array.from({ length: STRINGS }).map((_, i) => {
                const y = (i + 1) * stringSpacing;
                return (
                  <Line
                    key={`string-${i}`}
                    p1={{ x: 0, y }}
                    p2={{ x: fretboardWidth, y }}
                    strokeWidth={stringGauges[i]}
                    color="#d0cbcb"
                  />
                );
              })}

              {/* Inlays */}
              {Array.from({ length: FRETS }).map((_, i) => {
                const fretNum = i + 1;
                const centerX = i * fretWidth + fretWidth / 2;

                if (inlayFrets.includes(fretNum)) {
                  return (
                    <Circle
                      key={`dot-${fretNum}`}
                      cx={centerX}
                      cy={fretboardHeight / 2}
                      r={6}
                      color="#8b5e3c"
                    />
                  );
                } else if (fretNum === doubleDotFret) {
                  const y1 = (1 + 1.5) * stringSpacing;
                  const y2 = (3 + 1.5) * stringSpacing;
                  return (
                    <React.Fragment key={`dot-${fretNum}`}>
                      <Circle cx={centerX} cy={y1} r={6} color="#8b5e3c" />
                      <Circle cx={centerX} cy={y2} r={6} color="#8b5e3c" />
                    </React.Fragment>
                  );
                }
                return null;
              })}
            </Canvas>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  topBar: {
    width: '100%',
    height: 80,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 17
  },
  topBarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  fretboardContainer: {
    backgroundColor: '#fbe8c5'
  },
  fretboardRow: {
    flexDirection: 'row',
    alignItems: 'center'
  }
});
