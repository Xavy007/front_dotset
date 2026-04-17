// screens/PlanillaScreen.jsx
import { useState } from 'react';
import { View, Button, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_BASE } from '../services/api.config';

export default function PlanillaScreen({ route }) {
  const { idpartido } = route.params;
  const [planillaURL, setPlanillaURL] = useState(null);
  const [loading, setLoading] = useState(false);

  const verPlanilla = () => {
    setPlanillaURL(`${API_BASE}/mongodb/planilla/${idpartido}/html`);
  };

  const descargarPDF = async () => {
    setLoading(true);
    try {
      const downloadResumable = FileSystem.createDownloadResumable(
        `${API_BASE}/mongodb/planilla/${idpartido}/descargar`,
        FileSystem.documentDirectory + `planilla_${idpartido}.pdf`
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      Alert.alert('Descargado', `Planilla guardada en: ${uri}`);
      
      // Compartir PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <Button title="Ver Planilla HTML" onPress={verPlanilla} />
        <Button title="Descargar PDF" onPress={descargarPDF} disabled={loading} />
      </View>

      {loading && <ActivityIndicator size="large" />}

      {planillaURL && (
        <WebView 
          source={{ uri: planillaURL }} 
          style={styles.webview}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  buttons: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    padding: 10 
  },
  webview: { flex: 1 }
});
