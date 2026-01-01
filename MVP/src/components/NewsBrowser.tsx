/**
 * NEWS BROWSER - Laptop Layer Component
 *
 * Features:
 * - Tabbed interface for news categories (World, Local, Crime, Politics, Sports, Entertainment)
 * - Headline list with timestamps
 * - Full article view on click
 * - News source and bias indicators
 * - Fame/public opinion impact display
 * - EXPANDED: Classifieds, Wanted Posters, Letters to Editor
 * - EXPANDED: Regional newspaper archetypes by MediaFreedom
 * - Responsive design styled like a news website
 */

import React, { useState, useMemo } from 'react';
import { useGameStore } from '../stores/enhancedGameStore';
import { NewsArticle, NewsCategory, NewsBias } from '../data/newsTemplates';
import {
  ClassifiedAd,
  WantedPoster,
  LetterToEditor,
} from '../data/newspaperExpansion';
import type { GeneratedMission } from '../data/missionSystem';

// =============================================================================
// TYPES
// =============================================================================

type SortOption = 'newest' | 'oldest' | 'most-impactful';
type MainSection = 'news' | 'classifieds' | 'wanted' | 'letters';

// =============================================================================
// MISSION-TO-CLASSIFIED CONVERSION
// =============================================================================

const MISSION_TYPE_TO_CATEGORY: Record<string, ClassifiedAd['category']> = {
  extract: 'retrieval',
  escort: 'security',
  protect: 'security',
  rescue: 'retrieval',
  assassinate: 'services',
  infiltrate: 'investigation',
  investigate: 'investigation',
  sabotage: 'services',
  capture_hold: 'security',
  skirmish: 'security',
  patrol: 'security',
};

const MISSION_SOURCE_TO_LEGALITY: Record<string, ClassifiedAd['legality']> = {
  police: 'legal',
  military: 'legal',
  special_forces: 'gray',
  handler: 'gray',
  private: 'legal',
  underworld: 'illegal',
  terrorism: 'illegal',
};

function missionToClassified(mission: GeneratedMission, gameDay: number): ClassifiedAd {
  const category = MISSION_TYPE_TO_CATEGORY[mission.template.type] || 'services';
  const legality = MISSION_SOURCE_TO_LEGALITY[mission.template.source] || 'gray';

  // Generate cryptic contact info for illegal/gray jobs
  const contactInfo = legality === 'illegal'
    ? `Leave message at dead drop #${Math.floor(Math.random() * 999) + 100}`
    : legality === 'gray'
    ? `Reply to Box #${Math.floor(Math.random() * 9999) + 1000}`
    : `Contact: ${mission.city || 'Local Office'}`;

  return {
    id: `cl_${mission.id}`,
    category,
    legality,
    title: mission.template.name,
    description: mission.briefing || mission.template.description,
    contactInfo,
    isCodedMessage: legality !== 'legal',
    payment: mission.reward,
    paymentType: 'cash',
    isRead: false,
    respondedTo: false,
    publishedDay: gameDay,
    publishedHour: Math.floor(Math.random() * 24),
    missionId: mission.id,
  };
}

function generateWantedFromPlayerHeat(
  playerFame: number,
  playerName: string = 'Unknown Vigilante',
  gameDay: number
): WantedPoster | null {
  // Only generate wanted poster if player has significant negative fame or heat
  if (playerFame >= -50) return null;

  const reward = Math.abs(playerFame) * 100;
  const dangerLevel = Math.min(5, Math.floor(Math.abs(playerFame) / 50) + 1);

  return {
    id: `w_player_${gameDay}`,
    status: 'active',
    targetName: playerName,
    targetAlias: 'The Vigilante',
    targetDescription: 'Individual involved in unauthorized superhuman activity. Consider armed and dangerous.',
    isPlayerCharacter: true,
    reward,
    rewardCurrency: 'usd',
    issuer: 'government',
    deadOrAlive: 'alive',
    crimes: ['Vigilante Activity', 'Unauthorized Use of Powers'],
    dangerLevel,
    powersKnown: ['Unknown'],
    jurisdictions: ['NATIONAL'],
    publishedDay: gameDay,
  };
}

