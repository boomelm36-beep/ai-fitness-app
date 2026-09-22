// store.ts
import { create } from 'zustand'

interface AppState {
  userStats: { weight: string; height: string; goal: string; age: string } | null;
  exercisePlan: string;
  nutritionPlan: string;
  setUserStats: (stats: any) => void;
  setPlans: (exercise: string, nutrition: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  userStats: null,
  exercisePlan: "",
  nutritionPlan: "",
  setUserStats: (stats) => set({ userStats: stats }),
  setPlans: (exercise, nutrition) => set({ exercisePlan: exercise, nutritionPlan: nutrition }),
}))