export const calculateFantasyPoints = (s: any) => {
  const pts = s.pts * 1;
  const reb = s.reb * 1;
  const ast = s.ast * 2;
  const stl = s.stl * 4;
  const blk = s.blk * 4;
  const fgm = s.fgm * 2;
  const ftm = s.ftm * 1;
  const tpm = s.fg3m * 1;
  const tov = s.tov * -2;

  const fgMiss = (s.fga - s.fgm) * -1;
  const ftMiss = (s.fta - s.ftm) * -1;

  return pts + reb + ast + stl + blk + fgm + ftm + tpm + tov + fgMiss + ftMiss;
};
