import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Toast from 'react-native-toast-message';
import { postPalletData } from '../../api/apiService';
import CustomHeader from '../../components/CustomHeader';
import ScannerScreen from '../../components/Scanner/ScannerScreen';
import AppSheetModal from '../../components/common/AppSheetModal';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import { Colors } from '../../constants/colors';
import { FontSize, Radius, Spacing } from '../../constants/spacing';
import { ToastDefaults } from '../../constants/toastConfig';
import { useScanner } from '../../context/ScannerContext';
import { logger } from '../../utils/logger';

import { BottomSheetFlatList } from '../../components/common/AppSheetModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const SUPPLIER_CONCAT = '2300930';        // '23009' + '30'
const SUPPLIER_CODE_INT = 23009;
const PALLET_MIN_LEN = 20;

const STEPS = ['Pallet', 'Article', 'Date Stamp', 'OC Number'];
const TABLE_HEADERS = ['Article No', 'Pieces', 'Date', 'OC No'];

// ─── Barcode classifier — mirrors Java CommonUtils.getBarcodeType ─────────────

const getType = (b) => {
  if (!b) return 'none';
  const s = b.replace(/[^a-zA-Z0-9]/g, '');
  if (/^\d{6}$/.test(s)) return 'date';
  if (s.includes(SUPPLIER_CONCAT)) return 'article';
  if (s.length >= PALLET_MIN_LEN) return 'pallet';
  return 'none';
};

// ─── Parsers — mirrors Java EntryPresenter.postPallet ────────────────────────

const parseArticle = (b) => {
  const s = b.replace(/[^A-Za-z0-9]/g, '');  // strip brackets — mirrors Java dispatchKeyEvent cleaning
  const raw = s.substring(3, 11);
  const idx = s.indexOf(SUPPLIER_CONCAT);
  const pieces = idx !== -1 ? parseInt(s.substring(idx + SUPPLIER_CONCAT.length), 10) || 0 : 0;
  const fmt = `${raw.substring(0, 3)}.${raw.substring(3, 6)}.${raw.substring(raw.length - 2)}`;
  return { raw, fmt, pieces };
};

const parseDate = (b) => parseInt(b.substring(2), 10);

// ─── Component ────────────────────────────────────────────────────────────────

const PalletWHentry = () => {
  const { scannerType } = useScanner();

  const stepRef = useRef(0);
  const [stepDisplay, setStepDisplay] = useState(0);

  const palletRef = useRef('');
  const rawArtRef = useRef('');
  const fmtArtRef = useRef('');
  const piecesRef = useRef(0);
  const dateRef = useRef(0);

  const [feedback, setFeedback] = useState({ msg: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);

  const sheetRef = useRef(null);
  const seenPallets = useRef(new Set());
  const scannerActive = useRef(true);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const ok = (msg) => setFeedback({ msg, type: 'ok' });
  const err = (msg) => {
    setFeedback({ msg, type: 'err' });
    Toast.show({ ...ToastDefaults, type: 'error', text1: 'Scan error', text2: msg });
  };

  const advance = (n) => { stepRef.current = n; setStepDisplay(n); };

  const reset = useCallback(() => {
    palletRef.current = rawArtRef.current = fmtArtRef.current = '';
    piecesRef.current = dateRef.current = 0;
    setFeedback({ msg: '', type: '' });
    advance(0);
    scannerActive.current = true;
  }, []);

  // ── Step handlers ──────────────────────────────────────────────────────────

  const step0 = (b) => {
    if (getType(b) !== 'pallet') { err('Please scan a PALLET barcode.'); return; }
    if (seenPallets.current.has(b)) { err('Pallet already scanned.'); return; }
    palletRef.current = b;
    ok('Pallet ✓ — now scan Article');
    advance(1);
  };

  const step1 = (b) => {
    if (getType(b) !== 'article') { err('Please scan an ARTICLE barcode.'); return; }
    const { raw, fmt, pieces } = parseArticle(b);
    rawArtRef.current = raw;
    fmtArtRef.current = fmt;
    piecesRef.current = pieces;
    ok(`Article ✓ (${raw}, ${pieces} pcs) — now scan Date Stamp`);
    advance(2);
  };

  const step2 = (b) => {
    if (getType(b) !== 'date') { err('Please scan a DATE STAMP barcode (6 digits).'); return; }
    dateRef.current = parseDate(b);
    ok(`Date ✓ (${dateRef.current}) — now scan OC Number`);
    advance(3);
  };

  const step3 = async (b) => {
    if (!/^(ID|BD)/i.test(b) || b.length !== 7) {
      err('OC number must start with "ID" or "BD" and be 7 characters.');
      return;
    }

    setIsLoading(true);
    setFeedback({ msg: '', type: '' });

    const payload = {
      supplierCode: SUPPLIER_CODE_INT,
      articleNumber: fmtArtRef.current,
      numberOfPieces: piecesRef.current,
      dateOfManufacture: dateRef.current,
      ocNumber: b,
    };

    logger.api('postPalletData', payload);

    try {
      await postPalletData(palletRef.current, payload);

      seenPallets.current.add(palletRef.current);
      setScannedItems(prev => [...prev, {
        id: `${palletRef.current}-${Date.now()}`,
        articleNumber: fmtArtRef.current,
        pieces: piecesRef.current,
        date: String(dateRef.current),
        ocNumber: b,
      }]);
      sheetRef.current?.snapToIndex(1);
      Toast.show({ ...ToastDefaults, type: 'success', text1: 'Saved ✓', text2: `Pallet ${palletRef.current} recorded.` });
      setTimeout(reset, 600);

    } catch (e) {
      logger.error('[postPalletData]', e);
      err(e?.response?.data?.message || e?.message || 'Failed to save. Try again.');
      advance(3);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Main scan entry ────────────────────────────────────────────────────────
  const handleScan = useCallback((data) => {
    if (!scannerActive.current || isLoading) return;
    const b = (typeof data === 'string' ? data : data?.data)?.trim();
    if (!b) return;

    scannerActive.current = false;
    setTimeout(() => { scannerActive.current = true; }, 300);

    logger.log(`[WH Entry] step=${stepRef.current} barcode=${b}`);
    switch (stepRef.current) {
      case 0: step0(b); break;
      case 1: step1(b); break;
      case 2: step2(b); break;
      case 3: step3(b); break;
    }
  }, [isLoading]);    // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.container}>
      <CustomHeader title="Scan Pallets" showBackButton />
      <Stepper current={stepDisplay} />

      {feedback.msg ? (
        <View style={feedback.type === 'ok' ? styles.successBanner : styles.errorBanner}>
          <Ionicons
            name={feedback.type === 'ok' ? 'checkmark-circle' : 'alert-circle'}
            size={16} color={Colors.white}
          />
          <Text style={styles.bannerText}>{feedback.msg}</Text>
        </View>
      ) : null}

      <View style={styles.scanArea}>
        <ScannerScreen
          onScanSuccess={handleScan}
          onScanError={(e) => err(e?.message || 'Scan error')}
          skipBarcodeDetailsApi={stepDisplay === 2 || stepDisplay === 3}
        />
      </View>

      <LoadingOverlay visible={isLoading} label="Saving pallet..." />

      {stepDisplay > 0 && (
        <TouchableOpacity style={styles.resetBtn} onPress={reset}>
          <Text style={styles.resetTxt}>↺  Reset</Text>
        </TouchableOpacity>
      )}

      <AppSheetModal
        ref={sheetRef}
        title="Scanned Pallets"
        badge={scannedItems.length}
        snapPoints={['12%', '50%', '92%']}
        initialIndex={0}
        scrollable={false}
      >
        <View style={styles.tHead}>
          {TABLE_HEADERS.map(h => <Text key={h} style={styles.tHCell}>{h}</Text>)}
        </View>
        <BottomSheetFlatList
          data={scannedItems}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <View style={[styles.tRow, index % 2 === 0 && styles.tRowAlt]}>
              <Text style={styles.tCell} numberOfLines={1}>{item.articleNumber}</Text>
              <Text style={styles.tCell}>{item.pieces}</Text>
              <Text style={styles.tCell}>{item.date}</Text>
              <Text style={styles.tCell} numberOfLines={1}>{item.ocNumber}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyTxt}> No pallets scanned yet </Text>}
        />
      </AppSheetModal>
    </View>
  );
};

