import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { calculateStats } from '../utils/gamification';

const ProfileScreen = ({ navigation }) => {
  const { 
    user, progress, xp, streak, lives, level, 
    achievements, resetProgress 
  } = useApp();
  const [resetting, setResetting] = useState(false);

  const stats = progress?.statistics || {};
  const todayActivity = stats.today_xp || 0;
  const calculatedStats = calculateStats(progress);

  const formatDate = () => {
    const now = new Date();
    return `${now.getMonth() + 1}月${now.getDate()}日`;
  };

  const unlockedAchievements = achievements?.filter(a => a.unlocked) || [];
  const lockedAchievements = achievements?.filter(a => !a.unlocked) || [];

  const handleResetProgress = () => {
    Alert.alert(
      '确认重置',
      '重置后所有学习进度将被清除，包括：\n• 已完成的课时\n• 答题记录\n• 获得的成就\n\n确定要重置吗？',
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '重置', 
          style: 'destructive',
          onPress: async () => {
            setResetting(true);
            await resetProgress();
            setResetting(false);
            Alert.alert('已重置', '学习进度已清空');
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.username?.[0] || 'C'}</Text>
        </View>
        <Text style={styles.username}>{user?.username || 'CPA学习者'}</Text>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lv.{level?.level || 1} {level?.title || ''}</Text>
        </View>
      </View>

      <View style={styles.levelCard}>
        <View style={styles.levelHeader}>
          <Text style={styles.levelTitle}>当前等级</Text>
          <Text style={styles.levelXP}>{xp} XP</Text>
        </View>
        <View style={styles.levelBar}>
          <View style={[styles.levelFill, { width: `${level?.progress || 0}%`}]} />
        </View>
        <Text style={styles.levelSubtext}>
          距离下一级还需 {level?.xpForNextLevel || 100} XP
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#f06595" />
          <Text style={styles.statValue}>{streak || 0}</Text>
          <Text style={styles.statLabel}>连续天数</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star" size={24} color="#fcc419" />
          <Text style={styles.statValue}>{xp || 0}</Text>
          <Text style={styles.statLabel}>总 XP</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="heart" size={24} color="#ff6b6b" />
          <Text style={styles.statValue}>{lives || 0}</Text>
          <Text style={styles.statLabel}>生命值</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日数据</Text>
        <View style={styles.todayCard}>
          <View style={styles.todayRow}>
            <Ionicons name="calendar" size={20} color="#1cb964" />
            <Text style={styles.todayLabel}>{formatDate()}</Text>
          </View>
          <View style={styles.todayStats}>
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{todayActivity || 0}</Text>
              <Text style={styles.todayLabel}>今日XP</Text>
            </View>
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{stats.lessons_completed || 0}</Text>
              <Text style={styles.todayLabel}>完成课时</Text>
            </View>
            <View style={styles.todayStat}>
              <Text style={styles.todayValue}>{stats.total_correct_answers || 0}</Text>
              <Text style={styles.todayLabel}>答对题目</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>累计统计</Text>
        <View style={styles.totalCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>总课时完成</Text>
            <Text style={styles.totalValue}>{calculatedStats.lessonsCompleted}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>总题目回答</Text>
            <Text style={styles.totalValue}>{calculatedStats.totalQuestions}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>正确率</Text>
            <Text style={styles.totalValue}>{calculatedStats.accuracy}%</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>已完成章节</Text>
            <Text style={styles.totalValue}>{calculatedStats.chaptersCompleted}/28</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          成就徽章 ({unlockedAchievements.length}/{achievements?.length || 0})
        </Text>
        
        {unlockedAchievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.subsectionTitle}>已解锁</Text>
            <View style={styles.achievementsGrid}>
              {unlockedAchievements.map((ach) => (
                <View key={ach.id} style={styles.achievementCard}>
                  <Text style={styles.achievementIcon}>{ach.icon}</Text>
                  <Text style={styles.achievementTitle}>{ach.title}</Text>
                  <Text style={styles.achievementDesc}>{ach.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {lockedAchievements.length > 0 && (
          <View style={styles.achievementsSection}>
            <Text style={styles.subsectionTitle}>待解锁</Text>
            <View style={styles.achievementsGrid}>
              {lockedAchievements.slice(0, 6).map((ach) => (
                <View key={ach.id} style={[styles.achievementCard, styles.lockedCard]}>
                  <Text style={styles.achievementIcon}>🔒</Text>
                  <Text style={styles.achievementTitle}>{ach.title}</Text>
                  <Text style={styles.achievementDesc}>{ach.description}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>设置</Text>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="notifications" size={20} color="#333" />
          <Text style={styles.settingText}>学习提醒</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Ionicons name="moon" size={20} color="#333" />
          <Text style={styles.settingText}>深色模式</Text>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem} onPress={handleResetProgress} disabled={resetting}>
          <Ionicons name="refresh" size={20} color={resetting ? '#ccc' : '#f06595'} />
          <Text style={[styles.settingText, { color: resetting ? '#ccc' : '#f06595' }]}>
            {resetting ? '重置中...' : '重置进度'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={resetting ? '#ccc' : '#ccc'} />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff' },
  avatar: { 
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#1cb964', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 12 
  },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: '700' },
  username: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  levelBadge: { backgroundColor: '#fff9e6', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  levelText: { fontSize: 14, fontWeight: '700', color: '#fcc419' },
  levelCard: { backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12 },
  levelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  levelTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  levelXP: { fontSize: 14, color: '#888' },
  levelBar: { height: 8, backgroundColor: '#eee', borderRadius: 4, marginBottom: 8 },
  levelFill: { height: '100%', backgroundColor: '#1cb964', borderRadius: 4 },
  levelSubtext: { fontSize: 13, color: '#888' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 16 },
  statCard: { 
    flex: 1, backgroundColor: '#fff', marginHorizontal: 4, padding: 12, 
    borderRadius: 10, alignItems: 'center' 
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  subsectionTitle: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  todayCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  todayRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  todayLabel: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: '#333' },
  todayStats: { flexDirection: 'row', justifyContent: 'space-around' },
  todayStat: { alignItems: 'center' },
  todayValue: { fontSize: 24, fontWeight: '700', color: '#1cb964' },
  totalCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  totalLabel: { fontSize: 15, color: '#666' },
  totalValue: { fontSize: 15, fontWeight: '600', color: '#333' },
  achievementsSection: { marginBottom: 16 },
  achievementsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  achievementCard: { 
    width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 12, 
    alignItems: 'center', marginBottom: 12, elevation: 1,
  },
  lockedCard: { opacity: 0.5, backgroundColor: '#f9f9f9' },
  achievementIcon: { fontSize: 28, marginBottom: 8 },
  achievementTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4, textAlign: 'center' },
  achievementDesc: { fontSize: 12, color: '#888', textAlign: 'center' },
  settingItem: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', 
    padding: 16, borderRadius: 12, marginBottom: 8 
  },
  settingText: { flex: 1, marginLeft: 12, fontSize: 15, color: '#333' },
  bottomSpacer: { height: 100 },
});

export default ProfileScreen;
