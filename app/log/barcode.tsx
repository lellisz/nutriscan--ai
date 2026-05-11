import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import { Colors, fonts, fontSizes } from '@/constants/design';
import { lookupBarcode } from '@/services/barcode';

export default function BarcodeScreen() {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const hasPermission = permission?.granted ?? null;

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    setScanned(true);

    try {
      const food = await lookupBarcode(data);
      if (food) {
        router.push({
          pathname: '/log/result',
          params: { foodJson: JSON.stringify(food) },
        });
      } else {
        Alert.alert(
          'Produto nao encontrado',
          'Adicione manualmente',
          [
            {
              text: 'OK',
              onPress: () => router.push('/log/add'),
            },
          ]
        );
      }
    } catch {
      Alert.alert('Erro', 'Nao foi possivel buscar o produto');
      setScanned(false);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.statusText}>Solicitando permissao...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.permissionBox}>
          <Text style={styles.permTitle}>Camera necessaria</Text>
          <Text style={styles.permDesc}>
            Para escanear codigos de barras, precisamos de acesso a sua camera.
          </Text>
          <Pressable style={styles.btn} onPress={requestPermission}>
            <Text style={styles.btnText}>CONCEDER PERMISSAO</Text>
          </Pressable>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.link}>VOLTAR</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'qr', 'code128', 'code39'] }}
        style={StyleSheet.absoluteFillObject}
        facing="back"
      />

      {/* Overlay */}
      <View style={[styles.overlay, { paddingTop: insets.top + 12 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Text style={styles.closeText}>x</Text>
          </Pressable>
          <Text style={styles.headerTitle}>ESCANEAR CODIGO</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Viewfinder */}
        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>

        <Text style={styles.hint}>Posicione o codigo de barras na area</Text>

        {/* Bottom button */}
        <View style={styles.bottomArea}>
          <Pressable
            style={styles.manualBtn}
            onPress={() => router.push('/log/add')}
          >
            <Text style={styles.manualBtnText}>DIGITAR CODIGO MANUALMENTE</Text>
          </Pressable>

          {scanned && (
            <Pressable
              style={styles.rescanBtn}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanBtnText}>ESCANEAR NOVAMENTE</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 24;
const CORNER_WIDTH = 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  statusText: {
    color: Colors.t3,
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: 100,
  },
  permissionBox: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  permTitle: {
    fontFamily: fonts.serifLight,
    fontSize: fontSizes['2xl'],
    color: Colors.t1,
  },
  permDesc: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: Colors.t3,
    lineHeight: 20,
  },
  btn: {
    borderWidth: 1,
    borderColor: Colors.t1,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: Colors.t1,
    letterSpacing: 3,
  },
  link: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.sm,
    color: Colors.t3,
    textAlign: 'center',
    marginTop: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'space-between',
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: Colors.t1,
    fontSize: 18,
  },
  headerTitle: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: Colors.t1,
    letterSpacing: 3,
  },
  viewfinder: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: Colors.t1,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: Colors.t1,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderColor: Colors.t1,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderColor: Colors.t1,
  },
  hint: {
    fontFamily: fonts.sansLight,
    fontSize: fontSizes.xs,
    color: 'rgba(232,223,208,0.6)',
    textAlign: 'center',
    letterSpacing: 1,
  },
  bottomArea: {
    paddingHorizontal: 24,
    gap: 12,
  },
  manualBtn: {
    borderWidth: 1,
    borderColor: Colors.b2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  manualBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: Colors.t2,
    letterSpacing: 2,
  },
  rescanBtn: {
    borderWidth: 1,
    borderColor: Colors.t1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 8,
  },
  rescanBtnText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSizes.xs,
    color: Colors.t1,
    letterSpacing: 2,
  },
});
