import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { userApi } from '../services/api';

const ResultScreen = ({ route, navigation }) => {
  const { score, total, xpEarned, lessonTitle } = route.params;
  const percentage = Math.round((score / total) * 100);
  const { setXp, setLevel } = useApp();
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => {
    fetchLatestXP();
  }, []);

  const fetchLatestXP = async () => {
    try {
      const res = await userApi.getProfile();
      const xp = res.data?.xp || 0;
      setTotalXp(xp);
      setXp(xp);
      setLevel({ level: 1, title: '会计新手', progress: 0 }); // This will be recalculated in AppContext
    } catch (error) {
      console.log('Error fetching XP:', error);
    }
  };

  const getResultEmoji = () => {
    if (percentage >= 80) return '🏆';
    if (percentage >= 60) return '😊';
    return '💪';
  };

  const getResultText = () => {
    if (percentage >= 80) return '太棒了！';
    if (percentage >= 60) return '不错！继续加油！';
    return '再接再厉！';
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>{getResultEmoji()}</Text>
        <Text style={styles.resultTitle}>{getResultText()}</Text>
        <Text style={styles.lessonTitle}>{lessonTitle}</Text>

        <View style={styles.scoreCard}>
          <Text style={styles.scorePercent}>{percentage}%</Text>
          <Text style={styles.scoreDetail}>{score}/{total} 题正确</Text>
        </View>

        <View style={styles.xpCard}>
          <Ionicons name="star" size={24} color="#fcc419" />
          <Text style={styles.xpText}>+{xpEarned} XP</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalXp}</Text>
            <Text style={styles.statLabel}>总 XP</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={() => navigation.pop(2)}>
          <Text style={styles.continueBtnText}>继续学习</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.homeBtnText}>返回首页</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'space-between', padding: 24 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 80, marginBottom: 16 },
  resultTitle: { fontSize: 28, fontWeight: '700', color: '#333', marginBottom: 8 },
  lessonTitle: { fontSize: 16, color: '#888', marginBottom: 32 },
  scoreCard: { alignItems: 'center', marginBottom: 24 },
  scorePercent: { fontSize: 64, fontWeight: '700', color: '#1cb964' },
  scoreDetail: { fontSize: 16, color: '#666' },
  xpCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff9e6', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, marginBottom: 32 },
  xpText: { marginLeft: 8, fontSize: 20, fontWeight: '700', color: '#fcc419' },
  statsRow: { flexDirection: 'row' },
  statItem: { alignItems: 'center', marginHorizontal: 20 },
  statValue: { fontSize: 24, fontWeight: '700', color: '#333' },
  statLabel: { fontSize: 13, color: '#888', marginTop: 4 },
  footer: {},
  continueBtn: { backgroundColor: '#1cb964', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  homeBtn: { paddingVertical: 16, alignItems: 'center' },
  homeBtnText: { color: '#888', fontSize: 16 },
});

export default ResultScreen;
