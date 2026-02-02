import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import ChapterScreen from '../screens/ChapterScreen';
import LessonScreen from '../screens/LessonScreen';
import ResultScreen from '../screens/ResultScreen';
import PracticeScreen from '../screens/PracticeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: '#1cb964',
      tabBarInactiveTintColor: '#999',
      tabBarLabelStyle: styles.tabLabel,
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === '首页') iconName = focused ? 'home' : 'home-outline';
        else if (route.name === '复习') iconName = focused ? 'book' : 'book-outline';
        else if (route.name === '我的') iconName = focused ? 'person' : 'person-outline';
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
  >
    <Tab.Screen name="首页" component={HomeScreen} />
    <Tab.Screen 
      name="复习" 
      component={PracticeScreen} 
      initialParams={{ reviewedOnly: true }}
    />
    <Tab.Screen name="我的" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { flex: 1 },
        cardStyleInterpolator: ({ current: { progress } }) => ({
          cardStyle: {
            opacity: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 1],
            }),
          },
        }),
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Chapter" component={ChapterScreen} />
      <Stack.Screen name="Lesson" component={LessonScreen} />
      <Stack.Screen name="Result" component={ResultScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="Practice" component={PracticeScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tabLabel: { fontSize: 11, fontWeight: '600' },
  header: { backgroundColor: '#fff' },
});

export default AppNavigator;
