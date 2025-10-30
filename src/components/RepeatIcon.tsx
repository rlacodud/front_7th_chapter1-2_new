import { Repeat } from '@mui/icons-material';
import React from 'react';

interface RepeatIconProps {
  isRepeating: boolean;
  size?: 'inherit' | 'small' | 'medium' | 'large';
  showTestId?: boolean; // 테스트 식별자를 부여해야 하는 경우만 true
}

export function RepeatIcon({ isRepeating, size = 'small', showTestId = false }: RepeatIconProps) {
  if (!isRepeating) return null;
  if (showTestId) {
    return <Repeat data-testid="repeat-icon" fontSize={size} />;
  }
  return <Repeat fontSize={size} />;
}
