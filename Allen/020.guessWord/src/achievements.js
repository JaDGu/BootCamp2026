export const ACHIEVEMENTS = Object.freeze([
  Object.freeze({
    id: "golden_legend",
    icon: "🌟",
    name: "金色传说",
    description: "一次就猜中了整个单词。",
    isUnlocked: ({ tries }) => tries === 1,
  }),
  Object.freeze({
    id: "word_master",
    icon: "🧠",
    name: "猜词大师",
    description: "在 3 次以内猜出了单词。",
    isUnlocked: ({ tries }) => tries >= 2 && tries <= 3,
  }),
  Object.freeze({
    id: "brute_force_master",
    icon: "🐒",
    name: "暴力破解大师",
    description: "刚好用了 25 次才猜出单词。",
    isUnlocked: ({ tries }) => tries === 25,
  }),
  Object.freeze({
    id: "painfully_bad",
    icon: "🐒",
    name: "菜的抠脚",
    description: "只要把所有字母都试一遍，答案<s>迟早会出现</s>。",
    isUnlocked: ({ tries }) => tries > 25,
  }),
]);

export function findUnlockedAchievements(gameResult) {
  return ACHIEVEMENTS.filter((achievement) =>
    achievement.isUnlocked(gameResult),
  );
}

export function getAchievementMessage(achievements) {
  if (achievements.length === 0) {
    return null;
  }

  const details = achievements
    .map(
      ({ icon, name, description }) =>
        `<tg-spoiler>${icon} <b>${name}</b>\n${description}</tg-spoiler>`,
    )
    .join("\n\n");

  return `🎁 <b>ACHIEVEMENT UNLOCKED</b>\n\n${details}`;
}
