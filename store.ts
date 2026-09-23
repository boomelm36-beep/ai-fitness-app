// store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserStats {
  weight: string;
  height: string;
  goal: string;
  age: string;
  equipment: string[];
  swimmingPool: boolean;
  foodAccess: string[];
  eatingMethods: string[]; // <-- New field
  allergies: string[];     // <-- New field
}

interface AppState {
  userStats: UserStats | null;
  exercisePlan: any | null;
  nutritionPlan: any | null;
  setUserStats: (stats: UserStats) => void;
  setPlans: (exercise: any, nutrition: any) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userStats: null,
      exercisePlan: null,
      nutritionPlan: null,
      setUserStats: (stats) => set({ userStats: stats }),
      setPlans: (exercise, nutrition) => set({ exercisePlan: exercise, nutritionPlan: nutrition }),
    }),
    {
      name: 'ai-fit-storage',
    }
  )
)