function generateLettersFromArticles(
  articles: NewsArticle[],
  count: number = 5
): LetterToEditor[] {
  const letters: LetterToEditor[] = [];
  const recentArticles = articles
    .filter(a => a.fameImpact !== 0 || a.publicOpinionShift)
    .slice(0, 10);

  const AUTHOR_TYPES: LetterToEditor['authorType'][] = ['citizen', 'business_owner', 'official', 'anonymous'];
  const LOCATIONS = ['Downtown', 'Suburbs', 'Industrial District', 'Market District', 'Residential Area'];
  const FIRST_NAMES = ['J.', 'M.', 'R.', 'A.', 'S.', 'D.', 'K.', 'T.', 'L.'];
  const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Martinez', 'Chen', 'Kim', 'Davis', 'Wilson'];

  for (let i = 0; i < Math.min(count, recentArticles.length); i++) {
    const article = recentArticles[i];
    const isPositive = (article.fameImpact || 0) > 0;
    const authorType = AUTHOR_TYPES[Math.floor(Math.random() * AUTHOR_TYPES.length)];

    letters.push({
      id: `lt_gen_${i}_${Date.now()}`,
      authorName: authorType === 'anonymous'
        ? 'Anonymous'
        : `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`,
      authorLocation: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
      authorType,
      subject: isPositive
        ? `Re: ${article.headline.slice(0, 30)}... - Thank You!`
        : `Re: ${article.headline.slice(0, 30)}... - Concerned Citizen`,
      body: isPositive
        ? `After reading about the recent events, I wanted to express my gratitude. It's reassuring to know there are those willing to stand up for what's right.`
        : `I read with concern the recent article. When will our leaders address these issues? The current situation is unacceptable.`,
      sentiment: isPositive ? 'positive' : 'negative',
      topic: isPositive ? 'hero_praise' : 'hero_criticism',
      agreedCount: Math.floor(Math.random() * 500) + 100,
      disagreedCount: Math.floor(Math.random() * 200) + 50,
      publishedDay: article.timestamp ? Math.floor(article.timestamp / 24) : 1,
      publishedHour: Math.floor(Math.random() * 24),
    });
  }

  return letters;
}

// Demo data for expanded sections (fallback)
const DEMO_CLASSIFIEDS: ClassifiedAd[] = [
  {
    id: 'cl_1',
    category: 'security',
    legality: 'legal',
    title: 'Executive Protection Position Available',
    description: 'Seeking experienced security professional for high-profile client. Must have clean background and be comfortable in formal settings. Travel required.',
    contactInfo: 'Reply to Box #4521',
    isCodedMessage: false,
    payment: 15000,
    paymentType: 'cash',
    isRead: false,
    respondedTo: false,
    publishedDay: 1,
    publishedHour: 9,
    missionId: 'mission_bodyguard_001',
  },
  {
    id: 'cl_2',
    category: 'retrieval',
    legality: 'gray',
    title: 'Antique Collector Seeks Specialist',
    description: 'Antique firearms collector seeks rare pieces for private collection. Discrete sellers only. Cash payment.',
    contactInfo: 'Leave message at The Red Dragon',
    isCodedMessage: true,
    payment: 25000,
    paymentType: 'cash',
    isRead: false,
    respondedTo: false,
    publishedDay: 1,
    publishedHour: 14,
  },
  {
    id: 'cl_3',
    category: 'real_estate',
    legality: 'legal',
    title: 'Warehouse Space - Industrial District',
    description: 'Large warehouse in industrial zone. Previous tenant left abruptly. Priced to sell quickly. No inspections.',
    contactInfo: 'Contact: Meyer Properties',
    isCodedMessage: false,
    payment: 75000,
    paymentType: 'cash',
    isRead: false,
    respondedTo: false,
    publishedDay: 2,
    publishedHour: 8,
  },
  {
    id: 'cl_4',
    category: 'services',
    legality: 'illegal',
    title: 'Medical Supplies - No Prescription',
    description: 'Full range of medical supplies available. Discrete packaging. Cash only. Doctor on call.',
    contactInfo: 'Text: 555-HEAL',
    isCodedMessage: true,
    payment: 0,
    paymentType: 'cash',
    isRead: false,
    respondedTo: false,
    publishedDay: 2,
    publishedHour: 22,
  },
  {
    id: 'cl_5',
    category: 'investigation',
    legality: 'legal',
    title: 'Private Investigator Wanted',
    description: 'Law firm seeking discrete investigator for sensitive case. Must be able to gather evidence legally. Prior experience required.',
    contactInfo: 'Apply: Jenkins & Associates',
    isCodedMessage: false,
    payment: 8000,
    paymentType: 'cash',
    isRead: false,
    respondedTo: false,
    publishedDay: 3,
    publishedHour: 10,
    missionId: 'mission_investigation_001',
  },
];

