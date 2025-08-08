// app/skiaFretboard.tsx
import { Canvas, Circle, Line, Rect } from "@shopify/react-native-skia";
import React, { useCallback, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

/**
 * Why: use the new Gesture API and keep fonts in RN for reliable labels.
 */

const FRETS = 12; // frets after the nut
const STRINGS = 6;

const inlayFrets = [3, 5, 7, 9];
const doubleDotFret = 12;
const openStringArea = 90; // reserved column for open strings (fret 0)
const OPEN_GAP = 4; // visual gap after open column

const stringGauges = [1.3, 1.6, 1.8, 2.4, 3.2, 4];

// --- Note engine ---
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TUNING = ["E2", "A2", "D3", "G3", "B3", "E4"].reverse();
/** FRETBOARD_MAP[stringIndex][fret] with fret in [0..FRETS] */
const FRETBOARD_MAP = TUNING.map((openNote, stringIndex) => {
  const noteBase = openNote.slice(0, -1);
  const octaveBase = parseInt(openNote.slice(-1), 10);
  const startIndex = NOTES.indexOf(noteBase);
  return Array.from({ length: FRETS + 1 }, (_, fret) => {
    const totalSemis = startIndex + fret;
    const noteIndex = totalSemis % 12;
    const noteOctave = octaveBase + Math.floor(totalSemis / 12);
    const noteName = `${NOTES[noteIndex]}${noteOctave}`;
    return { fret, stringIndex, noteName, baseNote: NOTES[noteIndex] };
  });
});

// --- UX constants for notes ---
const NOTE_RADIUS = 10;
const NOTE_BORDER = 1; // white border thickness

export default function SkiaFretboard() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const screenWidth = isLandscape ? width : height;
  const screenHeight = isLandscape ? height : width;

  // Layout
  const fretWidth = (screenWidth * 1.1) / FRETS;
  const fretboardWidth = fretWidth * FRETS;
  const fretboardHeight = screenHeight * 0.6;

  // String placement
  const edgePadding = 20;
  const highE_Y = edgePadding;
  const lowE_Y = fretboardHeight - edgePadding;
  const stringSpacing = (lowE_Y - highE_Y) / (STRINGS - 1);

  // State
  const [targetNote, setTargetNote] = useState<string>("G");
  const [pressedNotes, setPressedNotes] = useState<
    { stringIndex: number; fret: number; correct: boolean; note: string }[]
  >([]);

  const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

  // x/y → fretIndex/stringIndex (relative to the gesture container, which includes open column + gap + canvas)
  const xyToCell = useCallback(
    (x: number, y: number) => {
      const totalWidth = openStringArea + OPEN_GAP + fretboardWidth;
      if (x < 0 || x > totalWidth || y < 0 || y > fretboardHeight) return null;

      const stringIndex = clamp(Math.round((y - highE_Y) / stringSpacing), 0, STRINGS - 1);

      // Open strings live in the left reserved area (including the small gap)
      let fretIndex: number;
      if (x <= openStringArea + OPEN_GAP) {
        fretIndex = 0;
      } else {
        const localX = x - (openStringArea + OPEN_GAP);
        fretIndex = 1 + Math.floor(localX / fretWidth);
        fretIndex = clamp(fretIndex, 1, FRETS);
      }

      return { fretIndex, stringIndex };
    },
    [fretWidth, stringSpacing, highE_Y, fretboardWidth]
  );

  const handleTap = useCallback(
    (x: number, y: number) => {
      const cell = xyToCell(x, y);
      if (!cell) return;
      const { fretIndex, stringIndex } = cell;
      const data = FRETBOARD_MAP[stringIndex][fretIndex];
      const correct = data.baseNote === targetNote;
      setPressedNotes((prev) => [
        ...prev,
        { fret: fretIndex, stringIndex, correct, note: data.noteName },
      ]);
    },
    [xyToCell, targetNote]
  );

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .maxDuration(400)
        .onEnd((e) => {
          'worklet';
          runOnJS(handleTap)(e.x, e.y);
        }),
    [handleTap]
  );

  // Precompute string centers for draw
  const stringY = useMemo(
    () => Array.from({ length: STRINGS }, (_, i) => highE_Y + i * stringSpacing),
    [stringSpacing, highE_Y]
  );

  // Helper: map fret index -> cx pixel including open area
  const fretToCx = (fret: number) =>
    fret === 0
      ? (openStringArea + OPEN_GAP) / 2
      : openStringArea + OPEN_GAP + (fret - 0.5) * fretWidth;

  const restart = useCallback(() => {
    setPressedNotes([]);
    // keep target constant for drills; change if desired:
    // setTargetNote(pickRandomTarget());
  }, []);

  const hardReload = useCallback(async () => {
    try {
      const Updates = await import('expo-updates');
      if (Updates?.reloadAsync) await Updates.reloadAsync();
    } catch {
      // no-op if expo-updates isn't installed
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarText}>🎵 Fretboard Ninja</Text>
        <Text style={{ color: "#fff" }}>
          Target: {targetNote} — taps mark green if correct, red otherwise
        </Text>
        <View style={styles.actionsRow}>
          <Text onPress={restart} style={styles.actionButton}>Restart</Text>
          <Text onPress={hardReload} style={[styles.actionButton, { marginLeft: 8 }]}>Reload</Text>
        </View>
      </View>

      <ScrollView horizontal>
        <GestureDetector gesture={tap}>
          <View style={styles.fretboardRow}>
            {/* Open string column */}
            <View
              style={{
                width: openStringArea,
                height: fretboardHeight,
                backgroundColor: "#fff",
                marginRight: OPEN_GAP,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text>Open</Text>
            </View>

            {/* Skia canvas (nut + frets start after open area visually) */}
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
                  marginBottom: 30,
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
              >
                {/* Board base */}
                <Rect x={0} y={0} width={fretboardWidth} height={fretboardHeight} />

                {/* Nut */}
                <Line p1={{ x: 0, y: 0 }} p2={{ x: 0, y: fretboardHeight }} strokeWidth={15} color="#4514a7" />

                {/* Frets */}
                {Array.from({ length: FRETS }).map((_, i) => (
                  <Line
                    key={`fret-${i + 1}`}
                    p1={{ x: (i + 1) * fretWidth, y: 0 }}
                    p2={{ x: (i + 1) * fretWidth, y: fretboardHeight }}
                    strokeWidth={2}
                    color="#b88746"
                  />
                ))}

                {/* Strings */}
                {stringY.map((y, i) => (
                  <Line
                    key={`string-${i}`}
                    p1={{ x: 0, y }}
                    p2={{ x: fretboardWidth, y }}
                    strokeWidth={stringGauges[i]}
                    color="#d0cbcb"
                  />
                ))}

                {/* Inlays */}
                {Array.from({ length: FRETS }).map((_, i) => {
                  const fretNum = i + 1;
                  const centerX = i * fretWidth + fretWidth / 2;

                  if (inlayFrets.includes(fretNum)) {
                    return (
                      <Circle key={`dot-${fretNum}`} cx={centerX} cy={fretboardHeight / 2} r={8} color="#8b5e3c" />
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

                {/* Pressed notes (fretted) with thin white border */}
                {pressedNotes.map(({ fret, stringIndex, correct }, idx) => (
                  fret > 0 ? (
                    <React.Fragment key={`note-${idx}`}>
                      <Circle
                        cx={(fret - 0.5) * fretWidth}
                        cy={stringY[stringIndex]}
                        r={NOTE_RADIUS + NOTE_BORDER}
                        color="#FFFFFF"
                      />
                      <Circle
                        cx={(fret - 0.5) * fretWidth}
                        cy={stringY[stringIndex]}
                        r={NOTE_RADIUS}
                        color={correct ? "#10B981" : "#EF4444"}
                      />
                    </React.Fragment>
                  ) : null
                ))}
              </Canvas>

              {/* Overlay: static open markers + labels for pressed notes */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: -(openStringArea + OPEN_GAP),
                  top: 0,
                  width: openStringArea + OPEN_GAP + fretboardWidth,
                  height: fretboardHeight,
                }}
              >
                {/* Static open string markers with labels */}
                {Array.from({ length: STRINGS }).map((_, stringIndex) => {
                  const cx = (openStringArea + OPEN_GAP) / 2;
                  const cy = stringY[stringIndex];
                  const base = FRETBOARD_MAP[stringIndex][0];
                  return (
                    <View key={`open-${stringIndex}`} style={{ position: "absolute", left: cx - NOTE_RADIUS, top: cy - NOTE_RADIUS }}>
                      <View
                        style={{
                          position: "absolute",
                          width: (NOTE_RADIUS + NOTE_BORDER) * 2,
                          height: (NOTE_RADIUS + NOTE_BORDER) * 2,
                          borderRadius: NOTE_RADIUS + NOTE_BORDER,
                          backgroundColor: "#FFFFFF",
                          left: -NOTE_BORDER,
                          top: -NOTE_BORDER,
                        }}
                      />
                      <View
                        style={{
                          position: "absolute",
                          width: NOTE_RADIUS * 2,
                          height: NOTE_RADIUS * 2,
                          borderRadius: NOTE_RADIUS,
                          backgroundColor: "#6B7280", // neutral
                        }}
                      />
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700", textAlign: "center", width: NOTE_RADIUS * 2 }}>
                        {base.baseNote}
                      </Text>
                    </View>
                  );
                })}

                {/* Labels for pressed notes (open + fretted) */}
                {pressedNotes.map(({ fret, stringIndex, correct, note }, idx) => {
                  const cx = fretToCx(fret);
                  const cy = stringY[stringIndex];
                  return (
                    <View key={`label-${idx}`} style={{ position: "absolute", left: cx - NOTE_RADIUS, top: cy - NOTE_RADIUS }}>
                      {/* If open note pressed, draw highlight ring + fill over static marker */}
                      {fret === 0 && (
                        <>
                          <View
                            style={{
                              position: "absolute",
                              width: (NOTE_RADIUS + NOTE_BORDER) * 2,
                              height: (NOTE_RADIUS + NOTE_BORDER) * 2,
                              borderRadius: NOTE_RADIUS + NOTE_BORDER,
                              backgroundColor: "#FFFFFF",
                              left: -NOTE_BORDER,
                              top: -NOTE_BORDER,
                            }}
                          />
                          <View
                            style={{
                              position: "absolute",
                              width: NOTE_RADIUS * 2,
                              height: NOTE_RADIUS * 2,
                              borderRadius: NOTE_RADIUS,
                              backgroundColor: correct ? "#10B981" : "#EF4444",
                            }}
                          />
                        </>
                      )}
                      <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700", textAlign: "center", width: NOTE_RADIUS * 2 }}>
                        {note}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </GestureDetector>
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
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
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
  actionsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  actionButton: {
    color: '#fff',
    backgroundColor: '#444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
