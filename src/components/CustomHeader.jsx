import { Ionicons } from '@expo/vector-icons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CustomHeader = ({
  title,
  showBackButton = false,
  showSearchButton = false,
  searchScreenName = 'Search',
  onSearchPress,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      navigation.navigate(searchScreenName);
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top }]}>
      {showBackButton && (
        <TouchableOpacity style={styles.iconButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      )}
      <Text style={styles.headerText}>{title}</Text>
      {showSearchButton && (
        <TouchableOpacity style={styles.iconButton} onPress={handleSearchPress}>
          <MaterialCommunityIcons name="line-scan" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CustomHeader;

const styles = StyleSheet.create({
  header: { backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, minHeight: 60, },
  iconButton: { marginHorizontal: 8, },
  headerText: { color: 'white', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center', },
});
