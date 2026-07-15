import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { fetchBarcodeDetails } from '../../api/apiService';
import { Colors } from '../../constants/colors';
import { useScanner } from '../../context/ScannerContext';
import { logger } from '../../utils/logger';

/* ---------- constants ---------- */
const { width: screenWidth } = Dimensions.get('window');
const boxSize = screenWidth * 0.7;
const DUPLICATE_TIMEOUT = 2000;   // ms — ignore same barcode rescanned within this window
const RESET_SCANNED_TIMEOUT = 3000;  // ms — clear lastScanned so same code can fire again

/* ---------- barcode classification (shared camera + external) ---------- */
// Mirrors Java AppConstants + CommonUtils.getBarcodeType() exactly:
//   length == 5          → rack
//   length == 6          → date
//   length >= 20 + "23009" → article
//   length >= 20           → pallet / fabric (context decides)
//   anything else          → null (unknown)
const RACK_LENGTH    = 5;
const DATE_LENGTH    = 6;
const PALLET_LENGTH  = 20;
const SUPPLIER_CODE  = '23009';

const classifyRaw = (raw) => {
  if (!raw) return null;
  if (raw.length === RACK_LENGTH)  return 'rack';
  if (raw.length === DATE_LENGTH)  return 'date';
  if (raw.length >= PALLET_LENGTH) return raw.includes(SUPPLIER_CODE) ? 'article' : 'pallet';
  return null; // unknown — let the API or parent decide
};

/* ---------- helper: barcode centroid inside the scan box ---------- */
// containerHeight = actual rendered height of the scanner View (not full screen)
const isCentreInBox = (points, containerHeight) => {
  const len = points.length;
  if (!len) return false;
  const centre = points.reduce(
    (acc, p) => ({ x: acc.x + p.x / len, y: acc.y + p.y / len }),
    { x: 0, y: 0 }
  );
  const left = (screenWidth - boxSize) / 2;
  const top = (containerHeight - boxSize) / 2;
  const right = left + boxSize;
  const bottom = top + boxSize;
  return centre.x >= left && centre.x <= right &&
    centre.y >= top && centre.y <= bottom;
};

