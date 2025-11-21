import React from 'react';
import { Modal, View, Text, Image, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';
import { useProfileBanner } from '../contexts/ProfileBannerContext';

interface ImageViewerModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string;
}

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  visible,
  onClose,
  imageUrl,
}) => {
  const { setBannerImageUri } = useProfileBanner();

  const handleSetAsBackground = () => {
    setBannerImageUri(imageUrl);
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.centeredView} onPress={onClose}>
        <View style={styles.modalView}>
          <Image source={{ uri: imageUrl }} style={styles.fullImage} resizeMode="contain" />
          <TouchableOpacity style={styles.setBackgroundButton} onPress={handleSetAsBackground}>
            <Text style={styles.setBackgroundButtonText}>Set as Profile Background</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  modalView: {
    width: '90%',
    height: '80%',
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  fullImage: {
    width: '100%',
    height: '70%',
    borderRadius: 10,
    marginBottom: 20,
  },
  setBackgroundButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  setBackgroundButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImageViewerModal;
