import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userApi, chaptersApi } from '../services/api';
import {
  calculateLevel,
  calculateStats,
  checkAchievements,
  getStreakBonus,
  getDailyProgress,
  LEVEL_THRESHOLDS,
  ACHIEVEMENTS,
  DAILY_GOALS,
} from '../utils/gamification';

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState(null);
  const [chapters, setChapters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lives, setLives] = useState(5);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState({ level: 1, title: '会计新手', progress: 0 });
  const [achievements, setAchievements] = useState([]);
  const [dailyProgress, setDailyProgress] = useState({ goals: {}, completed: false });
  const [newAchievements, setNewAchievements] = useState([]);

  const loadData = async () => {
    try {
      const [userRes, progressRes, chaptersRes] = await Promise.all([
        userApi.getProfile(),
        userApi.getProgress(),
        chaptersApi.getAll(),
      ]);
      
      const userData = userRes.data;
      const progressData = progressRes.data;
      
      setUser(userData);
      setProgress(progressData);
      setChapters(chaptersRes.data);
      
      const userXp = userData?.xp || 0;
      const userStreak = userData?.streak || 0;
      const userLives = userData?.lives || 5;
      
      setXp(userXp);
      setStreak(userStreak);
      setLives(userLives);
      
      const newLevel = calculateLevel(userXp);
      setLevel(newLevel);
      
      const stats = calculateStats(progressData);
      const unlockedIds = progressData?.achievements || [];
      const allAchievements = checkAchievements(stats, unlockedIds);
      setAchievements(allAchievements);
      
      const newUnlocked = allAchievements.filter(
        a => a.unlocked && !unlockedIds.includes(a.id)
      );
      if (newUnlocked.length > 0) {
        setNewAchievements(newUnlocked);
        setTimeout(() => setNewAchievements([]), 5000);
      }
      
      const daily = getDailyProgress(progressData?.daily_activity);
      setDailyProgress(daily);
      
    } catch (error) {
      setUser({ 
        username: 'CPA学习者', 
        level: 1, 
        xp: 0, 
        streak: 0, 
        lives: 5,
        daily_goal: 50 
      });
      setChapters({ chapters: [
        { chapter_id: '1', title: '总论', lessons_count: 12, total_xp: 735 },
        { chapter_id: '2', title: '存货', lessons_count: 8, total_xp: 450 },
        { chapter_id: '3', title: '固定资产', lessons_count: 10, total_xp: 580 },
        { chapter_id: '4', title: '无形资产', lessons_count: 8, total_xp: 420 },
        { chapter_id: '5', title: '投资性房地产', lessons_count: 6, total_xp: 300 },
        { chapter_id: '6', title: '长期股权投资', lessons_count: 12, total_xp: 720 },
      ], total_xp: 3205 });
      
      setLevel(calculateLevel(0));
      setAchievements(checkAchievements({
        lessonsCompleted: 0,
        totalQuestions: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
        chaptersCompleted: 0,
        maxStreak: 0,
        maxDailyLessons: 0,
        perfectLessons: 0,
      }));
      setDailyProgress({
        lessonsCompleted: 0,
        xpEarned: 0,
        goals: { lessons: { current: 0, target: DAILY_GOALS.lessons.target } },
        completed: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const completeLesson = async (lessonId, score, xpEarned) => {
    const bonus = getStreakBonus(streak);
    const finalXp = Math.round(xpEarned * bonus);
    
    try {
      const res = await userApi.completeLesson({ 
        lesson_id: lessonId, 
        score, 
        xp_earned: finalXp 
      });
      
      const newXp = res.data.total_xp;
      const newLevel = calculateLevel(newXp);
      
      setXp(newXp);
      setStreak(prev => prev + 1);
      setLevel(newLevel);
      
      const stats = calculateStats(progress);
      const unlockedIds = progress?.achievements || [];
      const allAchievements = checkAchievements(stats, unlockedIds);
      const newlyUnlocked = allAchievements.filter(
        a => a.unlocked && !unlockedIds.includes(a.id)
      );
      
      if (newlyUnlocked.length > 0) {
        setAchievements(allAchievements);
        setNewAchievements(newlyUnlocked);
        setTimeout(() => setNewAchievements([]), 5000);
      }
      
      const daily = getDailyProgress(progress?.daily_activity);
      setDailyProgress(daily);
      
      return { 
        ...res.data, 
        xpEarned: finalXp, 
        bonus,
        levelUp: newLevel.level > level.level,
        newLevel,
      };
    } catch (error) {
      setXp(prev => prev + finalXp);
      setStreak(prev => prev + 1);
      setLevel(calculateLevel(xp + finalXp));
      return { success: true, xpEarned: finalXp, bonus };
    }
  };

  const submitAnswer = async (questionId, isCorrect) => {
    try {
      const res = await userApi.submitAnswer({ 
        question_id: questionId, 
        is_correct: isCorrect 
      });
      
      setLives(res.data.lives);
      setXp(res.data.xp);
      setLevel(calculateLevel(res.data.xp));
      
      return res.data;
    } catch (error) {
      const xpGain = isCorrect ? 2 : 0;
      setXp(prev => prev + xpGain);
      setLives(prev => isCorrect ? prev : Math.max(0, prev - 1));
      setLevel(calculateLevel(xp + xpGain));
      return { 
        lives: Math.max(0, lives - (isCorrect ? 0 : 1)), 
        xp: xp + xpGain 
      };
    }
  };

  const resetProgress = async () => {
    try {
      await userApi.resetProgress();
      setXp(0);
      setStreak(0);
      setLives(5);
      setLevel(calculateLevel(0));
      setProgress(null);
      setAchievements(checkAchievements({
        lessonsCompleted: 0,
        totalQuestions: 0,
        correct: 0,
        wrong: 0,
        accuracy: 0,
        chaptersCompleted: 0,
        maxStreak: 0,
        maxDailyLessons: 0,
        perfectLessons: 0,
      }));
      setDailyProgress({
        lessonsCompleted: 0,
        xpEarned: 0,
        goals: { lessons: { current: 0, target: DAILY_GOALS.lessons.target } },
        completed: false,
      });
      await loadData();
    } catch (error) {
      console.error('Reset error:', error);
    }
  };

  const value = {
    user,
    progress,
    chapters,
    loading,
    lives,
    setLives,
    xp,
    setXp,
    streak,
    setStreak,
    level,
    achievements,
    dailyProgress,
    newAchievements,
    loadData,
    completeLesson,
    submitAnswer,
    resetProgress,
    LEVEL_THRESHOLDS,
    ACHIEVEMENTS,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
