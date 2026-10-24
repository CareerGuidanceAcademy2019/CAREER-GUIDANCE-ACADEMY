'use client';

import React from 'react';

interface CgaLoadingScreenProps {
  fullScreen?: boolean;
  className?: string;
}

/**
 * CgaLoadingScreen
 * Removed spinning circular ring and CGA logo as requested.
 * Returns null to eliminate visual blocking and loading delays.
 */
export function CgaLoadingScreen(_props: CgaLoadingScreenProps) {
  return null;
}

export default CgaLoadingScreen;