// ─── Stepper ──────────────────────────────────────────────────────────────────

const Stepper = ({ current }) => (
  <View style={styles.stepper}>
    {STEPS.map((label, i) => (
      <React.Fragment key={label}>
        <View style={styles.stepItem}>
          <View style={[styles.dot, current > i && styles.dotDone, current === i && styles.dotActive]}>
            {current > i
              ? <Ionicons name="checkmark" size={14} color={Colors.white} />
              : <Text style={[styles.dotTxt, current === i && styles.dotTxtActive]}>{i + 1}</Text>}
          </View>
          <Text style={[styles.stepLbl, current === i && styles.stepLblActive]}>{label}</Text>
        </View>
        {i < STEPS.length - 1 && (
          <View style={[styles.connector, current > i && styles.connectorDone]} />
        )}
      </React.Fragment>
    ))}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, paddingTop: 0 },

  // Stepper
  stepper: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 30, marginBottom: 10 },
  stepItem: { alignItems: 'center', width: 68 },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center', marginBottom: 6, borderWidth: 2, borderColor: '#e0e0e0' },
  dotActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  dotDone: { backgroundColor: Colors.success, borderColor: Colors.success },
  dotTxt: { color: '#666', fontWeight: 'bold', fontSize: 13 },
  dotTxtActive: { color: Colors.primary },
  stepLbl: { fontSize: 10, textAlign: 'center', color: '#666', fontWeight: '500' },
  stepLblActive: { color: Colors.primary, fontWeight: '700' },
  connector: { flex: 1, height: 2, backgroundColor: '#e0e0e0', marginTop: 16, marginHorizontal: 4 },
  connectorDone: { backgroundColor: Colors.success },

  // Feedback banners
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.success, padding: 10, borderRadius: Radius.md, marginHorizontal: 16, marginBottom: 6 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.error, padding: 10, borderRadius: Radius.md, marginHorizontal: 16, marginBottom: 6 },
  bannerText: { color: Colors.white, flex: 1, fontSize: FontSize.sm },

  scanArea: { flex: 1, paddingHorizontal: 8 },

  resetBtn: { alignSelf: 'center', marginVertical: 6, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border },
  resetTxt: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Table (inside AppSheetModal)
  tHead: { flexDirection: 'row', backgroundColor: Colors.tableHeader, paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tHCell: { flex: 1, fontWeight: 'bold', fontSize: FontSize.tableHeader, textAlign: 'center', color: Colors.textPrimary },
  tRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint, alignItems: 'center' },
  tRowAlt: { backgroundColor: Colors.offWhite },
  tCell: { flex: 1, fontSize: FontSize.tableCell, textAlign: 'center', color: Colors.textPrimary },
  emptyTxt: { textAlign: 'center', padding: 20, color: Colors.textMuted, fontSize: FontSize.md },
});

export default PalletWHentry;
