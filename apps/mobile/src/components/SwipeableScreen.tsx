import React from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface SwipeableScreenProps {
  children: React.ReactNode;
  currentTab: 'Home' | 'Tools' | 'Community' | 'Profile';
}

const TAB_ORDER = ['Home', 'Tools', 'Community', 'Profile'];

export const SwipeableScreen: React.FC<SwipeableScreenProps> = ({ children, currentTab }) => {
  const navigation = useNavigation();
  const currentIndex = TAB_ORDER.indexOf(currentTab);

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only activate if it's a horizontal swipe (more horizontal than vertical)
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;

        // Swipe left (next tab) - need at least 50px movement or high velocity
        if ((dx < -50 || vx < -0.5) && currentIndex < TAB_ORDER.length - 1) {
          const nextTab = TAB_ORDER[currentIndex + 1];
          navigation.navigate(nextTab as any);
        }
        // Swipe right (previous tab)
        else if ((dx > 50 || vx > 0.5) && currentIndex > 0) {
          const prevTab = TAB_ORDER[currentIndex - 1];
          navigation.navigate(prevTab as any);
        }
      },
    })
  ).current;

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
