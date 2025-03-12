import { create } from 'zustand';

interface AnimationState {
    skipAnimation: boolean;
    setSkipAnimation: (skip: boolean) => void;
}

export const useAnimationStore = create<AnimationState>((set) => ({
    skipAnimation: false,
    setSkipAnimation: (skip) => {
        console.log('animationStore.setSkipAnimation:', skip);
        set({ skipAnimation: skip });
    }
})); 