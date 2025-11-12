import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { colors } from '../theme/colors';
import { imageBackgrounds, getAllCategories, getBackgroundById, CategoryInfo, DEFAULT_BACKGROUND_ID } from '../theme/imageBackgrounds';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 80) / 3; // 3 columns with padding

interface BackgroundPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectBackground: (backgroundId: string) => void;
  currentTheme?: string; // Background ID
}

const BackgroundPickerModal: React.FC<BackgroundPickerModalProps> = ({
  visible,
  onClose,
  onSelectBackground,
  currentTheme = DEFAULT_BACKGROUND_ID
}) => {
  const [selectedBackground, setSelectedBackground] = useState<string>(currentTheme);

  const handleApply = () => {
    onSelectBackground(selectedBackground);
    onClose();
  };

  const selectedBg = getBackgroundById(selectedBackground);
  const categories = getAllCategories();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Choose Your Vibe</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Live Preview */}
          <View style={styles.previewCard}>
            <ImageBackground
              source={selectedBg?.source || imageBackgrounds[0].source}
              style={styles.previewImage}
              resizeMode="cover"
            >
              <View style={styles.previewOverlay}>
                <Text style={styles.previewLabel}>PREVIEW</Text>
              </View>
            </ImageBackground>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{selectedBg?.name || 'Select Background'}</Text>
              <Text style={styles.previewDescription}>{selectedBg?.description || ''}</Text>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {/* Categories */}
            {categories.map((category: CategoryInfo) => {
              const categoryBackgrounds = imageBackgrounds.filter(bg => bg.category === category.id);

              return (
                <View key={category.id} style={styles.categorySection}>
                  {/* Category Header */}
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                    <View style={styles.categoryTextContainer}>
                      <Text style={styles.categoryName}>{category.displayName}</Text>
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                    </View>
                  </View>

                  {/* Background Tiles */}
                  <View style={styles.tilesContainer}>
                    {categoryBackgrounds.map((bg) => (
                      <TouchableOpacity
                        key={bg.id}
                        style={[
                          styles.tile,
                          selectedBackground === bg.id && styles.tileSelected
                        ]}
                        onPress={() => setSelectedBackground(bg.id)}
                      >
                        <ImageBackground
                          source={bg.source}
                          style={styles.tileImage}
                          resizeMode="cover"
                        >
                          {selectedBackground === bg.id && (
                            <View style={styles.checkmark}>
                              <Text style={styles.checkmarkText}>✓</Text>
                            </View>
                          )}
                        </ImageBackground>
                        <Text style={styles.tileName} numberOfLines={1}>{bg.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  previewImage: {
    width: '100%',
    height: 140,
    justifyContent: 'flex-end',
  },
  previewOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 12,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
  },
  previewInfo: {
    backgroundColor: colors.background,
    padding: 12,
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  scrollView: {
    flexGrow: 1,
    flexShrink: 1,
  },
  categorySection: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  categoryEmoji: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryTextContainer: {
    flex: 1,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    justifyContent: 'flex-start',
  },
  tile: {
    width: TILE_SIZE,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  tileSelected: {
    transform: [{ scale: 1.05 }],
  },
  tileImage: {
    width: TILE_SIZE,
    height: TILE_SIZE * 1.3, // Portrait aspect ratio
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  checkmark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  checkmarkText: {
    color: colors.background,
    fontSize: 22,
    fontWeight: 'bold',
  },
  tileName: {
    fontSize: 12,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  applyButtonText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default BackgroundPickerModal;
