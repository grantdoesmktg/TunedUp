// NATIVE APP - Article Modal Component
import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';

const { height } = Dimensions.get('window');

interface ArticleModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({
  visible,
  onClose,
  title,
  content,
}) => {
  console.log('ArticleModal rendered with visible:', visible, 'title:', title);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Article Content */}
          <ScrollView
            style={styles.contentScroll}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={true}
          >
            <Text style={styles.contentText}>{content}</Text>
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Text style={styles.footerText}>From the Dev</Text>
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
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  modalContainer: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    maxHeight: height * 0.85,
    paddingTop: 24,
    flex: 1,
    flexDirection: 'column',
  },
  modalHeader: {
    paddingHorizontal: 24,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    paddingRight: 40,
    lineHeight: 32,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 24,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  contentText: {
    fontSize: 16,
    color: colors.textPrimary,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
