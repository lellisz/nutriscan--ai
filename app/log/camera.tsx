import { useState, useRef } from "react";
import {
  View, Text, Pressable, StyleSheet, Alert, ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { fonts } from "@/constants/design";
import { Colors as SpecColors } from "@/constants/Colors";

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionBox}>
          <Text style={styles.permTitle}>Câmera necessária</Text>
          <Text style={styles.permDesc}>
            Para escanear alimentos, precisamos de acesso à sua câmera.
          </Text>
          <Pressable style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>PERMITIR ACESSO</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>VOLTAR</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
      if (photo?.uri) {
        router.push({ pathname: "/log/result", params: { uri: photo.uri } });
      }
    } catch {
      Alert.alert("Erro", "Não foi possível capturar a foto.");
    } finally {
      setCapturing(false);
    }
  }

  async function handleGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      router.push({ pathname: "/log/result", params: { uri: result.assets[0].uri } });
    }
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing="back">
        {/* Semi-transparent overlay */}
        <View style={styles.overlay}>
          {/* Header - absolute top */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.closeBtn}
              hitSlop={6}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
            <Text style={styles.headerTitle}>R E G I S T R A R</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Center: Viewfinder with shutter and corner guides */}
          <View style={styles.centerArea}>
            {/* Corner guides frame (260×260) */}
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>

            {/* Shutter button centered */}
            <View style={styles.shutterOuter}>
              <View style={styles.shutterInner} />
            </View>
          </View>

          {/* Bottom section */}
          <View style={styles.bottomSection}>
            <Pressable
              style={styles.captureButton}
              onPress={handleCapture}
              disabled={capturing}
            >
              {capturing ? (
                <ActivityIndicator color={SpecColors.BG} />
              ) : (
                <Text style={styles.captureButtonText}>CAPTURAR AGORA</Text>
              )}
            </Pressable>
            <Pressable onPress={handleGallery}>
              <Text style={styles.galleryLink}>ou escolha da galeria</Text>
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 2;
const FRAME_SIZE = 260;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SpecColors.BG,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },

  // Header
  header: {
    position: "absolute",
    top: 56,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  closeText: {
    color: SpecColors.WH,
    fontSize: 20,
  },
  headerTitle: {
    fontFamily: fonts.serifLight,
    fontSize: 24,
    color: SpecColors.WH,
    letterSpacing: 6,
    textAlign: "center",
  },

  // Center area
  centerArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Viewfinder (260×260 frame with corner guides)
  viewfinder: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: SpecColors.WH,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: SpecColors.WH,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: SpecColors.WH,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: SpecColors.WH,
  },

  // Shutter button (centered on screen)
  shutterOuter: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: SpecColors.WH,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SpecColors.WH,
  },

  // Bottom section
  bottomSection: {
    paddingBottom: 48,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  captureButton: {
    height: 52,
    backgroundColor: SpecColors.WH,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  captureButtonText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: SpecColors.BG,
    letterSpacing: 3,
  },
  galleryLink: {
    fontFamily: fonts.sansLight,
    fontSize: 12,
    color: SpecColors.W3,
    marginTop: 12,
    textAlign: "center",
  },

  // Permission screen
  permissionBox: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 16,
  },
  permTitle: {
    fontFamily: fonts.serifLight,
    fontSize: 24,
    color: SpecColors.WH,
  },
  permDesc: {
    fontFamily: fonts.sansLight,
    fontSize: 14,
    color: SpecColors.W3,
    lineHeight: 20,
  },
  btn: {
    borderWidth: 1,
    borderColor: SpecColors.WH,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: SpecColors.WH,
    letterSpacing: 3,
  },
  link: {
    fontFamily: fonts.sansLight,
    fontSize: 14,
    color: SpecColors.W3,
    textAlign: "center",
    marginTop: 8,
  },
});
