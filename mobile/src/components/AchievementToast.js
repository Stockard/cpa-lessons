import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useApp } from '../context/AppContext';

const AchievementToast = () => {
  const { newAchievements } = useApp();
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (newAchievements.length > 0) {
      Animated.sequence([
        Animated.spring(animatedValue, { toValue: 1, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(animatedValue, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
  }, [newAchievements]);

  if (newAchievements.length === 0) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [-100, 20]
    })}]}]}>
      <View style={styles.inner}>
        <Text style={styles.icon}>{newAchievements[0]?.icon}</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>成就解锁!</Text>
          <Text style={styles.name}>{newAchievements[0]?.title}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#fcc419',
  },
  textContainer: { flex: 1, marginLeft: 12 },
  icon: { fontSize: 32 },
  title: { fontSize: 12, color: '#888', fontWeight: '600' },
  name: { fontSize: 16, color: '#333', fontWeight: '700' },
});

export default AchievementToast;
