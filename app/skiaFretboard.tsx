// skiaFretboard.tsx
import {
  Canvas,
  Circle,
  Line,
  Rect
} from "@shopify/react-native-skia";
import React, { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

const FRETS = 12;
const STRINGS = 6;

const inlayFrets = [3, 5, 7, 9];
const doubleDotFret = 12;
const openStringArea = 90;

const stringGauges = [1.3, 1.6, 1.8, 2.4, 3.2, 4];
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const TUNING = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4'].reverse();

const FRETBOARD_MAP = TUNING.map((openNote, stringIndex) => {
  const noteBase = openNote.slice(0, -1);
  const octaveBase = parseInt(openNote.slice(-1), 10);
  const startIndex = NOTES.indexOf(noteBase);

  return Array.from({ length: 13 }, (_, fret) => {
    const totalSemis = startIndex + fret;
    const noteIndex = totalSemis % 12;
    const noteOctave = octaveBase + Math.floor(totalSemis / 12);
    const noteName = `${NOTES[noteIndex]}${noteOctave}`;

    return {
      fret,
      stringIndex,
      noteName,
      baseNote: NOTES[noteIndex],
    };
  });
});

export default function SkiaFretboard() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const screenWidth = isLandscape ? width : height;
  const screenHeight = isLandscape ? height : width;

  const fretWidth = (screenWidth * 1.1) / FRETS;
  const fretboardWidth = fretWidth * FRETS;
  const fretboardHeight = screenHeight * 0.6;

  const edgePadding = 20;
  const highE_Y = edgePadding;
  const lowE_Y = fretboardHeight - edgePadding;
  const stringSpacing = (lowE_Y - highE_Y) / (STRINGS - 1);

  const [targetNote, setTargetNote] = useState<string>('G');
  const [pressedNotes, setPressedNotes] = useState<{
    stringIndex: number;
    fret: number;
    correct: boolean;
  }[]>([]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>🎵 Fretboard Ninja</Text>
      </View>

      <ScrollView horizontal>
        <View style={styles.fretboardRow}>
          <Pressable
            onPress={() => console.log("Pressed open string area")}
            style={{
              width: openStringArea,
              height: fretboardHeight,
              backgroundColor: "#fff",
              marginRight: 4,
            }}
          />

          <ScrollView
            horizontal
            bounces
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View
              style={[
                styles.fretboardContainer,
                {
                  width: fretboardWidth,
                  height: fretboardHeight,
                  borderWidth: 3,
                  borderColor: "#000",
                  borderRadius: 8,
                  overflow: "hidden",
                  marginBottom: 50,
                  marginRight: 20,
                },
              ]}
            >
              <Canvas
                style={{
                  width: fretboardWidth,
                  height: fretboardHeight,
                  borderRadius: 8,
                }}
                // onTouch={({ x, y }) => {
                //   const fretIndex = Math.floor(x / fretWidth);
                //   const stringIndex = Math.round((y - highE_Y) / stringSpacing);

                //   if (
                //     fretIndex >= 0 && fretIndex <= FRETS &&
                //     stringIndex >= 0 && stringIndex < STRINGS
                //   ) {
                //     const cell = FRETBOARD_MAP[stringIndex][fretIndex];
                //     const correct = cell.baseNote === targetNote;
                //     setPressedNotes(prev => [...prev, { fret: fretIndex, stringIndex, correct }]);
                //   }
                // }}
              >
                <Rect
                  x={0}
                  y={0}
                  width={fretboardWidth}
                  height={fretboardHeight}
                  // color="#f5e7ad"
                />

                <Line
                  p1={{ x: 0, y: 0 }}
                  p2={{ x: 0, y: fretboardHeight }}
                  strokeWidth={15}
                  color="#4514a7"
                />

                {Array.from({ length: FRETS }).map((_, i) => (
                  <Line
                    key={`fret-${i + 1}`}
                    p1={{ x: (i + 1) * fretWidth, y: 0 }}
                    p2={{ x: (i + 1) * fretWidth, y: fretboardHeight }}
                    strokeWidth={2}
                    color="#b88746"
                  />
                ))}

                {Array.from({ length: STRINGS }).map((_, i) => {
                  const y = highE_Y + i * stringSpacing;
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

                {Array.from({ length: FRETS }).map((_, i) => {
                  const fretNum = i + 1;
                  const centerX = i * fretWidth + fretWidth / 2;

                  if (inlayFrets.includes(fretNum)) {
                    return (
                      <Circle
                        key={`dot-${fretNum}`}
                        cx={centerX}
                        cy={fretboardHeight / 2}
                        r={8}
                        color="#8b5e3c"
                      />
                    );
                  } else if (fretNum === doubleDotFret) {
                    const y1 = highE_Y + stringSpacing * 1.5;
                    const y2 = highE_Y + stringSpacing * 3.5;
                    return (
                      <React.Fragment key={`dot-${fretNum}`}>
                        <Circle cx={centerX} cy={y1} r={8} color="#8b5e3c" />
                        <Circle cx={centerX} cy={y2} r={8} color="#8b5e3c" />
                      </React.Fragment>
                    );
                  }
                  return null;
                })}

                {pressedNotes.map(({ fret, stringIndex, correct }, idx) => (
                  <Circle
                    key={`note-${idx}`}
                    cx={(fret + 0.5) * fretWidth}
                    cy={highE_Y + stringIndex * stringSpacing}
                    r={12}
                    color={correct ? '#0f0' : '#f00'}
                  />
                ))}
              </Canvas>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#fff",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  topBar: {
    width: "100%",
    height: 80,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 17,
  },
  topBarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  fretboardContainer: {
    backgroundColor: "#fbe8c5",
  },
  fretboardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
