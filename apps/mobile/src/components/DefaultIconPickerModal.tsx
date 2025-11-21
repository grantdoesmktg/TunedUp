import React from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';

interface DefaultIconPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectIcon: (icon: string) => void;
}

const defaultIcons = [
  '🚗', '🚙', '🏎️', '💨', '🔧', '⚙️', '🛠️', '🏁', '🚀', '🌟'
];

const DefaultIconPickerModal: React.FC<DefaultIconPickerModalProps> = ({
  visible,
  onClose,
  onSelectIcon,
}) => {
  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.iconItem}
      onPress={() => {
        onSelectIcon(item);
        onClose();
      }}
    >
      <Text style={styles.iconText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.centeredView} onPress={onClose}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Select Profile Icon</Text>
          <FlatList
            data={defaultIcons}
            renderItem={renderItem}
            keyExtractor={(item) => item}
            numColumns={5}
            contentContainerStyle={styles.iconGrid}
          />
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalView: {
    width: '90%',
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  iconGrid: {
    justifyContent: 'center',
  },
  iconItem: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  iconText: {
    fontSize: 30,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DefaultIconPickerModal;
