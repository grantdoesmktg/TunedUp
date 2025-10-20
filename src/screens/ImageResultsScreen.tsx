// NATIVE APP - Image Results Screen
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Share, Alert } from 'react-native';
import { colors } from '../theme/colors';
import type { ImageGeneratorResponse, CarSpec } from '../types';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

const ImageResultsScreen = ({ route, navigation }: any) => {
  const { results, carSpec }: { results: ImageGeneratorResponse; carSpec: CarSpec } = route.params;

  const handleSaveImage = async () => {
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to save images to your photo library');
        return;
      }

      // Convert base64 to file
      const filename = `tunedup_${Date.now()}.png`;
      const fileUri = FileSystem.documentDirectory + filename;

      // Remove data:image prefix if present
      const base64Data = results.image.includes('base64,')
        ? results.image.split('base64,')[1]
        : results.image;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(fileUri);
      await MediaLibrary.createAlbumAsync('TunedUp', asset, false);

      Alert.alert('Success', 'Image saved to your photo library!');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save image');
    }
  };

  const handleShareImage = async () => {
    try {
      await Share.share({
        message: `Check out my ${carSpec.year} ${carSpec.make} ${carSpec.model} generated with TunedUp!`,
        url: results.image,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  // Format image URI
  const imageUri = results.image.startsWith('data:')
    ? results.image
    : `data:image/png;base64,${results.image}`;

  const handleShareToCommunity = async () => {
    Alert.alert('Coming Soon', 'Share to Community feature will be available soon!');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Your Custom {carSpec.year} {carSpec.make} {carSpec.model}</Text>
        </View>

        {/* Generated Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleSaveImage}
          >
            <Text style={styles.primaryButtonText}>Save to Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleShareToCommunity}
          >
            <Text style={styles.secondaryButtonText}>Share to Community</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('ImageGenerator')}
          >
            <Text style={styles.secondaryButtonText}>Generate Another</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 70,
    paddingBottom: 16,
  },
  backButton: {
    fontSize: 16,
    color: colors.primary,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  carInfo: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  imageContainer: {
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  detailsCard: {
    marginHorizontal: 20,
    backgroundColor: colors.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  promptCard: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
  },
  promptText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  tertiaryButton: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.divider,
  },
  tertiaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageResultsScreen;
