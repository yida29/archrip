import { useCallback, useEffect, useRef, useState } from 'react';

import type { UseCase } from '../types.ts';

export interface FlowAnimationState {
  activeStep: number;
  flowNodeIds: string[] | null;
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
}

const NOOP = () => {};

const IDLE_STATE: FlowAnimationState = {
  activeStep: -1,
  flowNodeIds: null,
  isPlaying: false,
  play: NOOP,
  pause: NOOP,
  next: NOOP,
  prev: NOOP,
};

export function useFlowAnimation(
  useCases: UseCase[],
  selectedUseCase: string | null,
): FlowAnimationState {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uc = selectedUseCase ? useCases.find((u) => u.id === selectedUseCase) : undefined;
  const flow = uc?.flow;
  const flowLength = flow?.length ?? 0;

  // Reset on use case change
  useEffect(() => {
    setActiveStep(0);
    setIsPlaying(true);
  }, [selectedUseCase]);

  // Auto-advance timer
  useEffect(() => {
    if (!flow || flowLength < 2 || !isPlaying) return;

    timerRef.current = setTimeout(() => {
      setActiveStep((prev) => {
        const next = prev + 1;
        return next >= flowLength ? 0 : next;
      });
    }, 800);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [flow, flowLength, isPlaying, activeStep]);

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);

  const next = useCallback(() => {
    setIsPlaying(false);
    setActiveStep((prev) => (prev + 1 >= flowLength ? prev : prev + 1));
  }, [flowLength]);

  const prev = useCallback(() => {
    setIsPlaying(false);
    setActiveStep((prev) => (prev <= 0 ? 0 : prev - 1));
  }, []);

  if (!flow || flowLength < 2) {
    return IDLE_STATE;
  }

  return { activeStep, flowNodeIds: flow, isPlaying, play, pause, next, prev };
}
