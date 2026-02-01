import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { chaptersApi } from '../services/api';
import { useApp } from '../context/AppContext';

const LessonScreen = ({ route, navigation }) => {
  const { chapterId, lessonId, chapter } = route.params;
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [normalizedExercises, setNormalizedExercises] = useState([]);
  const { completeLesson } = useApp();

  useEffect(() => {
    loadLesson();
  }, [chapterId, lessonId]);

  const normalizeExercise = (exercise) => {
    return {
      id: exercise.id,
      type: exercise.type === 'multiple_choice' ? 'multi_choice' : exercise.type,
      question: exercise.question || '',
      options: exercise.options || [],
      correct_answer: exercise.correct_answer || 'A',
      explanation: exercise.explanation || '',
    };
  };

  const loadLesson = async () => {
    try {
      const res = await chaptersApi.getLesson(chapterId, lessonId);
      const data = res.data;
      const lessonData = data.lesson || data;
      const exercises = (lessonData.exercises || []).map(normalizeExercise);

      setLesson(lessonData);
      setNormalizedExercises(exercises);
    } catch (error) {
      setLesson({
        title: '课程',
        exercises: [],
      });
      setNormalizedExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (answer) => {
    if (showResult) return;
    setSelectedAnswers({ ...selectedAnswers, [currentExercise]: answer });
  };

  const checkAnswer = () => {
    const exercise = normalizedExercises[currentExercise];
    const userAnswer = selectedAnswers[currentExercise];
    let isCorrect = false;

    if (exercise.type === 'single_choice') {
      isCorrect = userAnswer === exercise.correct_answer;
    } else if (exercise.type === 'multi_choice') {
      isCorrect = userAnswer?.sort().join('') === exercise.correct_answer.sort().join('');
    } else if (exercise.type === 'true_false' || exercise.type === 'judgment') {
      isCorrect = userAnswer === exercise.correct_answer;
    } else if (exercise.type === 'fill_in_blank') {
      isCorrect = exercise.correct_answer.includes(userAnswer);
    }

    setShowResult(true);
    if (isCorrect) setScore(s => s + 1);
  };

  const nextExercise = async () => {
    if (currentExercise < normalizedExercises.length - 1) {
      setCurrentExercise(c => c + 1);
      setShowResult(false);
    } else {
      const baseXp = 10;
      const xpEarned = Math.round(baseXp * score / normalizedExercises.length);
      await completeLesson(lessonId, score, xpEarned);
      navigation.navigate('Result', { score, total: normalizedExercises.length, xpEarned, lessonTitle: lesson?.title });
    }
  };

  if (loading) {
    return <View style={styles.centered}><Text>加载中...</Text></View>;
  }

  if (!lesson || normalizedExercises.length === 0) {
    return <View style={styles.centered}><Text>课程不存在</Text></View>;
  }

  const exercise = normalizedExercises[currentExercise];

  return (
    <View style={styles.wrapper}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtn}>×</Text>
        </TouchableOpacity>
        <View style={styles.progressOuter}>
          <View style={[styles.progressInner, { width: `${((currentExercise + 1) / normalizedExercises.length) * 100}%`}]} />
        </View>
        <Text style={styles.progressText}>{currentExercise + 1}/{normalizedExercises.length}</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lessonTitle}>{lesson.title}</Text>

        {lesson.concept && (
          <View style={styles.conceptBox}>
            <Text style={styles.conceptLabel}>知识点</Text>
            <Text style={styles.conceptText}>{lesson.concept.explanation || ''}</Text>
            {lesson.concept.keywords && (
              <View style={styles.keywordRow}>
                {lesson.concept.keywords.map((kw, i) => (
                  <Text key={i} style={styles.keyword}>{kw}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.exerciseBox}>
          <Text style={styles.exerciseLabel}>练习 {currentExercise + 1}</Text>
          <Text style={styles.question}>{exercise.question}</Text>

          {(exercise.type === 'single_choice' || exercise.type === 'multi_choice') && exercise.options && exercise.options.length > 0 && exercise.options.map((opt, i) => {
            const optLetter = String.fromCharCode(65 + i);
            const isSelected = selectedAnswers[currentExercise] === optLetter;
            let btnStyle = styles.optionBtn;
            let textStyle = styles.optionText;

            if (showResult) {
              if (optLetter === exercise.correct_answer) {
                btnStyle = [styles.optionBtn, styles.correctBtn];
                textStyle = [styles.optionText, styles.correctText];
              } else if (isSelected) {
                btnStyle = [styles.optionBtn, styles.wrongBtn];
                textStyle = [styles.optionText, styles.wrongText];
              }
            } else if (isSelected) {
              btnStyle = [styles.optionBtn, styles.selectedBtn];
              textStyle = [styles.optionText, styles.selectedText];
            }

            return (
              <TouchableOpacity key={i} style={btnStyle} onPress={() => handleAnswer(optLetter)} disabled={showResult}>
                <Text style={textStyle}>{opt}</Text>
              </TouchableOpacity>
            );
          })}

          {(exercise.type === 'multi_choice') && exercise.options && exercise.options.length > 0 && exercise.options.map((opt, i) => {
            const optLetter = String.fromCharCode(65 + i);
            const isSelected = selectedAnswers[currentExercise]?.includes(optLetter);
            let btnStyle = styles.optionBtn;
            let textStyle = styles.optionText;

            if (showResult) {
              if (exercise.correct_answer.includes(optLetter)) {
                btnStyle = [styles.optionBtn, styles.correctBtn];
                textStyle = [styles.optionText, styles.correctText];
              } else if (isSelected) {
                btnStyle = [styles.optionBtn, styles.wrongBtn];
                textStyle = [styles.optionText, styles.wrongText];
              }
            } else if (isSelected) {
              btnStyle = [styles.optionBtn, styles.selectedBtn];
              textStyle = [styles.optionText, styles.selectedText];
            }

            return (
              <TouchableOpacity key={i} style={btnStyle} onPress={() => {
                if (showResult) return;
                const current = selectedAnswers[currentExercise] || [];
                const updated = current.includes(optLetter)
                  ? current.filter(a => a !== optLetter)
                  : [...current, optLetter];
                handleAnswer(updated);
              }} disabled={showResult}>
                <Text style={textStyle}>{opt}</Text>
              </TouchableOpacity>
            );
          })}

          {(exercise.type === 'true_false' || exercise.type === 'judgment') && (
            <View style={styles.tfRow}>
              {['true', 'false'].map((val) => {
                const isSelected = selectedAnswers[currentExercise] === val;
                const label = val === 'true' ? '√ 正确' : '× 错误';
                let btnStyle = styles.tfBtn;
                if (showResult) {
                  if (val === exercise.correct_answer) btnStyle = [styles.tfBtn, styles.correctBtn];
                  else if (isSelected) btnStyle = [styles.tfBtn, styles.wrongBtn];
                } else if (isSelected) {
                  btnStyle = [styles.tfBtn, styles.selectedBtn];
                }
                return (
                  <TouchableOpacity key={val} style={btnStyle} onPress={() => handleAnswer(val)} disabled={showResult}>
                    <Text style={styles.tfText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {showResult && (
            <View style={styles.resultBox}>
              <Text style={styles.resultText}>
                {selectedAnswers[currentExercise] === exercise.correct_answer ? '✓ 正确！' : `✗ 正确答案是: ${exercise.correct_answer}`}
              </Text>
            </View>
          )}

          {exercise.explanation && showResult && (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationLabel}>解析</Text>
              <Text style={styles.explanationText}>{exercise.explanation}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {!showResult ? (
          <TouchableOpacity
            style={[styles.actionBtn, !selectedAnswers[currentExercise] && styles.disabledBtn]}
            onPress={checkAnswer}
            disabled={!selectedAnswers[currentExercise]}
          >
            <Text style={styles.actionBtnText}>确认答案</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={nextExercise}>
            <Text style={styles.actionBtnText}>{currentExercise < normalizedExercises.length - 1 ? '下一题' : '完成课程'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  closeBtn: { fontSize: 28, color: '#333', padding: 4 },
  progressOuter: { flex: 1, height: 6, backgroundColor: '#eee', borderRadius: 3, marginHorizontal: 12 },
  progressInner: { height: '100%', backgroundColor: '#1cb964', borderRadius: 3 },
  progressText: { fontSize: 14, color: '#666', width: 40, textAlign: 'right' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  lessonTitle: { fontSize: 22, fontWeight: '700', color: '#333', marginBottom: 16 },
  conceptBox: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16 },
  conceptLabel: { fontSize: 13, fontWeight: '600', color: '#1cb964', marginBottom: 8 },
  conceptText: { fontSize: 15, color: '#333', lineHeight: 22 },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  keyword: { backgroundColor: '#f5f5f5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginRight: 8, marginTop: 8, fontSize: 13, color: '#666' },
  exerciseBox: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  exerciseLabel: { fontSize: 13, fontWeight: '600', color: '#1cb964', marginBottom: 12 },
  question: { fontSize: 17, fontWeight: '600', color: '#333', marginBottom: 16, lineHeight: 24 },
  optionBtn: { padding: 14, backgroundColor: '#f5f5f5', borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  optionText: { fontSize: 15, color: '#333' },
  selectedBtn: { borderColor: '#1cb964', backgroundColor: '#e8f5e9' },
  selectedText: { color: '#1cb964', fontWeight: '600' },
  correctBtn: { borderColor: '#1cb964', backgroundColor: '#e8f5e9' },
  correctText: { color: '#1cb964', fontWeight: '600' },
  wrongBtn: { borderColor: '#f06595', backgroundColor: '#fce4ec' },
  wrongText: { color: '#f06595', fontWeight: '600' },
  tfRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 10 },
  tfBtn: { flex: 1, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 10, marginHorizontal: 6, alignItems: 'center' },
  tfText: { fontSize: 16, fontWeight: '600', color: '#333' },
  resultBox: { marginTop: 16, padding: 14, backgroundColor: '#f8f9fa', borderRadius: 8 },
  resultText: { fontSize: 14, color: '#666' },
  explanationBox: { marginTop: 16, padding: 14, backgroundColor: '#fff9e6', borderRadius: 8 },
  explanationLabel: { fontSize: 13, fontWeight: '600', color: '#fcc419', marginBottom: 6 },
  explanationText: { fontSize: 14, color: '#666', lineHeight: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', paddingBottom: 34 },
  actionBtn: { backgroundColor: '#1cb964', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  disabledBtn: { backgroundColor: '#ccc' },
  actionBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

export default LessonScreen;
