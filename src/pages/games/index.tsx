import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import GameCard from '@/components/GameCard';
import { games } from '@/data/games';
import type { Game } from '@/types';
import { useAppStore } from '@/store/useAppStore';

const CATEGORY_FAVORITE = 'favorite';
const CATEGORY_RECENT = 'recent';

const categories = [
  { id: 'all', label: '全部' },
  { id: CATEGORY_FAVORITE, label: '⭐ 我的收藏' },
  { id: CATEGORY_RECENT, label: '🕒 最近在玩' },
  { id: '节奏', label: '节奏' },
  { id: '消除', label: '消除' },
  { id: '益智', label: '益智' },
  { id: '动作', label: '动作' },
  { id: '休闲', label: '休闲' },
];

const GamesPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [filteredGames, setFilteredGames] = useState<Game[]>(games);
  const [localGames, setLocalGames] = useState<Game[]>(games);

  const favoriteGameIds = useAppStore((state) => state.favoriteGameIds);
  const recentGames = useAppStore((state) => state.recentGames);
  const initGameData = useAppStore((state) => state.initGameData);
  const addRecentGame = useAppStore((state) => state.addRecentGame);

  useEffect(() => {
    initGameData();
  }, [initGameData]);

  useEffect(() => {
    filterGames();
  }, [activeCategory, favoriteGameIds, recentGames, localGames]);

  useDidShow(() => {
    console.log('[GamesPage] 页面显示');
    initGameData();
  });

  const filterGames = () => {
    let filtered: Game[] = [];

    if (activeCategory === CATEGORY_FAVORITE) {
      filtered = localGames.filter((g) => favoriteGameIds.includes(g.id));
    } else if (activeCategory === CATEGORY_RECENT) {
      const recentIds = recentGames.map((rg) => rg.gameId);
      filtered = recentIds
        .map((id) => localGames.find((g) => g.id === id))
        .filter((g): g is Game => g !== undefined);
    } else if (activeCategory === 'all') {
      filtered = localGames;
    } else {
      filtered = localGames.filter((g) => g.category === activeCategory);
    }

    console.log('[GamesPage] 筛选游戏，分类:', activeCategory, '数量:', filtered.length);
    setFilteredGames(filtered);
  };

  const handleCategoryClick = (categoryId: string) => {
    console.log('[GamesPage] 点击分类:', categoryId);
    setActiveCategory(categoryId);
  };

  const handleGameClick = (game: Game) => {
    console.log('[GamesPage] 点击游戏:', game.id, game.name);

    setLocalGames((prev) =>
      prev.map((g) =>
        g.id === game.id ? { ...g, playCount: g.playCount + 1 } : g
      )
    );

    addRecentGame(game.id);

    Taro.navigateTo({
      url: `/pages/game-detail/index?id=${game.id}`,
    });
  };

  const handlePullDownRefresh = () => {
    console.log('[GamesPage] 下拉刷新');
    setTimeout(() => {
      filterGames();
      Taro.stopPullDownRefresh();
    }, 1000);
  };

  useEffect(() => {
    if (typeof Taro.onPullDownRefresh === 'function') {
      Taro.onPullDownRefresh(handlePullDownRefresh);
      return () => {
        if (typeof Taro.offPullDownRefresh === 'function') {
          Taro.offPullDownRefresh(handlePullDownRefresh);
        }
      };
    }
  }, []);

  const totalPlayCount = localGames.reduce((sum, g) => sum + g.playCount, 0);
  const highScore = Math.max(...localGames.map((g) => g.highScore));
  const featuredGame = localGames[0];

  const isSpecialCategory = useMemo(
    () => activeCategory === CATEGORY_FAVORITE || activeCategory === CATEGORY_RECENT,
    [activeCategory]
  );

  const getEmptyStateText = () => {
    if (activeCategory === CATEGORY_FAVORITE) {
      return { title: '暂无收藏', desc: '点击游戏卡片上的星标即可收藏游戏' };
    }
    if (activeCategory === CATEGORY_RECENT) {
      return { title: '最近没有玩游戏', desc: '快去试玩几款小游戏吧' };
    }
    return { title: '暂无游戏', desc: '该分类下暂时没有小游戏' };
  };

  const emptyText = getEmptyStateText();

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.header}>
        <Text className={styles.title}>🎮 车间小游戏</Text>
        <Text className={styles.subtitle}>
          单手操作，碎片化时间轻松解压
        </Text>
      </View>

      <ScrollView className={styles.tabs} scrollX>
        {categories.map((category) => (
          <View
            key={category.id}
            className={classnames(styles.tabItem, activeCategory === category.id && styles.active)}
            onClick={() => handleCategoryClick(category.id)}
          >
            <Text className={styles.tabLabel}>{category.label}</Text>
          </View>
        ))}
      </ScrollView>

      <View className={styles.statsBar}>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{localGames.length}</Text>
          <Text className={styles.statLabel}>游戏总数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>
            {totalPlayCount >= 10000
              ? `${(totalPlayCount / 10000).toFixed(1)}万`
              : totalPlayCount}
          </Text>
          <Text className={styles.statLabel}>总游玩次数</Text>
        </View>
        <View className={styles.statItem}>
          <Text className={styles.statValue}>{highScore}</Text>
          <Text className={styles.statLabel}>最高分</Text>
        </View>
      </View>

      {activeCategory === 'all' && featuredGame && (
        <View className={styles.featuredGame}>
          <Text className={styles.featuredLabel}>
            <Text className={styles.emoji}>🔥</Text>
            热门推荐
          </Text>
          <GameCard game={featuredGame} onClick={handleGameClick} />
        </View>
      )}

      <View className={styles.gameGrid}>
        {filteredGames.length > 0 ? (
          filteredGames
            .filter((g) => activeCategory === 'all' ? g.id !== featuredGame?.id : true)
            .map((game) => (
              <View key={game.id} className={styles.gameCardWrapper}>
                <GameCard game={game} onClick={handleGameClick} />
              </View>
            ))
        ) : (
          <View className={styles.emptyState}>
            <Text className={styles.emoji}>{activeCategory === CATEGORY_FAVORITE ? '⭐' : activeCategory === CATEGORY_RECENT ? '🕒' : '🎮'}</Text>
            <Text className={styles.title}>{emptyText.title}</Text>
            <Text className={styles.desc}>{emptyText.desc}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default GamesPage;