/* ---------- component ---------- */
const ScannerScreen = forwardRef(({
  onScanSuccess,
  onScanError,
  skipBarcodeDetailsApi = false,
}, ref) => {

  // Expose focusInput() so parent screens can re-focus after bottom sheet opens
  useImperativeHandle(ref, () => ({
    focusInput: () => {
      if (inputRef.current) {
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
  }));
  const { scannerType } = useScanner();
  const [permission, requestPermission] = useCameraPermissions();

  const [scanned, setScanned] = useState(false);
  const [externalInput, setExternalInput] = useState('');
  const externalInputRef = useRef(''); // ref copy — never blocked by scanned/isLoading state
  const [isLoading, setIsLoading] = useState(false);
  const [showDuplicateAlert, setShowDuplicateAlert] = useState(false);

  // ── real container height — fixes the ROI / isCentreInBox offset bug ──────
  const [containerHeight, setContainerHeight] = useState(
    Dimensions.get('window').height  // safe initial fallback
  );

  const lastScanned = useRef({ data: null, timestamp: 0 });
  const soundRef = useRef(null);
  const resetTimerRef = useRef(null);
  const duplicateTimerRef = useRef(null);
  const inputRef = useRef(null);

  /* ---------- lifecycle ---------- */
  useEffect(() => {
    loadSound();
    return () => {
      soundRef.current?.unloadAsync();
      clearTimers();
    };
  }, []);

  const clearTimers = () => {
    clearTimeout(resetTimerRef.current);
    clearTimeout(duplicateTimerRef.current);
  };

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/My/beep.mp3')
      );
      soundRef.current = sound;
    } catch (error) {
      logger.error('[SCANNER] Error loading sound:', error);
    }
  };

  /* ---------- shared helpers ---------- */
  const playBeep = () =>
    soundRef.current?.replayAsync().catch(e => logger.error('[SCANNER] Sound error:', e));

  const isDuplicate = (clean) => {
    const now = Date.now();
    if (
      lastScanned.current.data === clean &&
      now - lastScanned.current.timestamp < DUPLICATE_TIMEOUT
    ) {
      setShowDuplicateAlert(true);
      duplicateTimerRef.current = setTimeout(() => setShowDuplicateAlert(false), 1000);
      return true;
    }
    lastScanned.current = { data: clean, timestamp: now };
    return false;
  };

  const resetScanner = () => {
    setScanned(false);
    setExternalInput('');
    externalInputRef.current = '';
    setIsLoading(false);
    clearTimers();
    resetTimerRef.current = setTimeout(() => {
      lastScanned.current = { data: null, timestamp: 0 };
    }, RESET_SCANNED_TIMEOUT);
  };

  /* ---------- camera scan handler ---------- */
  const handleCameraScan = async ({ type, data, cornerPoints }) => {
    if (scanned || isLoading) return;
    if (!isCentreInBox(cornerPoints, containerHeight)) return;

    const clean = data.trim().replace(/[\r\n]/g, '');
    if (isDuplicate(clean)) return;

    setScanned(true);
    setIsLoading(true);
    playBeep();
    logger.log('[SCANNER] Camera scanned:', clean);

    try {
      const knownType = classifyRaw(clean);
      if (knownType) {
        onScanSuccess({ type, data: clean, barcodeDetails: { type: knownType } });
        return;
      }

      // Unknown — call API unless skipped
      let barcodeDetails = null;
      if (!skipBarcodeDetailsApi) {
        try {
          barcodeDetails = await fetchBarcodeDetails(clean);
        } catch (err) {
          logger.error('[SCANNER] API error:', err);
        }
      }
      onScanSuccess({ type, data: clean, barcodeDetails });

    } catch (error) {
      logger.error('[SCANNER] Camera error:', error);
      onScanError?.(error);
    } finally {
      resetScanner();
    }
  };

  /* ---------- external scanner handler ---------- */
  const handleExternalSubmit = () => {
    // Read from ref — guaranteed to have the full barcode regardless of render state
    // Mirror Java dispatchKeyEvent: replaceAll("[^A-Za-z0-9!#$%&(){|}~:;<=>?@*+,./^_`\'\" \t\r\n\f-]","")
    const clean = externalInputRef.current
      .replace(/[^A-Za-z0-9!#$%&(){|}~:;<=>?@*+,./^_`'" \t\r\n\f-]/g, '')
      .replace(/[\r\n]/g, '')
      .trim();
    if (!clean || scanned || isLoading) return;
    if (isDuplicate(clean)) {
      setExternalInput('');
      externalInputRef.current = '';
      return;
    }

    setScanned(true);
    setIsLoading(true);
    playBeep();
    logger.log('[SCANNER] External scanned:', clean);

    const knownType = classifyRaw(clean);
    onScanSuccess({
      type: 'external',
      data: clean,
      barcodeDetails: knownType ? { type: knownType } : null,
    });
    resetScanner();
  };

  /* ---------- permission handling ---------- */
  if (scannerType === 'Camera Scanner' && !permission) {
    return <Text>Requesting camera permission…</Text>;
  }
  if (scannerType === 'Camera Scanner' && !permission.granted) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ---------- ROI — based on real containerHeight, not screenHeight ---------- */
  const roiX = (screenWidth - boxSize) / 2 / screenWidth;
  const roiY = (containerHeight - boxSize) / 2 / containerHeight;
  const roiWidth = boxSize / screenWidth;
  const roiHeight = boxSize / containerHeight;

  /* ---------- UI ---------- */
  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
    >
      {scannerType === 'Camera Scanner' ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            onBarcodeScanned={scanned ? undefined : handleCameraScan}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr', 'pdf417', 'aztec', 'code128', 'code39', 'code93',
                'codabar', 'ean13', 'ean8', 'itf14', 'upc_a', 'upc_e',
                'datamatrix', 'interleaved2of5',
              ],
              regionOfInterest: { x: roiX, y: roiY, width: roiWidth, height: roiHeight },
            }}
          />

          {/* scan box overlay */}
          <View style={styles.overlay}>
            <View style={styles.topOverlay} />
            <View style={styles.middleRow}>
              <View style={styles.sideOverlay} />
              <View style={styles.scanBox} />
              <View style={styles.sideOverlay} />
            </View>
            <View style={styles.bottomOverlay} />
          </View>

          {/* {showDuplicateAlert && (
            <View style={styles.duplicateAlert}>
              <Text style={styles.duplicateAlertText}>Already scanned!</Text>
            </View>
          )} */}

          {scanned && (
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, isLoading && styles.statusBadgeLoading]}>
                <Ionicons
                  name={isLoading ? 'refresh' : 'checkmark-sharp'}
                  size={30}
                  color={Colors.white}
                />
              </View>
            </View>
          )}
        </>
      ) : (
        /* ---------- External Scanner UI ---------- */
        <View style={styles.center}>
          <Ionicons name="barcode-outline" size={52} color={Colors.primary} />
          <Text style={styles.externalTitle}>External Scanner Mode</Text>
          <Text style={styles.externalText}>
            Point your external scanner at a barcode.{'\n'}
            Ready for multiple scans.
          </Text>

          {showDuplicateAlert && (
            <View style={styles.duplicateAlert}>
              <Text style={styles.duplicateAlertText}>Already scanned!</Text>
            </View>
          )}

          {scanned && (
            <View style={styles.statusContainer}>
              <View style={[styles.statusBadge, isLoading && styles.statusBadgeLoading]}>
                <Ionicons
                  name={isLoading ? 'refresh' : 'checkmark-sharp'}
                  size={20}
                  color={Colors.white}
                />
                <Text style={styles.statusText}>
                  {isLoading ? ' Processing…' : ' Scanned!'}
                </Text>
              </View>
            </View>
          )}
          
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={externalInput}
            onChangeText={(t) => {
              // Always update the ref so the full barcode is captured
              // even if scanned/isLoading is true mid-scan
              externalInputRef.current = t;
              if (!scanned && !isLoading) setExternalInput(t);
            }}
            onSubmitEditing={handleExternalSubmit}
            autoFocus
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="done"
            showSoftInputOnFocus={false}
          />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, },
  // ── Camera overlay ──────────────────────────────────────────────────────────
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  topOverlay: { flex: 1, backgroundColor: Colors.overlayScanBox },
  bottomOverlay: { flex: 1, backgroundColor: Colors.overlayScanBox },
  middleRow: { height: boxSize, flexDirection: 'row' },
  sideOverlay: { flex: 1, backgroundColor: Colors.overlayScanBox },
  scanBox: { width: boxSize, height: boxSize, borderColor: Colors.white, borderWidth: 2, },
  // ── Status badge ────────────────────────────────────────────────────────────
  statusContainer: { marginTop: 20, alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, },
  statusBadgeLoading: { backgroundColor: Colors.scannerLoading },
  statusText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  // ── Duplicate alert ─────────────────────────────────────────────────────────
  duplicateAlert: { position: 'absolute', top: '30%', alignSelf: 'center', backgroundColor: Colors.scannerError, padding: 10, borderRadius: 5, zIndex: 100, },
  duplicateAlertText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
  // ── External scanner UI ─────────────────────────────────────────────────────
  externalTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, marginTop: 12, marginBottom: 6, },
  externalText: { fontSize: 15, textAlign: 'center', color: Colors.textMuted, marginBottom: 20, lineHeight: 22, },
  // TextInput must stay mounted so scanner gun can type into it
  // opacity:0 + height:0 hides it completely while keeping it functional
  hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0, },
  permissionButton: { marginTop: 12, backgroundColor: Colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, },
  permissionButtonText: { color: Colors.white, fontSize: 15, fontWeight: '600', },
  inputDisplay: { backgroundColor: Colors.infoLight, padding: 10, borderRadius: 8, marginBottom: 10, maxWidth: '80%', },
  inputText: { fontSize: 14, color: Colors.textLink, textAlign: 'center', },
});
export default ScannerScreen;
