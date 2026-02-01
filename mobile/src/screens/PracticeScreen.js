import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { questionsApi } from '../services/api';
import { useApp } from '../context/AppContext';

const { width } = Dimensions.get('window');

const PracticeScreen = ({ route, navigation }) => {
  const wrongOnly = route?.params?.wrongOnly || false;
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { submitAnswer, lives, setLives } = useApp();

  useEffect(() => {
    loadQuestions();
  }, [wrongOnly]);

  const loadQuestions = async () => {
    try {
      const params = wrongOnly ? { wrong_only: true } : {};
      const res = await questionsApi.get(params);
      setQuestions(res.data.questions || getMockQuestions());
    } catch (error) {
      setQuestions(getMockQuestions());
    } finally {
      setLoading(false);
    }
  };

  const getMockQuestions = () => [
    { id: 'Q1', type: 'single_choice', question: '下列关于会计目标的表述中，正确的是？', options: ['A. 满足投资者需求', 'B. 满足所有需求', 'C. 为管理层决策', 'D. 反映受托责任'], correct_answer: 'A' },
    { id: 'Q2', type: 'judgment', question: '会计信息质量要求中，可靠性是首要要求。', correct_answer: 'true' },
    { id: 'Q3', type: 'single_choice', question: '资产计量属性不包括？', options: ['A. 历史成本', 'B. 重置成本', 'C. 公允价值', 'D. 预算成本'], correct_answer: 'D' },
  ];

  const handleAnswer = (answer) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const checkAnswer = async () => {
    const question = questions[currentIndex];
    let isCorrect = false;

    if (question.type === 'single_choice') {
      isCorrect = selectedAnswer === question.correct_answer;
    } else if (question.type === 'judgment') {
      isCorrect = selectedAnswer === question.correct_answer;
    }

    setShowResult(true);
    setCorrectCount(c => isCorrect ? c + 1 : c);
    await submitAnswer(question.id, isCorrect);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return <View style={styles.container}><Text>加载题目中...</Text></View>;
  }

  if (questions.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{wrongOnly ? '错题练习' : '专项练习'}</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#1cb964" />
          <Text style={styles.emptyText}>
            {wrongOnly ? '太棒了！没有错题！' : '暂无练习题'}
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>返回</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{wrongOnly ? '错题练习' : '专项练习'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%`}]} />
        <Text style={styles.progressText}>{currentIndex + 1}/{questions.length}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <View style={styles.typeTag}>
            <Text style={styles.typeText}>
              {wrongOnly ? '错题巩固' : (question.type === 'single_choice' ? '单选题' : '判断题')}
            </Text>
          </View>
          <Text style={styles.questionText}>{question.question}</Text>

          {question.type === 'single_choice' && question.options?.map((opt, i) => {
            const optLetter = String.fromCharCode(65 + i);
            const isSelected = selectedAnswer === optLetter;
            let btnStyle = styles.optionBtn;
            let textStyle = styles.optionText;

            if (showResult) {
              if (optLetter === question.correct_answer) {
                btnStyle = [styles.optionBtn, styles.correctBtn];
                textStyle = [styles.optionText, styles.correctText];
              } else if (isSelected && optLetter !== question.correct_answer) {
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

          {question.type === 'judgment' && (
            <View style={styles.tfRow}>
              {['true', 'false'].map((val) => {
                const isSelected = selectedAnswer === val;
                const label = val === 'true' ? '正确' : '错误';
                const symbol = val === 'true' ? '√' : '×';
                let btnStyle = styles.tfBtn;
                if (showResult) {
                  if (val === question.correct_answer) btnStyle = [styles.tfBtn, styles.correctBtn];
                  else if (isSelected) btnStyle = [styles.tfBtn, styles.wrongBtn];
                } else if (isSelected) {
                  btnStyle = [styles.tfBtn, styles.selectedBtn];
                }
                return (
                  <TouchableOpacity key={val} style={btnStyle} onPress={() => handleAnswer(val)} disabled={showResult}>
                    <Text style={styles.tfText}>{symbol} {label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {showResult && (
            <View style={styles.resultBox}>
              <Ionicons name={selectedAnswer === question.correct_answer ? "checkmark-circle" : "close-circle"} size={24} color={selectedAnswer === question.correct_answer ? "#1cb964" : "#f06595"} />
              <Text style={styles.resultText}>
                {selectedAnswer === question.correct_answer ? '正确！' : `正确答案是 ${question.correct_answer === 'true' ? '正确' : question.correct_answer}`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!showResult ? (
          <TouchableOpacity style={styles.checkBtn} onPress={checkAnswer} disabled={!selectedAnswer}>
            <Text style={styles.checkBtnText}>确认答案</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
            <Text style={styles.nextBtnText}>{currentIndex < questions.length - 1 ? '下一题' : '完成练习'}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {lives === 0 && (
        <View style={styles.noLivesOverlay}>
          <View style={styles.noLivesCard}>
            <Ionicons name="heart-dislike" size={48} color="#f06595" />
            <Text style={styles.noLivesTitle}>生命值不足</Text>
            <Text style={styles.noLivesText}>休息一下，30分钟后继续学习</Text>
            <TouchableOpacity style={styles.waitBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.waitBtnText}>我知道了</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  progressBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#fff' },
  progressFill: { height: 6, backgroundColor: '#1cb964', borderRadius: 3 },
  progressText: { fontSize: 14, fontWeight: '600', color: '#666', marginLeft: 12 },
  content: { flex: 1, padding: 16 },
  questionCard: { backgroundColor: '#fff', padding: 20, borderRadius: 12 },
  typeTag: { backgroundColor: '#e8f5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginBottom: 12 },
  typeText: { fontSize: 12, color: '#1cb964', fontWeight: '600' },
  questionText: { fontSize: 17, fontWeight: '600', color: '#333', lineHeight: 24, marginBottom: 20 },
  optionBtn: { padding: 14, backgroundColor: '#f5f5f5', borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  optionText: { fontSize: 15, color: '#333' },
  selectedBtn: { borderColor: '#1cb964', backgroundColor: '#e8f5e9' },
  selectedText: { color: '#1cb964', fontWeight: '600' },
  correctBtn: { borderColor: '#1cb964', backgroundColor: '#e8f5e9' },
  correctText: { color: '#1cb964', fontWeight: '600' },
  wrongBtn: { borderColor: '#f06595', backgroundColor: '#fce4ec' },
  wrongText: { color: '#f06595', fontWeight: '600' },
  tfRow: { flexDirection: 'row', justifyContent: 'space-around' },
  tfBtn: { flex: 1, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 10, marginHorizontal: 6, alignItems: 'center' },
  tfText: { fontSize: 16, fontWeight: '600', color: '#333' },
  resultBox: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8 },
  resultText: { marginLeft: 10, fontSize: 14, color: '#666', flex: 1 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  checkBtn: { backgroundColor: '#1cb964', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  checkBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  nextBtn: { backgroundColor: '#1cb964', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', marginRight: 8 },
  noLivesOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  noLivesCard: { backgroundColor: '#fff', padding: 30, borderRadius: 16, alignItems: 'center', width: width - 48 },
  noLivesTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 16, marginBottom: 8 },
  noLivesText: { fontSize: 15, color: '#666', marginBottom: 20 },
  waitBtn: { backgroundColor: '#1cb964', paddingHorizontal: 40, paddingVertical: 12, borderRadius: 8 },
  waitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontSize: 18, color: '#666', marginTop: 16, marginBottom: 24 },
  backBtn: { backgroundColor: '#1cb964', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  backBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default PracticeScreen;
