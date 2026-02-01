export const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: "会计新手" },
  { level: 2, xpRequired: 50, title: "记账学徒" },
  { level: 3, xpRequired: 150, title: "初级会计" },
  { level: 4, xpRequired: 300, title: "账务专员" },
  { level: 5, xpRequired: 500, title: "中级会计" },
  { level: 6, xpRequired: 800, title: "高级会计" },
  { level: 7, xpRequired: 1200, title: "财务主管" },
  { level: 8, xpRequired: 1700, title: "财务经理" },
  { level: 9, xpRequired: 2300, title: "财务总监" },
  { level: 10, xpRequired: 3000, title: "注册会计师" },
  { level: 11, xpRequired: 4000, title: "CPA精英" },
  { level: 12, xpRequired: 5500, title: "CPA专家" },
  { level: 13, xpRequired: 7500, title: "CPA大师" },
  { level: 14, xpRequired: 10000, title: "财会大师" },
  { level: 15, xpRequired: 15000, title: "财会传奇" },
];

export const ACHIEVEMENTS = [
  {
    id: "first_lesson",
    title: "开始学习",
    description: "完成第一课",
    icon: "🎯",
    condition: (stats) => stats.lessonsCompleted >= 1,
  },
  {
    id: "ten_lessons",
    title: "勤奋好学",
    description: "完成10课",
    icon: "📚",
    condition: (stats) => stats.lessonsCompleted >= 10,
  },
  {
    id: "fifty_lessons",
    title: "学富五车",
    description: "完成50课",
    icon: "🏆",
    condition: (stats) => stats.lessonsCompleted >= 50,
  },
  {
    id: "hundred_lessons",
    title: "百尺竿头",
    description: "完成100课",
    icon: "👑",
    condition: (stats) => stats.lessonsCompleted >= 100,
  },
  {
    id: "first_streak",
    title: "连续学习",
    description: "连续学习1天",
    icon: "🔥",
    condition: (stats) => stats.maxStreak >= 1,
  },
  {
    id: "week_streak",
    title: "坚持不懈",
    description: "连续学习7天",
    icon: "💪",
    condition: (stats) => stats.maxStreak >= 7,
  },
  {
    id: "month_streak",
    title: "月度冠军",
    description: "连续学习30天",
    icon: "🏅",
    condition: (stats) => stats.maxStreak >= 30,
  },
  {
    id: "perfect_lesson",
    title: "完美答案",
    description: "一课全对",
    icon: "⭐",
    condition: (stats) => stats.perfectLessons >= 1,
  },
  {
    id: "speed_learner",
    title: "快速学习",
    description: "一天完成5课",
    icon: "⚡",
    condition: (stats) => stats.maxDailyLessons >= 5,
  },
  {
    id: "first_chapter",
    title: "章节突破",
    description: "完成第一章",
    icon: "🚀",
    condition: (stats) => stats.chaptersCompleted >= 1,
  },
  {
    id: "half_course",
    title: "半程马拉松",
    description: "完成一半课程",
    icon: "🏃",
    condition: (stats) => stats.chaptersCompleted >= 14,
  },
  {
    id: "full_course",
    title: "毕业啦！",
    description: "完成全部课程",
    icon: "🎓",
    condition: (stats) => stats.chaptersCompleted >= 28,
  },
  {
    id: "accuracy_50",
    title: "初露锋芒",
    description: "正确率50%",
    icon: "📈",
    condition: (stats) => stats.accuracy >= 50,
  },
  {
    id: "accuracy_80",
    title: "精准打击",
    description: "正确率80%",
    icon: "🎯",
    condition: (stats) => stats.accuracy >= 80,
  },
  {
    id: "accuracy_95",
    title: "完美主义",
    description: "正确率95%",
    icon: "💯",
    condition: (stats) => stats.accuracy >= 95,
  },
];

export const DAILY_GOALS = {
  lessons: { target: 1, xp: 50 },
  xp: { target: 50, xp: 20 },
  accuracy: { target: 70, xp: 30 },
};

export const calculateLevel = (xp) => {
  let currentLevel = 1;
  let title = LEVEL_THRESHOLDS[0].title;
  
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xpRequired) {
      currentLevel = LEVEL_THRESHOLDS[i].level;
      title = LEVEL_THRESHOLDS[i].title;
      break;
    }
  }
  
  const currentThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel);
  const nextThreshold = LEVEL_THRESHOLDS.find(t => t.level === currentLevel + 1);
  
  const xpInCurrentLevel = xp - (currentThreshold?.xpRequired || 0);
  const xpForNextLevel = nextThreshold 
    ? nextThreshold.xpRequired - (currentThreshold?.xpRequired || 0)
    : 0;
  
  return {
    level: currentLevel,
    title,
    xpInCurrentLevel,
    xpForNextLevel,
    progress: nextThreshold ? (xpInCurrentLevel / xpForNextLevel) * 100 : 100,
  };
};

export const calculateStats = (progress) => {
  const lessons = progress?.lessons || {};
  const questionStates = progress?.question_states || {};
  const statistics = progress?.statistics || {};
  
  const lessonsCompleted = Object.keys(lessons).length;
  
  let correct = 0;
  let wrong = 0;
  Object.values(questionStates).forEach(state => {
    correct += state.correct || 0;
    wrong += state.wrong || 0;
  });
  
  const totalQuestions = correct + wrong;
  const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;
  
  const chaptersCompleted = statistics.chapters_completed || 0;
  const maxStreak = statistics.max_streak || 0;
  const maxDailyLessons = statistics.max_daily_lessons || 0;
  const perfectLessons = statistics.perfect_lessons || 0;
  
  return {
    lessonsCompleted,
    totalQuestions,
    correct,
    wrong,
    accuracy,
    chaptersCompleted,
    maxStreak,
    maxDailyLessons,
    perfectLessons,
  };
};

export const checkAchievements = (stats, unlockedIds = []) => {
  return ACHIEVEMENTS.map(achievement => ({
    ...achievement,
    unlocked: unlockedIds.includes(achievement.id) || achievement.condition(stats),
    unlockedAt: unlockedIds.includes(achievement.id) ? new Date().toISOString() : null,
  }));
};

export const getStreakBonus = (streak) => {
  if (streak >= 30) return 1.5;
  if (streak >= 14) return 1.3;
  if (streak >= 7) return 1.2;
  if (streak >= 3) return 1.1;
  return 1.0;
};

export const getDailyProgress = (dailyActivity) => {
  const today = new Date().toISOString().split('T')[0];
  const todayData = dailyActivity?.[today] || {};
  
  return {
    lessonsCompleted: todayData.lessons_completed || 0,
    xpEarned: todayData.xp_earned || 0,
    questionsAnswered: todayData.questions_answered || 0,
    goals: {
      lessons: { 
        current: todayData.lessons_completed || 0, 
        target: DAILY_GOALS.lessons.target 
      },
      xp: { 
        current: todayData.xp_earned || 0, 
        target: DAILY_GOALS.xp.target 
      },
    },
    completed: (todayData.lessons_completed || 0) >= DAILY_GOALS.lessons.target,
  };
};
