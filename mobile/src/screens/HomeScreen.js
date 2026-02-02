import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useApp } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const { 
    chapters, xp, streak, lives, level, 
    dailyProgress, achievements, loading 
  } = useApp();

  const getChapterColor = (index) => {
    const colors = ['#1cb964', '#5c7cfa', '#f06595', '#fcc419', '#20c997', '#ff6b6b'];
    return colors[index % colors.length];
  };

  if (loading) {
    return <View style={styles.container}><Text style={styles.loading}>加载中...</Text></View>;
  }

  const chapterList = chapters?.chapters || [];
  const unlockedAchievements = achievements?.filter(a => a.unlocked) || [];
  const dailyGoalPercent = Math.min(100, Math.round(
    (dailyProgress?.goals?.lessons?.current || 0) / 
    (dailyProgress?.goals?.lessons?.target || 1) * 100
  ));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{level?.level || 1}</Text>
          </View>
          <View>
            <Text style={styles.levelTitle}>{level?.title || '会计新手'}</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${level?.progress || 0}%`}]} />
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={20} color="#f06595" />
            <Text style={styles.statText}>{streak || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="heart" size={20} color="#ff6b6b" />
            <Text style={styles.statText}>{lives || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="star" size={20} color="#fcc419" />
            <Text style={styles.statText}>{xp || 0}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CPA 6科进度</Text>
          {chapterList.map((chapter, index) => (
            <TouchableOpacity
              key={chapter.chapter_id}
              style={[styles.chapterCard, { borderLeftColor: getChapterColor(index) }]}
              onPress={() => navigation.navigate('Chapter', { chapterId: chapter.chapter_id, chapter })}
            >
              <View style={styles.chapterInfo}>
                <Text style={styles.chapterTitle}>{chapter.title}</Text>
                <Text style={styles.chapterMeta}>
                  {chapter.lessons_count}课时 · {chapter.total_xp} XP
                </Text>
              </View>
              <View style={styles.chapterRight}>
                <View style={[styles.difficultyBadge, { backgroundColor: chapter.difficulty >= 3 ? '#f06595' : chapter.difficulty >= 2 ? '#fcc419' : '#1cb964' }]}>
                  <Text style={styles.difficultyText}>{chapter.difficulty || 1}级</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日目标</Text>
          <View style={styles.goalsContainer}>
            <View style={styles.dailyGoalCard}>
              <View style={styles.goalIcon}>
                <Ionicons name="book" size={24} color="#1cb964" />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalText}>完成课时</Text>
                <Text style={styles.goalSubtext}>
                  {dailyProgress?.goals?.lessons?.current || 0} / {dailyProgress?.goals?.lessons?.target || 1}
                </Text>
              </View>
              <View style={[styles.goalProgress, { backgroundColor: dailyGoalPercent >= 100 ? '#1cb964' : '#e0e0e0'}]}>
                <Text style={[styles.goalPercent, { color: dailyGoalPercent >= 100 ? '#fff' : '#666'}]}>
                  {dailyGoalPercent}%
                </Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{unlockedAchievements.length}</Text>
                <Text style={styles.statLabel}>成就</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{streak || 0}</Text>
                <Text style={styles.statLabel}>连续天</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{dailyProgress?.xpEarned || 0}</Text>
                <Text style={styles.statLabel}>今日XP</Text>
              </View>
            </View>
          </View>
        </View>

        {unlockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>成就展示</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.achievementsRow}>
                {unlockedAchievements.slice(0, 10).map((achievement) => (
                  <View key={achievement.id} style={styles.achievementBadge}>
                    <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>薄弱点强化</Text>
          <TouchableOpacity style={styles.weaknessCard} onPress={() => navigation.navigate('Practice', { wrongOnly: true })}>
            <Ionicons name="fitness" size={24} color="#f06595" />
            <Text style={styles.weaknessText}>错题巩固</Text>
            <Ionicons name="arrow-forward" size={20} color="#f06595" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.weaknessCard, { marginTop: 8, borderColor: '#5c7cfa' }]} onPress={() => navigation.navigate('Practice', { reviewedOnly: true })}>
            <Ionicons name="book" size={24} color="#5c7cfa" />
            <Text style={[styles.weaknessText, { color: '#5c7cfa' }]}>复习已学</Text>
            <Ionicons name="arrow-forward" size={20} color="#5c7cfa" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loading: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 100 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  levelBadge: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#1cb964',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  levelText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  levelTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  xpBar: { width: 100, height: 6, backgroundColor: '#e0e0e0', borderRadius: 3 },
  xpFill: { height: 6, backgroundColor: '#1cb964', borderRadius: 3 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  statText: { fontSize: 14, fontWeight: '600', color: '#333', marginLeft: 4 },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 12 },
  chapterCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10,
    borderLeftWidth: 4, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2,
  },
  chapterInfo: { flex: 1 },
  chapterTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  chapterMeta: { fontSize: 13, color: '#888' },
  chapterRight: { flexDirection: 'row', alignItems: 'center' },
  difficultyBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginRight: 8 },
  difficultyText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  moreButton: { alignItems: 'center', padding: 12 },
  moreText: { color: '#1cb964', fontSize: 14, fontWeight: '600' },
  goalsContainer: {},
  dailyGoalCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, borderRadius: 12, elevation: 2, marginBottom: 12,
  },
  goalIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#e8f5e9',
    justifyContent: 'center', alignItems: 'center',
  },
  goalInfo: { flex: 1, marginLeft: 12 },
  goalText: { fontSize: 15, fontWeight: '600', color: '#333' },
  goalSubtext: { fontSize: 13, color: '#888', marginTop: 2 },
  goalProgress: {
    width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center',
  },
  goalPercent: { fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, marginHorizontal: 4,
    alignItems: 'center', elevation: 1,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1cb964' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  achievementsRow: { flexDirection: 'row', paddingVertical: 8 },
  achievementBadge: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff',
    justifyContent: 'center', alignItems: 'center', marginRight: 8, elevation: 2,
  },
  achievementIcon: { fontSize: 24 },
  weaknessCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#f06595',
  },
  weaknessText: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#333' },
});

export default HomeScreen;
