// NATIVE APP - Image Results Screen
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Image, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../contexts/AuthContext';
import { communityAPI } from '../services/api';
import type { ImageGeneratorResponse, CarSpec } from '../types';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const ImageResultsScreen = ({ route, navigation }: any) => {
  const { results, carSpec }: { results: ImageGeneratorResponse; carSpec: CarSpec } = route.params;
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

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
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;

      // Remove data:image prefix if present
      const base64Data = results.image.includes('base64,')
        ? results.image.split('base64,')[1]
        : results.image;

      await FileSystem.writeAsStringAsync(fileUri, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(fileUri);

      // Try to create album, but don't fail if it already exists
      try {
        await MediaLibrary.createAlbumAsync('TunedUp', asset, false);
      } catch (albumError) {
        // Album might already exist, that's okay
        console.log('Album creation note:', albumError);
      }

      Alert.alert('Success', 'Image saved to your photo library!');
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', `Failed to save image: ${error}`);
    }
  };

  // Format image URI
  const imageUri = results.image.startsWith('data:')
    ? results.image
    : `data:image/png;base64,${results.image}`;

  const handleShareToCommunity = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      setShowDescriptionModal(true);
    }
  };

  const submitToCommunity = async () => {
    if (description.length > 35) {
      Alert.alert('Description Too Long', 'Please keep your description under 35 characters.');
      return;
    }

    setUploading(true);
    try {
      // Convert base64 to data URL if needed
      const imageUrl = results.image.startsWith('data:')
        ? results.image
        : `data:image/png;base64,${results.image}`;

      await communityAPI.uploadImage(imageUrl, description);

      setShowDescriptionModal(false);
      setDescription('');

      Alert.alert(
        'Success!',
        'Your image has been shared to the community!',
        [
          { text: 'View Community', onPress: () => navigation.navigate('Community') },
          { text: 'OK', style: 'cancel' }
        ]
      );
    } catch (error: any) {
      console.error('Upload to community error:', error);
      Alert.alert('Error', error.message || 'Failed to upload to community');
    } finally {
      setUploading(false);
    }
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
            onPress={handleShareToCommunity}
          >
            <Text style={styles.primaryButtonText}>Share to Community</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleSaveImage}
          >
            <Text style={styles.secondaryButtonText}>Save to Photos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tertiaryButton}
            onPress={() => navigation.navigate('ImageGenerator')}
          >
            <Text style={styles.tertiaryButtonText}>Generate Another</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Custom Login Modal */}
      <Modal
        visible={showLoginModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Login Required</Text>
            <Text style={styles.modalMessage}>
              Please Login to Post to the Community
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowLoginModal(false);
                navigation.navigate('Profile');
              }}
            >
              <Text style={styles.modalButtonText}>Go to Login</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowLoginModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Description Modal for Community Share */}
      <Modal
        visible={showDescriptionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add a Description</Text>
            <Text style={styles.modalMessage}>
              Add a short description for your image (max 35 characters)
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Dream build complete!"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              maxLength={35}
              autoFocus
            />
            <Text style={styles.charCount}>
              {description.length}/35 characters
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, uploading && styles.buttonDisabled]}
              onPress={submitToCommunity}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text style={styles.modalButtonText}>Share to Community</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => {
                setShowDescriptionModal(false);
                setDescription('');
              }}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  buttonDisabled: {
    opacity: 0.6,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
    textAlign: 'right',
  },
});

export default ImageResultsScreen;