const DEMO_WANTED: WantedPoster[] = [
  {
    id: 'w_1',
    status: 'active',
    targetName: 'The Crimson Fist',
    targetAlias: 'Marcus Kane',
    targetDescription: 'Male, 6\'2", muscular build. Last seen wearing red tactical suit. Enhanced strength and durability.',
    isPlayerCharacter: false,
    reward: 50000,
    rewardCurrency: 'usd',
    issuer: 'government',
    deadOrAlive: 'alive',
    crimes: ['Vigilante Activity', 'Destruction of Government Property', 'Assault on Law Enforcement'],
    lastSeen: 'Industrial District, Sector K5',
    dangerLevel: 4,
    powersKnown: ['Super Strength', 'Enhanced Durability'],
    jurisdictions: ['GLOBAL'],
    publishedDay: 1,
    missionId: 'mission_hunt_001',
  },
  {
    id: 'w_2',
    status: 'active',
    targetName: 'Dr. Venom',
    targetDescription: 'Female, 5\'8", pale complexion. Genius-level intellect. Creates biological weapons.',
    isPlayerCharacter: false,
    reward: 100000,
    rewardCurrency: 'usd',
    issuer: 'corporation',
    issuerName: 'Apex Pharmaceuticals',
    deadOrAlive: 'alive',
    crimes: ['Industrial Espionage', 'Theft of Proprietary Technology', 'Murder'],
    dangerLevel: 5,
    powersKnown: ['Toxin Generation', 'Poison Immunity'],
    jurisdictions: ['US', 'EU', 'JP'],
    publishedDay: 2,
    missionId: 'mission_hunt_002',
  },
  {
    id: 'w_3',
    status: 'active',
    targetName: 'Night Stalker',
    targetDescription: 'Unknown gender, estimated 5\'10". Moves through shadows. Connected to 12 disappearances.',
    isPlayerCharacter: false,
    reward: 25000,
    rewardCurrency: 'usd',
    issuer: 'private',
    deadOrAlive: 'either',
    crimes: ['Kidnapping', 'Murder'],
    lastSeen: 'Downtown, near abandoned subway',
    dangerLevel: 3,
    powersKnown: ['Shadow Manipulation', 'Teleportation'],
    jurisdictions: ['METRO'],
    publishedDay: 3,
  },
];

