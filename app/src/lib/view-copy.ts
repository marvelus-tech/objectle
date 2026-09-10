interface ViewState {
  visualProfile: string | null;
  revealTier: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  zoomLevel: number;
  guessesMade: number;
}

const structuralProfiles: Record<string, string> = {
  p01: 'a tall frame with a broad upper plane, a lower platform, and narrow supports',
  p02: 'two large circular forms joined by a thin angular frame',
  p03: 'a compact cylindrical body with a curved projection on one side',
  p04: 'a tall central stem between a weighted base and a wider upper shade',
  p05: 'a long narrow handle ending in a short, heavy perpendicular head',
  p06: 'a broad horizontal plane supported by several narrow vertical forms',
  p07: 'a thin rounded rectangle with a nearly flat front face',
  p08: 'a low rounded vessel with a wide opening and narrower base',
  p09: 'a low elongated body with smaller circular forms near its base',
  p10: 'a long slender handle widening into a shallow oval end',
  p11: 'a long horizontal seat with a small number of sturdy supports',
  p12: 'a thin shaft with a broader head and an irregular notched end',
};

function getStructure(visualProfile: string | null) {
  return structuralProfiles[visualProfile ?? ''] ??
    'a compact arrangement of simple geometric volumes';
}

function getAngleNote(rotationX: number, rotationY: number) {
  const normalizedY = Math.abs(rotationY % 180);
  const sideView = normalizedY > 55 && normalizedY < 125;
  const topView = Math.abs(rotationX % 180) > 35;

  if (topView) return 'The elevated angle makes its upper surfaces easier to compare.';
  if (sideView) return 'This side profile separates its depth from its height.';
  return 'The current three-quarter angle shows its overall proportions.';
}

export function describeCurrentView(state: ViewState) {
  const structure = getStructure(state.visualProfile);
  const tierCopy = [
    `A near-black silhouette shows ${structure}. Surface and material clues remain hidden.`,
    `A matte clay study reveals ${structure}. Major volumes and negative spaces are now readable.`,
    `Soft studio light clarifies ${structure}. Edges, proportions, and contact points are visible.`,
    `The full gallery treatment reveals ${structure}. Fine contours and material response are clearly lit.`,
  ][Math.max(0, Math.min(3, state.revealTier))];

  return [
    `${tierCopy} ${getAngleNote(state.rotationX, state.rotationY)}`,
    `Orientation: X ${state.rotationX}°, Y ${state.rotationY}°, Z ${state.rotationZ}°.`,
    `Zoom ${state.zoomLevel + 1}/4. ${state.guessesMade}/6 guesses used.`,
  ].join('\n\n');
}
