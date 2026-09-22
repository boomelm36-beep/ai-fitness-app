// store.ts
import { create } from 'zustand'

interface AppState {
  userStats: { weight: string; height: string; goal: string; age: string } | null;
  exercisePlan: any | null;
  nutritionPlan: any | null;
  setUserStats: (stats: any) => void;
  setPlans: (exercise: any, nutrition: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  userStats: null,
  exercisePlan: null,
  nutritionPlan: null,
  setUserStats: (stats) => set({ userStats: stats }),
  setPlans: (exercise, nutrition) => set({ exercisePlan: exercise, nutritionPlan: nutrition }),
}))