const DEMO_LETTERS: LetterToEditor[] = [
  {
    id: 'lt_1',
    authorName: 'J. Martinez',
    authorLocation: 'Downtown',
    authorType: 'citizen',
    subject: 'Thank You, Masked Hero!',
    body: 'I was there during the incident on 5th Street. If it weren\'t for that masked vigilante, I wouldn\'t be writing this letter. My family and I are forever grateful. To whoever you are - thank you.',
    sentiment: 'positive',
    topic: 'hero_praise',
    agreedCount: 847,
    disagreedCount: 123,
    publishedDay: 1,
    publishedHour: 14,
  },
  {
    id: 'lt_2',
    authorName: 'Frustrated Business Owner',
    authorLocation: 'Market District',
    authorType: 'business_owner',
    subject: 'Who Will Pay for the Damage?',
    body: 'My shop was destroyed in the so-called "heroic" battle last week. Insurance doesn\'t cover "superhuman activity." Three generations of my family built this business. Who is responsible? Not the criminals - they never pay. The heroes? They just fly away.',
    sentiment: 'negative',
    topic: 'hero_criticism',
    agreedCount: 532,
    disagreedCount: 289,
    publishedDay: 2,
    publishedHour: 9,
  },
  {
    id: 'lt_3',
    authorName: 'Anonymous',
    authorLocation: 'Undisclosed',
    authorType: 'anonymous',
    subject: 'Open Your Eyes',
    body: 'Has anyone else noticed how these "random" attacks always seem to happen when the government needs a distraction? The timing is too convenient. The cover stories don\'t add up. We\'re being played. Follow the money.',
    sentiment: 'negative',
    topic: 'conspiracy',
    agreedCount: 1203,
    disagreedCount: 2847,
    publishedDay: 2,
    publishedHour: 23,
  },
  {
    id: 'lt_4',
    authorName: 'Sarah Chen',
    authorLocation: 'Riverside',
    authorType: 'victim',
    subject: 'The Real Victims',
    body: 'My husband died in the downtown incident. He wasn\'t a hero or a villain - just a man on his way to work. Everyone celebrates when the villain is defeated. Nobody talks about the people who didn\'t make it home that day.',
    sentiment: 'mixed',
    topic: 'collateral_damage',
    agreedCount: 2156,
    disagreedCount: 34,
    publishedDay: 3,
    publishedHour: 11,
  },
  {
    id: 'lt_5',
    authorName: 'Dr. R. Williams',
    authorLocation: 'University District',
    authorType: 'expert',
    subject: 'The Vigilante Question',
    body: 'I understand the appeal of vigilantes - the police can\'t be everywhere. But at what point do we become okay with people operating outside the law? Due process exists for a reason. What happens when a "hero" makes a mistake?',
    sentiment: 'neutral',
    topic: 'vigilante_debate',
    agreedCount: 678,
    disagreedCount: 445,
    publishedDay: 3,
    publishedHour: 15,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatGameTime(timestamp: number): string {
  const days = Math.floor(timestamp / 1440);
  const hours = Math.floor((timestamp % 1440) / 60);
  const minutes = timestamp % 60;

  const period = hours < 12 ? 'AM' : 'PM';
  const hours12 = hours % 12 || 12;

  return `Day ${days}, ${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

function getBiasColor(bias: NewsBias): string {
  switch (bias) {
    case 'pro-player': return 'text-green-400';
    case 'anti-player': return 'text-red-400';
    case 'neutral': return 'text-gray-400';
    case 'pro-regulation': return 'text-blue-400';
    case 'anti-regulation': return 'text-orange-400';
    default: return 'text-gray-400';
  }
}

function getBiasLabel(bias: NewsBias): string {
  switch (bias) {
    case 'pro-player': return 'Favorable';
    case 'anti-player': return 'Critical';
    case 'neutral': return 'Neutral';
    case 'pro-regulation': return 'Pro-Regulation';
    case 'anti-regulation': return 'Anti-Regulation';
    default: return 'Unknown';
  }
}

function getOpinionColor(opinion: number): string {
  if (opinion >= 50) return 'text-green-400';
  if (opinion >= 20) return 'text-lime-400';
  if (opinion >= -20) return 'text-yellow-400';
  if (opinion >= -50) return 'text-orange-400';
  return 'text-red-400';
}

function getOpinionLabel(opinion: number): string {
  if (opinion >= 50) return 'Very Positive';
  if (opinion >= 20) return 'Positive';
  if (opinion >= -20) return 'Neutral';
  if (opinion >= -50) return 'Negative';
  return 'Very Negative';
}

function getLegalityColor(legality: string): string {
  switch (legality) {
    case 'legal': return 'text-green-400';
    case 'gray': return 'text-yellow-400';
    case 'illegal': return 'text-red-400';
    default: return 'text-gray-400';
  }
}

function getLegalityLabel(legality: string): string {
  switch (legality) {
    case 'legal': return 'Legitimate';
    case 'gray': return 'Gray Market';
    case 'illegal': return 'Underground';
    default: return 'Unknown';
  }
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'security': return '🛡️';
    case 'investigation': return '🔍';
    case 'retrieval': return '📦';
    case 'enforcement': return '👊';
    case 'specialist': return '🔧';
    case 'underground': return '🌑';
    case 'real_estate': return '🏢';
    case 'services': return '💼';
    default: return '📋';
  }
}

function getDangerLevelColor(level: number): string {
  switch (level) {
    case 1: return 'text-green-400';
    case 2: return 'text-lime-400';
    case 3: return 'text-yellow-400';
    case 4: return 'text-orange-400';
    case 5: return 'text-red-400';
    default: return 'text-gray-400';
  }
}

function getDangerLevelLabel(level: number): string {
  switch (level) {
    case 1: return 'Low Risk';
    case 2: return 'Moderate';
    case 3: return 'Dangerous';
    case 4: return 'Very Dangerous';
    case 5: return 'Extreme Threat';
    default: return 'Unknown';
  }
}

function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'border-green-500';
    case 'negative': return 'border-red-500';
    case 'mixed': return 'border-yellow-500';
    case 'neutral': return 'border-gray-500';
    default: return 'border-gray-500';
  }
}

function getIssuerBadge(issuer: string): { label: string; color: string } {
  switch (issuer) {
    case 'government': return { label: 'FEDERAL', color: 'bg-blue-600' };
    case 'corporation': return { label: 'CORPORATE', color: 'bg-purple-600' };
    case 'criminal': return { label: 'UNDERWORLD', color: 'bg-red-600' };
    case 'private': return { label: 'PRIVATE', color: 'bg-gray-600' };
    default: return { label: 'UNKNOWN', color: 'bg-gray-600' };
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function NewsBrowser() {
  const newsArticles = useGameStore(state => state.newsArticles);
  const playerFame = useGameStore(state => state.playerFame);
  const publicOpinion = useGameStore(state => state.publicOpinion);
  const markArticleRead = useGameStore(state => state.markArticleRead);
  const availableMissions = useGameStore(state => state.availableMissions);
  const gameTime = useGameStore(state => state.gameTime);

  // Handler to select and mark article as read
  const handleArticleClick = (article: NewsArticle) => {
    if (!article.isRead && markArticleRead) {
      markArticleRead(article.id);
    }
    setSelectedArticle(article);
  };

  const [mainSection, setMainSection] = useState<MainSection>('news');
  const [selectedCategory, setSelectedCategory] = useState<NewsCategory | 'all'>('all');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [selectedClassified, setSelectedClassified] = useState<ClassifiedAd | null>(null);
  const [selectedWanted, setSelectedWanted] = useState<WantedPoster | null>(null);
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Generate classifieds from real missions
  const classifieds = useMemo(() => {
    const gameDay = gameTime?.day || 1;
    const missionClassifieds: ClassifiedAd[] = [];

    // Convert available missions to classified ads
    if (availableMissions) {
      availableMissions.forEach((missions) => {
        missions.forEach(mission => {
          if (mission.status === 'available') {
            missionClassifieds.push(missionToClassified(mission, gameDay));
          }
        });
      });
    }

    // If no missions, show demo classifieds as fallback
    return missionClassifieds.length > 0 ? missionClassifieds : DEMO_CLASSIFIEDS;
  }, [availableMissions, gameTime?.day]);

  // Generate wanted posters from player heat/fame
  const wantedPosters = useMemo(() => {
    const gameDay = gameTime?.day || 1;
    const posters: WantedPoster[] = [];

    // Generate player wanted poster if they have negative fame
    const playerPoster = generateWantedFromPlayerHeat(playerFame || 0, 'The Player', gameDay);
    if (playerPoster) {
      posters.push(playerPoster);
    }

    // Add demo wanted posters for other targets
    return [...posters, ...DEMO_WANTED];
  }, [playerFame, gameTime?.day]);

  // Generate letters from news articles
  const letters = useMemo(() => {
    const generated = generateLettersFromArticles(newsArticles, 5);
    // If no articles generated letters, use demo data
    return generated.length > 0 ? generated : DEMO_LETTERS;
  }, [newsArticles]);

  // =============================================================================
  // FILTERING AND SORTING
  // =============================================================================

  const filteredArticles = useMemo(() => {
    let filtered = newsArticles;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Sort
    const sorted = [...filtered];
    if (sortOption === 'newest') {
      sorted.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOption === 'oldest') {
      sorted.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOption === 'most-impactful') {
      sorted.sort((a, b) => Math.abs(b.fameImpact || 0) - Math.abs(a.fameImpact || 0));
    }

    return sorted;
  }, [newsArticles, selectedCategory, sortOption]);

  // =============================================================================
  // CATEGORY TABS
  // =============================================================================

  const categories: { id: NewsCategory | 'all'; label: string; icon: string }[] = [
    { id: 'all', label: 'All News', icon: '📰' },
    { id: 'world', label: 'World', icon: '🌍' },
    { id: 'local', label: 'Local', icon: '🏙️' },
    { id: 'crime', label: 'Crime', icon: '🚨' },
    { id: 'politics', label: 'Politics', icon: '🏛️' },
    { id: 'sports', label: 'Sports', icon: '🏆' },
    { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  ];

  // =============================================================================
  // RENDER ARTICLE VIEW
  // =============================================================================

  if (selectedArticle) {
    const totalOpinionShift = selectedArticle.publicOpinionShift
      ? Object.values(selectedArticle.publicOpinionShift).reduce((sum, val) => sum + val, 0)
      : 0;

    return (
      <div className="w-full h-full bg-gray-900 text-gray-100 overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 border-b border-blue-700 shadow-lg">
          <button
            onClick={() => setSelectedArticle(null)}
            className="mb-2 px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg transition-colors"
          >
            ← Back to Headlines
          </button>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 text-sm text-blue-300 mb-2">
                <span className="font-semibold">{selectedArticle.source}</span>
                <span className="text-gray-400">•</span>
                <span className={getBiasColor(selectedArticle.bias)}>
                  {getBiasLabel(selectedArticle.bias)}
                </span>
                <span className="text-gray-400">•</span>
                <span>{formatGameTime(selectedArticle.timestamp)}</span>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {selectedArticle.headline}
              </h1>
            </div>
          </div>
        </div>

        {/* ARTICLE CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-8">
            {/* Article Image (if available) */}
            {selectedArticle.imageUrl && (
              <div className="mb-6">
                <img
                  src={selectedArticle.imageUrl}
                  alt={selectedArticle.headline}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Article Body */}
            <div className="prose prose-invert max-w-none">
              {selectedArticle.fullText ? (
                <div className="text-gray-300 leading-relaxed space-y-4">
                  {selectedArticle.fullText.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="text-lg">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic">Full article content not available.</p>
              )}
            </div>

            {/* Impact Information */}
            <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-xl font-bold text-white mb-4">Impact Analysis</h3>

              <div className="space-y-3">
                {/* Fame Impact */}
                {selectedArticle.fameImpact !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Fame Impact:</span>
                    <span
                      className={`font-bold ${
                        selectedArticle.fameImpact > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {selectedArticle.fameImpact > 0 ? '+' : ''}
                      {selectedArticle.fameImpact}
                    </span>
                  </div>
                )}

                {/* Public Opinion Shift */}
                {selectedArticle.publicOpinionShift && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400">Public Opinion:</span>
                      <span
                        className={`font-bold ${
                          totalOpinionShift > 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {totalOpinionShift > 0 ? '+' : ''}
                        {totalOpinionShift}
                      </span>
                    </div>
                    <div className="ml-4 space-y-1">
                      {Object.entries(selectedArticle.publicOpinionShift).map(([country, shift]) => (
                        <div key={country} className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{country}:</span>
                          <span
                            className={`${
                              shift > 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {shift > 0 ? '+' : ''}
                            {shift}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Countries */}
                {selectedArticle.relatedCountries.length > 0 && (
                  <div>
                    <span className="text-gray-400 block mb-2">Related Countries:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.relatedCountries.map(country => (
                        <span
                          key={country}
                          className="px-3 py-1 bg-blue-900 text-blue-200 rounded-full text-sm"
                        >
                          {country}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Factions */}
                {selectedArticle.relatedFactions.length > 0 && (
                  <div>
                    <span className="text-gray-400 block mb-2">Related Factions:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedArticle.relatedFactions.map(faction => (
                        <span
                          key={faction}
                          className="px-3 py-1 bg-red-900 text-red-200 rounded-full text-sm"
                        >
                          {faction}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mission Opportunity (if available) */}
            {selectedArticle.missionOpportunity && (
              <div className="mt-6 p-6 bg-yellow-900 border border-yellow-700 rounded-lg">
                <h3 className="text-xl font-bold text-yellow-200 mb-2">
                  🎯 Mission Opportunity Detected
                </h3>
                <p className="text-yellow-100">
                  This article may lead to a new mission. Check your mission board.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =============================================================================
  // MAIN SECTION TABS
  // =============================================================================

  const mainSections: { id: MainSection; label: string; icon: string; count?: number }[] = [
    { id: 'news', label: 'Headlines', icon: '📰', count: filteredArticles.length },
    { id: 'classifieds', label: 'Classifieds', icon: '📋', count: classifieds.length },
    { id: 'wanted', label: 'Wanted', icon: '🎯', count: wantedPosters.length },
    { id: 'letters', label: 'Letters', icon: '✉️', count: letters.length },
  ];

  // =============================================================================
  // RENDER CLASSIFIEDS SECTION
  // =============================================================================

  const renderClassifieds = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 bg-amber-900/20 border-b border-amber-700">
        <h2 className="text-xl font-bold text-amber-300">📋 Classified Advertisements</h2>
        <p className="text-amber-200/70 text-sm">Job opportunities and services. Some listings may be coded.</p>
      </div>
      <div className="divide-y divide-gray-800">
        {classifieds.map(ad => (
          <div
            key={ad.id}
            onClick={() => setSelectedClassified(ad)}
            className={`p-4 hover:bg-gray-800 cursor-pointer transition-colors border-l-4 ${
              ad.legality === 'legal' ? 'border-green-500' :
              ad.legality === 'gray' ? 'border-yellow-500' : 'border-red-500'
            }`}
          >
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
              <span>{getCategoryIcon(ad.category)}</span>
              <span className="capitalize">{ad.category.replace('_', ' ')}</span>
              <span>•</span>
              <span className={getLegalityColor(ad.legality)}>{getLegalityLabel(ad.legality)}</span>
              {ad.isCodedMessage && <span className="text-purple-400">🔐 Coded</span>}
              {ad.missionId && <span className="text-yellow-400">🎯 Mission</span>}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{ad.title}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{ad.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm">
              {ad.payment > 0 && (
                <span className="text-green-400 font-semibold">${ad.payment.toLocaleString()}</span>
              )}
              <span className="text-gray-500">{ad.contactInfo}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // =============================================================================
  // RENDER WANTED POSTERS SECTION
  // =============================================================================

  const renderWanted = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 bg-red-900/20 border-b border-red-700">
        <h2 className="text-xl font-bold text-red-300">🎯 Wanted Posters & Bounties</h2>
        <p className="text-red-200/70 text-sm">Active bounties. Hunt for profit or ignore at your own risk.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {wantedPosters.map(poster => {
          const issuerBadge = getIssuerBadge(poster.issuer);
          return (
            <div
              key={poster.id}
              onClick={() => setSelectedWanted(poster)}
              className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-red-500 cursor-pointer transition-colors"
            >
              {/* Header */}
              <div className="bg-red-900 p-3 text-center">
                <span className={`text-xs px-2 py-1 rounded ${issuerBadge.color}`}>
                  {issuerBadge.label}
                </span>
                <div className="text-2xl font-bold text-red-200 mt-2">WANTED</div>
                <div className="text-xs text-red-300">{poster.deadOrAlive.toUpperCase()}</div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-xl font-bold text-white text-center mb-1">{poster.targetName}</h3>
                {poster.targetAlias && (
                  <p className="text-gray-400 text-sm text-center mb-2">aka "{poster.targetAlias}"</p>
                )}

                <div className="flex items-center justify-between text-sm mt-3">
                  <span className={`font-semibold ${getDangerLevelColor(poster.dangerLevel)}`}>
                    ⚠️ {getDangerLevelLabel(poster.dangerLevel)}
                  </span>
                  <span className="text-green-400 font-bold">
                    ${poster.reward.toLocaleString()}
                  </span>
                </div>

                <div className="mt-2 text-xs text-gray-500">
                  {poster.crimes.slice(0, 2).join(' • ')}
                </div>

                {poster.missionId && (
                  <div className="mt-2 text-center">
                    <span className="text-xs px-2 py-1 bg-yellow-600 text-yellow-100 rounded">
                      Hunt Available
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // =============================================================================
  // RENDER LETTERS SECTION
  // =============================================================================

  const renderLetters = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 bg-blue-900/20 border-b border-blue-700">
        <h2 className="text-xl font-bold text-blue-300">✉️ Letters to the Editor</h2>
        <p className="text-blue-200/70 text-sm">Public reactions to recent events. The voice of the people.</p>
      </div>
      <div className="divide-y divide-gray-800">
        {letters.map(letter => (
          <div
            key={letter.id}
            className={`p-4 border-l-4 ${getSentimentColor(letter.sentiment)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{letter.authorName}</span>
                <span className="text-gray-500 text-sm">• {letter.authorLocation}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-green-400">👍 {letter.agreedCount}</span>
                <span className="text-red-400">👎 {letter.disagreedCount}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-blue-300 mb-2">"{letter.subject}"</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{letter.body}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded ${
                letter.sentiment === 'positive' ? 'bg-green-900 text-green-300' :
                letter.sentiment === 'negative' ? 'bg-red-900 text-red-300' :
                letter.sentiment === 'mixed' ? 'bg-yellow-900 text-yellow-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {letter.sentiment}
              </span>
              <span className="text-xs text-gray-500 capitalize">{letter.topic.replace(/_/g, ' ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // =============================================================================
  // RENDER HEADLINES LIST
  // =============================================================================

  return (
    <div className="w-full h-full bg-gray-900 text-gray-100 overflow-hidden flex flex-col">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-4 border-b border-blue-700 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">News Browser</h1>
            <p className="text-blue-300 text-sm">Stay informed on world events and your actions</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-300 mb-1">Fame Level</div>
            <div className="text-2xl font-bold text-yellow-400">{playerFame}</div>
          </div>
        </div>

        {/* Main Section Tabs */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          {mainSections.map(section => (
            <button
              key={section.id}
              onClick={() => setMainSection(section.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${
                mainSection === section.id
                  ? 'bg-white text-blue-900 font-bold'
                  : 'bg-blue-800/50 text-blue-200 hover:bg-blue-700'
              }`}
            >
              {section.icon} {section.label}
              {section.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  mainSection === section.id ? 'bg-blue-900 text-white' : 'bg-blue-700 text-blue-200'
                }`}>
                  {section.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Category Tabs (only for news) */}
        {mainSection === 'news' && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-sm ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-blue-800 text-blue-300 hover:bg-blue-700'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CONTROLS - Only show for news */}
      {mainSection === 'news' && (
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="text-gray-400">
            {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Sort by:</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="most-impactful">Most Impactful</option>
            </select>
          </div>
        </div>
      )}

      {/* CONTENT AREA - Conditional rendering based on section */}
      {mainSection === 'classifieds' && renderClassifieds()}
      {mainSection === 'wanted' && renderWanted()}
      {mainSection === 'letters' && renderLetters()}

      {/* HEADLINES LIST - Only show for news section */}
      {mainSection === 'news' && <div className="flex-1 overflow-y-auto">
        {filteredArticles.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">📰</div>
              <div className="text-xl font-semibold mb-2">No News Yet</div>
              <p className="text-gray-600">Complete missions to generate news coverage.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {filteredArticles.map(article => {
              const totalOpinionShift = article.publicOpinionShift
                ? Object.values(article.publicOpinionShift).reduce((sum, val) => sum + val, 0)
                : 0;

              return (
                <div
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
                  className={`p-6 hover:bg-gray-800 cursor-pointer transition-colors border-l-4 ${!article.isRead ? 'bg-gray-800/50' : ''}`}
                  style={{
                    borderLeftColor:
                      article.bias === 'pro-player'
                        ? '#4ade80'
                        : article.bias === 'anti-player'
                        ? '#ef4444'
                        : '#6b7280',
                  }}
                >
                  {/* Article Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                    <span className="font-semibold text-blue-400">{article.source}</span>
                    <span>•</span>
                    <span className={getBiasColor(article.bias)}>
                      {getBiasLabel(article.bias)}
                    </span>
                    <span>•</span>
                    <span>{formatGameTime(article.timestamp)}</span>
                    <span>•</span>
                    <span className="uppercase font-semibold text-gray-400">
                      {article.category}
                    </span>
                  </div>

                  {/* Headline */}
                  <h2 className="text-2xl font-bold text-white mb-2 hover:text-blue-400 transition-colors">
                    {article.headline}
                  </h2>

                  {/* Impact Indicators */}
                  <div className="flex items-center gap-4 text-sm">
                    {article.fameImpact !== undefined && article.fameImpact !== 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Fame:</span>
                        <span
                          className={`font-semibold ${
                            article.fameImpact > 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {article.fameImpact > 0 ? '+' : ''}
                          {article.fameImpact}
                        </span>
                      </div>
                    )}
                    {totalOpinionShift !== 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">Opinion:</span>
                        <span
                          className={`font-semibold ${
                            totalOpinionShift > 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                        >
                          {totalOpinionShift > 0 ? '+' : ''}
                          {totalOpinionShift}
                        </span>
                      </div>
                    )}
                    {article.missionOpportunity && (
                      <div className="flex items-center gap-1 text-yellow-400">
                        🎯 Mission Available
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>}

      {/* PUBLIC OPINION SIDEBAR - Show for all sections */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Public Opinion by Country</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(publicOpinion).length === 0 ? (
            <div className="col-span-full text-center text-gray-500 text-sm">
              No public opinion data yet
            </div>
          ) : (
            Object.entries(publicOpinion).map(([country, opinion]) => (
              <div
                key={country}
                className="bg-gray-700 rounded p-2 border border-gray-600"
              >
                <div className="text-xs text-gray-400 mb-1">{country}</div>
                <div className={`text-lg font-bold ${getOpinionColor(opinion)}`}>
                  {opinion > 0 ? '+' : ''}
                  {opinion}
                </div>
                <div className="text-xs text-gray-500">{getOpinionLabel(opinion)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
