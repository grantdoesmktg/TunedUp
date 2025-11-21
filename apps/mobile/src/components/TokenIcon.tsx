// NATIVE APP - Gold Token Icon Component
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface TokenIconProps {
  size?: number;
  showSymbol?: boolean;
  style?: ViewStyle;
}

export const TokenIcon: React.FC<TokenIconProps> = ({
  size = 24,
  showSymbol = true,
  style
}) => {
  const fontSize = size * 0.6;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <LinearGradient
        colors={['#FFD700', '#FFA500', '#FF8C00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { width: size, height: size, borderRadius: size / 2 }]}
      >
        {showSymbol && (
          <Text style={[styles.symbol, { fontSize }]}>$</Text>
        )}
      </LinearGradient>
      {/* Inner shine effect */}
      <View style={[styles.shine, {
        width: size * 0.4,
        height: size * 0.4,
        borderRadius: size * 0.2,
        top: size * 0.15,
        left: size * 0.15
      }]} />
    </View>
  );
};

interface TokenDisplayProps {
  amount: number;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const TokenDisplay: React.FC<TokenDisplayProps> = ({
  amount,
  size = 'medium',
  style
}) => {
  const iconSize = size === 'small' ? 20 : size === 'large' ? 36 : 28;
  const fontSize = size === 'small' ? 14 : size === 'large' ? 24 : 18;

  return (
    <View style={[styles.displayContainer, style]}>
      <TokenIcon size={iconSize} />
      <Text style={[styles.amount, { fontSize }]}>
        {amount === Infinity ? '∞' : amount.toLocaleString()}
      </Text>
    </View>
  );
};

interface TokenCostProps {
  cost: number;
  size?: 'small' | 'medium';
  style?: ViewStyle;
}

export const TokenCost: React.FC<TokenCostProps> = ({
  cost,
  size = 'small',
  style
}) => {
  const iconSize = size === 'small' ? 16 : 20;
  const fontSize = size === 'small' ? 12 : 14;

  return (
    <View style={[styles.costContainer, style]}>
      <TokenIcon size={iconSize} />
      <Text style={[styles.costText, { fontSize }]}>
        {cost}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  symbol: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  costText: {
    color: '#FFD700',
    fontWeight: '600',
  },
});
