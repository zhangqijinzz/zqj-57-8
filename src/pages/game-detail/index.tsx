import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Image, Button } from '@tarojs/components';
import Taro, { useDidShow, useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { games } from '@/data/games';
import { useAppStore } from '@/store/useAppStore';
import type { Game } from '@/types';

const GameDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.params;

  const game = useMemo<Game | undefined>(() => {
    return games.find((g) => g.id === id);
  }, [id]);

  const isFavorite = useAppStore((state) => state.favoriteGameIds.includes(id || ''));
  const toggleFavorite = useAppStore((state) => state.toggleFavorite);
  const addRecentGame = useAppStore((state) => state.addRecentGame);
  const initGameData = useAppStore((state) => state.initGameData);

  const [hasPlayed, setHasPlayed] = useState(false);

  useDidShow(() => {
    console.log('[GameDetailPage] 页面显示，游戏ID:', id);
    initGameData();
  });

  const handleFavoriteClick = () => {
    if (!id) return;
    console.log('[GameDetailPage] 点击收藏:', id, !isFavorite);
    toggleFavorite(id);
    Taro.showToast({
      title: isFavorite ? '已取消收藏' : '已收藏',
      icon: 'success',
      duration: 1500,
    });
  };

  const handlePlayClick = () => {
    if (!id) return;
    console.log('[GameDetailPage] 开始试玩:', id);
    setHasPlayed(true);
    addRecentGame(id);
    Taro.showToast({
      title: '试玩中...',
      icon: 'loading',
      duration: 1500,
    });
  };

  const getDifficultyStars = (difficulty: Game['difficulty']) => {
    const count = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
    return [1, 2, 3].map((i) => (
      <Text
        key={i}
        className={`${styles.star} ${i <= count ? styles.filled : styles.empty}`}
      >
        ★
      </Text>
    ));
  };

  const formatPlayCount = (count: number) => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toString();
  };

  if (!game) {
    return (
      <ScrollView className={styles.page} scrollY>
        <View className={styles.placeholder}>
          <Text className={styles.icon}>❓</Text>
          <Text className={styles.title}>游戏不存在</Text>
          <Text className={styles.desc}>该游戏可能已下架</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView className={styles.page} scrollY>
      <View className={styles.cover}>
        <Image src={game.coverImage} mode="aspectFill" />
        <View
          className={classnames(styles.favoriteBtn, isFavorite && styles.favorited)}
          onClick={handleFavoriteClick}
        >
          <Text className={styles.favoriteIcon}>★</Text>
          <Text className={styles.favoriteText}>
            {isFavorite ? '已收藏' : '收藏'}
          </Text>
        </View>
      </View>

      <View className={styles.info}>
        <Text className={styles.name}>{game.name}</Text>
        <Text className={styles.description}>{game.description}</Text>

        <View className={styles.metaRow}>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>分类</Text>
            <Text className={styles.metaValue}>{game.category}</Text>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>难度</Text>
            <View className={styles.stars}>
              {getDifficultyStars(game.difficulty)}
            </View>
          </View>
          <View className={styles.metaItem}>
            <Text className={styles.metaLabel}>时长</Text>
            <Text className={styles.metaValue}>约 {game.estimatedTime} 分钟</Text>
          </View>
        </View>

        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{formatPlayCount(game.playCount)}</Text>
            <Text className={styles.statLabel}>游玩次数</Text>
          </View>
          <View className={styles.statDivider} />
          <View className={styles.statItem}>
            <Text className={styles.statValue}>{game.highScore}</Text>
            <Text className={styles.statLabel}>最高分</Text>
          </View>
        </View>
      </View>

      <View className={styles.actionArea}>
        <Button
          className={classnames(styles.playBtn, hasPlayed && styles.played)}
          onClick={handlePlayClick}
        >
          <Text className={styles.playIcon}>▶</Text>
          <Text className={styles.playText}>{hasPlayed ? '再玩一次' : '开始试玩'}</Text>
        </Button>
        {hasPlayed && (
          <Text className={styles.playedHint}>
            ✓ 已加入「最近在玩」列表
          </Text>
        )}
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>游戏介绍</Text>
        <Text className={styles.sectionContent}>
          {game.description} 这是一款专为夜班工作者设计的休闲小游戏，
          单手即可操作，利用碎片化时间轻松解压。
          {'\n\n'}
          游戏特色：
          {'\n'}
          • 简单易上手，适合各年龄段玩家
          {'\n'}
          • 画风清新，音效轻快
          {'\n'}
          • 支持排行榜，与同事一较高下
          {'\n'}
          • 离线也能玩，无需担心流量
        </Text>
      </View>
    </ScrollView>
  );
};

export default GameDetailPage;
