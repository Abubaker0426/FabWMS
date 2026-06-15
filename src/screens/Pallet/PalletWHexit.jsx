import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput,
  TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScannerScreen from '../../components/Scanner/ScannerScreen';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import AppSheetModal, { BottomSheetFlatList } from '../../components/common/AppSheetModal';
import CustomHeader from '../../components/CustomHeader';
import { useScanner } from '../../context/ScannerContext';
import { fetchBarcodeDetails, putPalletContainer } from '../../api/apiService';
import { logger } from '../../utils/logger';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing, Radius, Shadows } from '../../constants/spacing';
import Toast from 'react-native-toast-message';
import { ToastDefaults } from '../../constants/toastConfig';

const notify = (type, text1, text2) =>
  Toast.show({ ...ToastDefaults, type, text1, text2 });

const PalletWHexit = () => {
  const { scannerType } = useScanner();
  const insets = useSafeAreaInsets();

  const [phase,          setPhase]          = useState('input');
  const [containerInput, setContainerInput] = useState('');
  const [containerNum,   setContainerNum]   = useState('');
  const [pallets,        setPallets]        = useState([]);
  const [isLoading,      setIsLoading]      = useState(false);

  const sheetRef      = useRef(null);
  const scannerRef    = useRef(null);  // used to re-focus external input after sheet opens
  const seenPallets   = useRef(new Set());
  const scannerActive = useRef(true);

  const handleOK = () => {
    const val = containerInput.trim();
    if (!val) { notify('error', 'Required', 'Please enter a container number.'); return; }
    setContainerNum(val);
    setPhase('scanning');
  };

  const handleScan = async (data) => {
    if (!scannerActive.current || isLoading || phase !== 'scanning') return;
    const barcode = (typeof data === 'string' ? data : data?.data)?.trim();
    if (!barcode) return;

    scannerActive.current = false;
    setTimeout(() => { scannerActive.current = true; }, 300);

    // ── Guard 1: must start with '00' — the actual pallet barcode prefix ──────
    // Label has 3 barcodes close together: (91)date, (240)article, (00)pallet
    // Backend accepts the article number as pallet — block it here before API call
    const cleaned = barcode.replace(/[()]/g, '');
    if (!cleaned.startsWith('00')) {
      notify('error', 'Wrong barcode', 'Please scan the pallet barcode — the one starting with (00).');
      return;
    }

    // ── Guard 2: duplicate ────────────────────────────────────────────────────
    if (seenPallets.current.has(cleaned)) {
      notify('error', 'Already scanned', `Pallet ${cleaned} is already in this container.`);
      return;
    }

    // ── Guard 3: API type check — only accept pallet type ────────────────────
    setIsLoading(true);
    try {
      const response = await fetchBarcodeDetails(cleaned);
      const type = response?.type ?? response?.data?.type;

      if (type !== 'pallet') {
        notify('error', 'Invalid barcode', `Only pallet barcodes are allowed here.`);
        return;
      }

      seenPallets.current.add(cleaned);
      setPallets(prev => [...prev, { id: `${cleaned}-${Date.now()}`, barcode: cleaned }]);
      sheetRef.current?.snapToIndex(1);
      // Re-focus external scanner input — sheet opening steals focus on Android
      scannerRef.current?.focusInput();
      notify('success', 'Pallet added', cleaned);

    } catch (e) {
      logger.error('[PalletWHexit] fetchBarcodeDetails failed:', e);
      notify('error', 'Scan failed', e?.response?.data?.message || e?.message || 'Could not verify barcode.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (id, barcode) => {
    seenPallets.current.delete(barcode);
    setPallets(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = async () => {
    if (pallets.length === 0) {
      notify('error', 'Nothing to submit', 'Scan at least one pallet first.'); return;
    }
    setIsLoading(true);
    logger.api('putPalletContainer', { containerNum, count: pallets.length });
    try {
      await putPalletContainer(containerNum, pallets.map(p => p.barcode));
      notify('success', 'Submitted ✓', `Container ${containerNum} saved with ${pallets.length} pallets.`);
      setPhase('input');
      setContainerInput('');
      setContainerNum('');
      setPallets([]);
      seenPallets.current.clear();
    } catch (e) {
      logger.error('[putPalletContainer]', e);
      notify('error', 'Submit failed', e?.response?.data?.message || e?.message || 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit button rendered as FlatList footer — always visible after last item
  const SubmitFooter = (
    <View style={styles.submitArea}>
      <TouchableOpacity
        style={[styles.submitBtn, (pallets.length === 0 || isLoading) && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={pallets.length === 0 || isLoading}
      >
        <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
        <Text style={styles.submitTxt}>Submit Container ({pallets.length})</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <CustomHeader title="Pallet Warehouse Exit" showBackButton />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.body}
      >
        {phase === 'input' && (
          <View style={styles.inputPhase}>
            <Text style={styles.inputLabel}>Enter Container Number</Text>
            <TextInput
              style={styles.input}
              value={containerInput}
              onChangeText={setContainerInput}
              placeholder="e.g. CONT-2024-001"
              placeholderTextColor={Colors.textFaint}
              autoCapitalize="characters"
              returnKeyType="done"
              onSubmitEditing={handleOK}
            />
            <TouchableOpacity
              style={[styles.okBtn, !containerInput.trim() && styles.btnDisabled]}
              onPress={handleOK}
              disabled={!containerInput.trim()}
            >
              <Text style={styles.okBtnText}>OK — Start Scanning</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'scanning' && (
          <>
            <View style={styles.containerBar}>
              <View>
                <Text style={styles.containerLabel}>Container</Text>
                <Text style={styles.containerNum}>{containerNum}</Text>
              </View>
              <View style={styles.countPill}>
                <Text style={styles.countNum}>{pallets.length}</Text>
                <Text style={styles.countLbl}>pallets</Text>
              </View>
            </View>
            <ScannerScreen
              ref={scannerRef}
              onScanSuccess={handleScan}
            />
          </>
        )}
      </KeyboardAvoidingView>

      <LoadingOverlay visible={isLoading} label="Submitting container..." />

      {phase === 'scanning' && (
        <AppSheetModal
          ref={sheetRef}
          title={`Container ${containerNum}`}
          badge={pallets.length}
          snapPoints={['12%', '55%', '92%']}
          initialIndex={0}
          scrollable={false}
        >
          <BottomSheetFlatList
            data={pallets}
            keyExtractor={i => i.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator
            renderItem={({ item, index }) => (
              <View style={styles.palletRow}>
                <Text style={styles.palletIdx}>{index + 1}</Text>
                <Text style={styles.palletBarcode}>{item.barcode}</Text>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDelete(item.id, item.barcode)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyTxt}>No pallets scanned yet. Drag up to expand.</Text>
            }
            ListFooterComponent={SubmitFooter}
          />
        </AppSheetModal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: Colors.white },
  body:           { flex: 1, paddingHorizontal: Spacing.screenPaddingHorizontal, paddingTop: Spacing.lg },

  // Input phase
  inputPhase:     { flex: 1, justifyContent: 'center', paddingBottom: Spacing.xxxl * 2 },
  inputLabel:     { fontSize: FontSize.lg, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm },
  input:          { borderWidth: 1.5, borderColor: Colors.inputBorder, borderRadius: Radius.input, padding: Spacing.md, fontSize: FontSize.lg, color: Colors.textPrimary, backgroundColor: Colors.background, letterSpacing: 1 },
  okBtn:          { marginTop: Spacing.lg, backgroundColor: Colors.primary, padding: Spacing.md, borderRadius: Radius.button, alignItems: 'center', ...Shadows.button },
  okBtnText:      { color: Colors.white, fontSize: FontSize.lg, fontWeight: '600' },

  // Scanning phase
  containerBar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: Spacing.md, marginBottom: Spacing.md },
  containerLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  containerNum:   { fontSize: FontSize.xl, fontWeight: '700', color: Colors.primary, fontFamily: 'monospace' },
  countPill:      { alignItems: 'center', backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs },
  countNum:       { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.white },
  countLbl:       { fontSize: FontSize.xs, color: Colors.white, opacity: 0.8 },

  // List
  listContent:    { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  palletRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderFaint, gap: Spacing.sm },
  palletIdx:      { width: 24, fontSize: FontSize.sm, color: Colors.textMuted, fontWeight: '600' },
  palletBarcode:  { flex: 1, fontSize: FontSize.md, fontFamily: 'monospace', color: Colors.textPrimary },
  deleteBtn:      { padding: Spacing.xs, backgroundColor: Colors.errorLight, borderRadius: Radius.xs },
  emptyTxt:       { textAlign: 'center', padding: Spacing.xl, color: Colors.textFaint, fontSize: FontSize.md },

  // Submit footer
  submitArea:     { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.borderFaint },
  submitBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.success, padding: Spacing.md, borderRadius: Radius.button, ...Shadows.button },
  submitTxt:      { color: Colors.white, fontSize: FontSize.lg, fontWeight: '600' },
  btnDisabled:    { backgroundColor: Colors.disabledButton, opacity: 0.6 },
});

export default PalletWHexit;
