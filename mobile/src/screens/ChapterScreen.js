import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { chaptersApi, userApi } from '../services/api';

const ChapterScreen = ({ route, navigation }) => {
  const { chapterId, chapter } = route.params;
  const [chapterData, setChapterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState({});
  const scrollRef = useRef(null);

  const loadChapterData = async () => {
    try {
      const res = await chaptersApi.getById(chapterId);
      const data = res.data;
      const chapterInfo = data.chapter || data.chapter_index || data;
      setChapterData(chapterInfo);
    } catch (error) {
      setChapterData({ title: chapter?.title || `第${chapterId}章`, total_lessons: 8, sections: [] });
    }
    setLoading(false);
  };

  const loadProgress = async () => {
    try {
      const res = await userApi.getProgress();
      const lessons = res.data?.lessons || {};
      setCompletedLessons(lessons);
    } catch (error) {
      setCompletedLessons({});
    }
  };

  useEffect(() => {
    loadChapterData();
  }, [chapterId]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [])
  );

  if (loading) {
    return <View style={styles.container}><Text style={styles.loading}>加载中...</Text></View>;
  }

  const sections = chapterData?.sections || [];
  const colors = ['#1cb964', '#5c7cfa', '#f06595', '#fcc419', '#20c997', '#ff6b6b'];

  const isLessonCompleted = (lessonNum) => {
    return !!completedLessons[lessonNum];
  };

  return (
    <View style={styles.container} id="chapter-screen">
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{chapterData?.title || `第${chapterId}章`}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        ref={scrollRef}
        style={styles.content}
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={100}
        onRefresh={loadProgress}
        refreshing={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Ionicons name="book" size={20} color="#1cb964" />
            <Text style={styles.statValue}>{chapterData?.total_lessons || 0}</Text>
            <Text style={styles.statLabel}>总课时</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="star" size={20} color="#fcc419" />
            <Text style={styles.statValue}>{chapterData?.total_xp || 0}</Text>
            <Text style={styles.statLabel}>可获XP</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={20} color="#5c7cfa" />
            <Text style={styles.statValue}>{chapterData?.estimated_duration_hours || 0}h</Text>
            <Text style={styles.statLabel}>预计时长</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>课程列表</Text>

        {sections.map((section, sectionIndex) => (
          <View key={section.id} style={styles.section}>
            <View style={[styles.sectionHeader, { borderLeftColor: colors[sectionIndex % 6] }]}>
              <Text style={styles.sectionNumber}>第{sectionIndex + 1}节</Text>
              <Text style={styles.sectionTitleText}>{section.title}</Text>
              <Text style={styles.sectionXP}>{section.total_xp} XP</Text>
            </View>
            
            {(section.lessons || []).map((lessonFile) => {
              const lessonNum = lessonFile.replace('lesson_', '');
              const completed = isLessonCompleted(lessonNum);
              return (
                <TouchableOpacity
                  key={lessonFile}
                  style={[styles.lessonCard, completed && styles.lessonCardCompleted]}
                  onPress={() => navigation.navigate('Lesson', { chapterId, lessonId: lessonNum, chapter })}
                >
                  <View style={styles.lessonLeft}>
                    <View style={[styles.lessonIcon, { backgroundColor: completed ? '#1cb964' : colors[sectionIndex % 6] }]}>
                      {completed ? (
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      ) : (
                        <Text style={styles.lessonIconText}>{lessonNum}</Text>
                      )}
                    </View>
                    <View style={styles.lessonInfo}>
                      <Text style={[styles.lessonTitle, completed && styles.lessonTitleCompleted]}>
                        第{lessonNum}课
                      </Text>
                      <Text style={[styles.lessonMeta, completed && styles.lessonMetaCompleted]}>
                        {completed ? '已完成' : '8分钟 · 10 XP'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name={completed ? "checkmark-circle" : "chevron-forward"} size={20} color={completed ? '#1cb964' : '#999'} />
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', height: '100%' },
  loading: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 15, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#eee',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  placeholder: { width: 32 },
  content: { flex: 1 },
  statsRow: { flexDirection: 'row', marginBottom: 20 },
  statCard: { flex: 1, alignItems: 'center', backgroundColor: '#fff', padding: 12, marginHorizontal: 4, borderRadius: 10 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#1cb964', marginTop: 6 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16,
    backgroundColor: '#fff', borderRadius: 10, marginBottom: 8, borderLeftWidth: 4,
  },
  sectionNumber: { fontSize: 12, fontWeight: '600', color: '#999', marginRight: 8 },
  sectionTitleText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#333' },
  sectionXP: { fontSize: 13, fontWeight: '600', color: '#fcc419' },
  lessonCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 6, marginLeft: 16,
  },
  lessonCardCompleted: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  lessonLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  lessonIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  lessonIconText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  lessonInfo: { marginLeft: 12, flex: 1 },
  lessonTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  lessonTitleCompleted: { color: '#999', textDecorationLine: 'line-through' },
  lessonMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  lessonMetaCompleted: { color: '#1cb964' },
  bottomSpacer: { height: 40 },
});

export default ChapterScreen;
