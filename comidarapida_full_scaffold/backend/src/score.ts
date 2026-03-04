import Redis from 'ioredis'
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379'
const redis = new Redis(redisUrl)

/*
  Simple function to compute score for ad object.
  In production, this could be run as a worker and cached in Redis.
*/
export function computeScoreForAd(ad:any){
  const now = Date.now();
  const created = new Date(ad.createdAt).getTime();
  const hoursSince = Math.max(1, (now - created) / (1000*60*60));
  const categoryBoost = (ad.Category?.visibilityRank ?? 10);
  const paidBoost = ad.paid ? 100 : 0;
  const timeScore = 1 / hoursSince;
  const score = categoryBoost + paidBoost + timeScore;
  return score;
}

export async function cacheScore(adId:string, score:number){
  try {
    await redis.hset('ad_scores', adId, String(score));
  } catch(e){
    console.warn('Redis not available, skipping cache');
  }
}
