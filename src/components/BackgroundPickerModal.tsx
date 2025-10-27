import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { BACKGROUND_THEMES, BackgroundTheme, parseBackgroundTheme, combineBackgroundTheme } from '../theme/backgrounds';
import { TEXTURE_PATTERNS, TexturePattern, getTextureConfig } from '../theme/textures';

interface BackgroundPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectBackground: (combinedTheme: string) => void;
  currentTheme?: string; // Combined format like "midnight-diamonds"
}

const BackgroundPickerModal: React.FC<BackgroundPickerModalProps> = ({
  visible,
  onClose,
  onSelectBackground,
  currentTheme = 'midnight'
}) => {
  const parsed = parseBackgroundTheme(currentTheme);
  const [selectedGradient, setSelectedGradient] = useState<BackgroundTheme>(parsed.gradient);
  const [selectedTexture, setSelectedTexture] = useState<TexturePattern>(parsed.texture as TexturePattern);

  const handleApply = () => {
    const combined = combineBackgroundTheme(selectedGradient, selectedTexture);
    onSelectBackground(combined);
    onClose();
  };

  const gradientConfig = BACKGROUND_THEMES.find(t => t.id === selectedGradient) || BACKGROUND_THEMES[0];
  const textureConfig = getTextureConfig(selectedTexture);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header with Live Preview */}
          <View style={styles.header}>
            <Text style={styles.title}>Customize Background</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Live Preview Card */}
          <View style={styles.previewCard}>
            <LinearGradient
              colors={gradientConfig.colors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.previewGradient}
            >
              {textureConfig.source && (
                <ImageBackground
                  source={textureConfig.source}
                  style={styles.previewTexture}
                  resizeMode="repeat"
                  imageStyle={{ opacity: textureConfig.opacity }}
                >
                  <Text style={styles.previewLabel}>PREVIEW</Text>
                </ImageBackground>
              )}
              {!textureConfig.source && (
                <Text style={styles.previewLabel}>PREVIEW</Text>
              )}
            </LinearGradient>
            <Text style={styles.previewDescription}>
              {gradientConfig.name} {textureConfig.id !== 'none' && `• ${textureConfig.name}`}
            </Text>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Gradient Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Choose Color Gradient</Text>
              <View style={styles.gridContainer}>
                {BACKGROUND_THEMES.map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.gradientTile,
                      selectedGradient === theme.id && styles.tileSelected
                    ]}
                    onPress={() => setSelectedGradient(theme.id)}
                  >
                    <LinearGradient
                      colors={theme.colors as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientPreview}
                    >
                      {selectedGradient === theme.id && (
                        <View style={styles.checkmark}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      )}
                    </LinearGradient>
                    <Text style={styles.tileName}>{theme.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Texture Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Choose Pattern Overlay</Text>
              <View style={styles.gridContainer}>
                {TEXTURE_PATTERNS.map((texture) => (
                  <TouchableOpacity
                    key={texture.id}
                    style={[
                      styles.textureTile,
                      selectedTexture === texture.id && styles.tileSelected
                    ]}
                    onPress={() => setSelectedTexture(texture.id)}
                  >
                    <LinearGradient
                      colors={gradientConfig.colors as any}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.texturePreview}
                    >
                      {texture.source ? (
                        <ImageBackground
                          source={texture.source}
                          style={styles.texturePreviewImage}
                          resizeMode="repeat"
                          imageStyle={{ opacity: texture.opacity }}
                        >
                          {selectedTexture === texture.id && (
                            <View style={styles.checkmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          )}
                        </ImageBackground>
                      ) : (
                        <>
                          {selectedTexture === texture.id && (
                            <View style={styles.checkmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          )}
                          <Text style={styles.noneLabel}>None</Text>
                        </>
                      )}
                    </LinearGradient>
                    <Text style={styles.tileName}>{texture.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Background</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  previewCard: {
    marginHorizontal: 24,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  previewGradient: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewTexture: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  previewDescription: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.background,
    textAlign: 'center',
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  gradientTile: {
    width: '31%',
    marginBottom: 12,
  },
  textureTile: {
    width: '31%',
    marginBottom: 12,
  },
  tileSelected: {
    transform: [{ scale: 1.05 }],
  },
  gradientPreview: {
    width: '100%',
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  texturePreview: {
    width: '100%',
    height: 70,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 6,
  },
  texturePreviewImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  noneLabel: {
    fontSize: 12,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tileName: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
  },
});

export default BackgroundPickerModal;
