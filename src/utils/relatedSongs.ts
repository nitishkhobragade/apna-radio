/**
 * Project: Apna Radio (अपना रेडियो - विंटेज ट्रांजिस्टर प्लेयर)
 * Concept, Design & Architecture: Nitish Khobragade
 * Copyright (c) 2026 Nitish Khobragade. All rights reserved.
 * GitHub: https://github.com/nitishkhobragade/apna-radio
 */

import { extractVideoId } from './youtube';
import { decodeHtmlEntities } from './youtubeRss';
import { searchYouTubeVideos, formatDurationSeconds } from './youtubeSearch';

export interface RecommendedSong {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  durationSeconds: number;
  language?: string;
  genre?: string;
}

export interface SongProfile {
  language: string;
  genre: string;
  cleanTitle: string;
  cleanArtist: string;
  searchQueries: string[];
}

/**
 * Normalize a song title into a core stem to avoid queueing multiple uploads/versions of the exact same song
 */
function normalizeSongStem(rawTitle: string): string {
  if (!rawTitle) return '';
  return rawTitle
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]|\{.*?\}/g, ' ')
    .replace(
      /\b(official|video|audio|full|song|lyrical|lyrics|hd|4k|original|female|male|version|reprise|cover|lofi|lo-fi|slowed|reverb|trending|instagram|viral|new|2024|2025|2026|punjabi|hindi|bhojpuri|haryanvi|marathi|tamil|telugu|status|shorts)\b/gi,
      ' '
    )
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if a candidate title is basically the same song as the currently playing track
 */
function isSameSongTitle(currentTitle: string, candidateTitle: string): boolean {
  const stemA = normalizeSongStem(currentTitle);
  const stemB = normalizeSongStem(candidateTitle);
  if (!stemA || !stemB) return false;
  if (stemA === stemB) return true;

  const wordsA = stemA.split(' ').filter((w) => w.length > 2);
  const wordsB = stemB.split(' ').filter((w) => w.length > 2);
  if (wordsA.length >= 2 && wordsB.length >= 2) {
    // Check first 2 distinctive words (e.g. "chalre chalre" or "lag ja")
    const prefixA = wordsA.slice(0, 2).join(' ');
    const prefixB = wordsB.slice(0, 2).join(' ');
    if (prefixA === prefixB) return true;

    // Or if >= 70% of words in shorter stem appear in the other
    const setA = new Set(wordsA);
    const overlap = wordsB.filter((w) => setA.has(w)).length;
    const minLen = Math.min(wordsA.length, wordsB.length);
    if (minLen >= 2 && overlap / minLen >= 0.7) {
      return true;
    }
  }
  return false;
}

/**
 * Fetch quick Apple Music / iTunes metadata (CORS: *, ~300ms) to enrich genre and artist detection
 */
async function fetchItunesTrackHint(
  cleanTitle: string,
  cleanArtist: string,
  signal?: AbortSignal
): Promise<{ artistName?: string; genre?: string } | null> {
  const term = `${cleanTitle} ${cleanArtist}`.trim().slice(0, 60);
  if (!term) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 1800);
  const onAbort = () => controller.abort();
  if (signal) signal.addEventListener('abort', onAbort, { once: true });

  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&limit=2`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const first = data?.results?.[0];
    if (!first) return null;
    return {
      artistName: first.artistName,
      genre: first.primaryGenreName,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

/**
 * Detect Language, Genre/Era, and build targeted search queries for the current song
 */
export function detectSongLanguageAndGenre(
  rawTitle = '',
  rawArtist = '',
  extraContext = '',
  itunesGenre = ''
): SongProfile {
  const combined = `${rawTitle} ${rawArtist} ${extraContext} ${itunesGenre}`.toLowerCase();

  // Clean up noisy channel suffixes from artist name
  const cleanArtist = rawArtist
    .replace(
      /\b(official|vevo|music|records|films|entertainment|studios|channel|audio|series|topic|hits|classic|classics)\b/gi,
      ''
    )
    .replace(/[^\p{L}\p{N}\s.&'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Clean up title for search context
  const cleanTitle = rawTitle
    .split(/\||-|–|—/)[0]
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. LANGUAGE DETECTION
  let language = 'Hindi';

  if (
    /[\u0A00-\u0A7F]/.test(combined) ||
    /\b(punjabi|saraiki|panjabi|jatt|gabru|mutiyaar|sohneya|mahiya|sanwal|kasturi|waal|chalre|chalray|sartaaj|satinder|sidhu moose|diljit|karan aujla|ap dhillon|shubh|gurdas|amrinder|qismat|baani sandhu|nimrat khaira|gurnam bhullar|ammy virk|harrdy sandhu|jass manak|bhangra|rokhri|sufi irfan|pasoori|coke studio pakistan|lokan do do yaar|udaarian)\b/i.test(
      combined
    )
  ) {
    language = 'Punjabi';
  } else if (
    /\b(bhojpuri|maithili|magahi|pawan singh|khesari|nirahua|kallu|shilpi raj|neelkamal|akshara singh|manoj tiwari|ravi kishan|bhojpuria|राजा जी|भोजपुरी)\b/i.test(
      combined
    )
  ) {
    language = 'Bhojpuri';
  } else if (
    /\b(haryanvi|sapna choudhary|masoom sharma|gulzaar chhaniwala|renuka panwar|khasaa aala|dhakad|प्रांजल दहिया|हरियाणवी)\b/i.test(
      combined
    )
  ) {
    language = 'Haryanvi';
  } else if (
    /\b(marathi|ajay atul|ajay-atul|adarsh shinde|avadhoot gupte|shreya ghoshal marathi|abhang|lavani|vitthal|zingaat|sairat|मराठी)\b/i.test(
      combined
    )
  ) {
    language = 'Marathi';
  } else if (
    /\b(chhattisgarhi|cg song|nagpuri|sambalpuri|khortha|odisha|odia|छत्तीसगढ़ी)\b/i.test(combined)
  ) {
    language = 'Chhattisgarhi / Regional';
  } else if (
    /[\u0A80-\u0AFF]/.test(combined) ||
    /\b(gujarati|rajasthani|marwadi|garba|dandiya|aditya gadhvi|kinjal dave|geeta rabari|kirtidan|mame khan|ghoomar|राजस्थानी|ગુજરાતી)\b/i.test(
      combined
    )
  ) {
    language = 'Gujarati / Rajasthani';
  } else if (
    /[\u0B80-\u0BFF]/.test(combined) ||
    /\b(tamil|kollywood|anirudh|ilayaraja|illaiyaraja|yuvan shankar|harris jayaraj|gv prakash|chinmayi|spb tamil)\b/i.test(
      combined
    )
  ) {
    language = 'Tamil';
  } else if (
    /[\u0C00-\u0C7F]/.test(combined) ||
    /\b(telugu|tollywood|devi sri prasad|dsp|thaman|allu arjun|mahesh babu|ram charan)\b/i.test(
      combined
    )
  ) {
    language = 'Telugu';
  } else if (
    /[\u0D00-\u0D7F]/.test(combined) ||
    /\b(malayalam|mollywood|sushin shyam|vineeth sreenivasan|yesudas malayalam)\b/i.test(combined)
  ) {
    language = 'Malayalam';
  } else if (
    /[\u0C80-\u0CFF]/.test(combined) ||
    /\b(kannada|sandalwood|sanjith hegde|vijay prakash kannada|rajkumar)\b/i.test(combined)
  ) {
    language = 'Kannada';
  } else if (
    /[\u0980-\u09FF]/.test(combined) ||
    /\b(bengali|bangla|rabindra sangeet|anupam roy|fossils|nachiketa)\b/i.test(combined)
  ) {
    language = 'Bengali';
  } else if (
    !/[\u0900-\u097F]/.test(combined) &&
    !/\b(hindi|bollywood|kumar|singh|sharma|mangeshkar|rafi|mukesh|sanu|narayan|yagnik|nigam|arijit|ghoshal|pritam|rahman|burman|t-series|yrf|zee|saregama|shemaroo|tips|pyar|dil|ishq|mohabbat|tum|tera|meri|kya|hai|mein|se|ko|ka|ki|ke|aur|bhi|ye|wo|zindagi|raat|chupke|geet|gaana|bhajan|ghazal|qawwali|sufi|desi)\b/i.test(
      combined
    ) &&
    /\b(pop|rock|country|r&b|hip-hop|alternative|dance|electronic|latin|billboard|vevo|feat|ft\.|taylor|ed sheeran|weeknd|drake|coldplay|eminem|justin|adele|bruno mars|alan walker|imagine dragons|linkin park|dua lipa|billie eilish|post malone|rihanna|shakira|selena)\b/i.test(
      combined
    )
  ) {
    language = 'English';
  }

  // 2. GENRE / ERA / MOOD DETECTION
  let genre = 'Trending & Melodies';

  if (
    /\b(bhajan|aarti|chalisa|mantra|stotra|devotional|bhakti|krishna|radhe|shyam|mohan|braj|ram|hanuman|shiva|mahadev|bholenath|mata|durga|khatu|भजन|आरती|भक्ति)\b/i.test(
      combined
    )
  ) {
    genre = 'Bhajan & Devotional';
  } else if (
    /\b(ghazal|ग़ज़ल|jagjit singh|pankaj udhas|mehdi hassan|ghulam ali|chitra singh|talat aziz|farida khanum|begum akhtar)\b/i.test(
      combined
    )
  ) {
    genre = 'Ghazal';
  } else if (
    /\b(sufi|qawwali|qawali|nusrat fateh|rahat fateh|kailash kher|abida parveen|sabri|wadali|kun faya|maula|khwaja|coke studio)\b/i.test(
      combined
    )
  ) {
    genre = 'Sufi & Qawwali';
  } else if (
    /\b(kishore kumar|mohammed rafi|lata mangeshkar|mukesh|asha bhosle|r\.?d\.? burman|s\.?d\.? burman|laxmikant|kalyanji|hemant kumar|manna dey|talat mahmood|geeta dutt|old hindi|retro|golden era|evergreen classic|195\d|196\d|197\d|198\d|70s|80s)\b/i.test(
      combined
    )
  ) {
    genre = 'Golden Retro Classics';
  } else if (
    /\b(kumar sanu|udit narayan|alka yagnik|abhijeet|kavita krishnamurthy|sonu nigam|sadabahar|nadeem shravan|anu malik|jatin lalit|himesh reshammiya|90s|2000s|bus driver|dhadkan|pardes|ashiqui|raaz)\b/i.test(
      combined
    )
  ) {
    genre = '90s & 2000s Evergreen';
  } else if (
    /\b(lofi|lo-fi|slowed|reverb|unplugged|acoustic|chillstep|chill|mashup|midnight)\b/i.test(
      combined
    )
  ) {
    genre = 'Lo-Fi & Acoustic';
  } else if (
    /\b(dj|remix|party|club|dance|rap|hip hop|hip-hop|badshah|honey singh|raftaar|divine|mc stan|kr\$na|emiway|bhangra|bass)\b/i.test(
      combined
    )
  ) {
    genre = 'Party & Upbeat';
  } else if (
    /\b(sad|dard|bewafa|judai|tadap|broken|heartbreak|emotional|rona|tanha|adhura)\b/i.test(combined)
  ) {
    genre = 'Sad & Emotional';
  } else if (
    /\b(folk|saraiki|lokgeet|traditional|cultural|pahadi|garba|lavani|chhattisgarhi|waal|kasturi|sanwal)\b/i.test(
      combined
    )
  ) {
    genre = 'Folk & Trending';
  } else if (
    /\b(romantic|love|pyar|ishq|mohabbat|arijit singh|shreya ghoshal|atif aslam|jubin nautiyal|kk|pritam|vishal mishra|darshan raval|arman malik)\b/i.test(
      combined
    )
  ) {
    genre = 'Romantic Melodies';
  }

  // 3. BUILD TARGETED SAME-LANGUAGE & SAME-GENRE SEARCH QUERIES
  const searchQueries: string[] = [];
  const hasGoodArtist = cleanArtist.length > 2 && !/^(youtube|various|unknown|music|isar)$/i.test(cleanArtist);

  if (language === 'Punjabi') {
    if (genre === 'Folk & Trending' || /chalre|waal|sanwal|kasturi|saraiki/i.test(combined)) {
      if (hasGoodArtist) searchQueries.push(`${cleanArtist} Punjabi Saraiki hit songs`);
      searchQueries.push('New Punjabi Saraiki Folk Trending Songs 2026');
      searchQueries.push('Best Punjabi Sufi Folk Love Songs Satinder Sartaaj');
    } else if (genre === 'Party & Upbeat') {
      if (hasGoodArtist) searchQueries.push(`${cleanArtist} Punjabi hit songs`);
      searchQueries.push('Top Punjabi Party Bhangra Hit Songs');
    } else if (genre === 'Sad & Emotional') {
      if (hasGoodArtist) searchQueries.push(`${cleanArtist} Punjabi sad songs`);
      searchQueries.push('Best Punjabi Sad Emotional Love Songs');
    } else {
      if (hasGoodArtist) searchQueries.push(`${cleanArtist} Punjabi hit songs`);
      searchQueries.push('Latest Punjabi Romantic Hit Songs');
    }
  } else if (language === 'Bhojpuri') {
    if (hasGoodArtist) searchQueries.push(`${cleanArtist} Bhojpuri hit songs`);
    searchQueries.push(`Superhit Bhojpuri ${genre === 'Bhajan & Devotional' ? 'Bhakti' : ''} Songs`);
  } else if (language === 'Haryanvi') {
    if (hasGoodArtist) searchQueries.push(`${cleanArtist} Haryanvi hit songs`);
    searchQueries.push('Top Haryanvi Trending Hit Songs');
  } else if (language === 'Marathi') {
    if (hasGoodArtist) searchQueries.push(`${cleanArtist} Marathi hit songs`);
    searchQueries.push('Best Marathi Evergreen Romantic Hit Songs');
  } else if (language === 'Gujarati / Rajasthani') {
    if (hasGoodArtist) searchQueries.push(`${cleanArtist} Gujarati Rajasthani folk songs`);
    searchQueries.push('Best Gujarati Rajasthani Folk Hit Songs');
  } else if (language === 'Chhattisgarhi / Regional') {
    if (hasGoodArtist) searchQueries.push(`${cleanArtist} CG regional hit songs`);
    searchQueries.push('Superhit Chhattisgarhi Nagpuri Regional Songs');
  } else if (['Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali'].includes(language)) {
    if (hasGoodArtist) searchQueries.push(`${cleanArtist} ${language} hit songs`);
    searchQueries.push(`Best ${language} Melody Hit Songs`);
  } else if (language === 'English') {
    if (hasGoodArtist) searchQueries.push(`${cleanArtist} top hit songs`);
    searchQueries.push(`Best English ${genre === 'Lo-Fi & Acoustic' ? 'Acoustic Chill' : 'Pop Hit'} Songs`);
  } else {
    // Hindi / Urdu Genre-Specific Queries
    switch (genre) {
      case 'Bhajan & Devotional':
        if (hasGoodArtist) searchQueries.push(`${cleanArtist} Hindi Bhajan`);
        searchQueries.push('Best Popular Hindi Krishna Ram Bhajan Devotional Songs');
        break;
      case 'Ghazal':
        if (hasGoodArtist) searchQueries.push(`${cleanArtist} Best Ghazals`);
        searchQueries.push('Evergreen Hindi Urdu Ghazals Jagjit Singh Pankaj Udhas');
        break;
      case 'Sufi & Qawwali':
        if (hasGoodArtist) searchQueries.push(`${cleanArtist} Sufi Songs`);
        searchQueries.push('Best Sufi Qawwali Hindi Urdu Songs Nusrat Rahat Kailash Kher');
        break;
      case 'Golden Retro Classics':
        if (hasGoodArtist) searchQueries.push(`${cleanArtist} Evergreen Old Hindi Songs`);
        searchQueries.push('Kishore Kumar Lata Mangeshkar Mohammed Rafi Old Hindi Classic Songs');
        break;
      case '90s & 2000s Evergreen':
        if (hasGoodArtist) searchQueries.push(`${cleanArtist} 90s Hindi Hit Songs`);
        searchQueries.push('90s Evergreen Bollywood Romantic Songs Kumar Sanu Alka Yagnik Udit Narayan');
        break;
      case 'Lo-Fi & Acoustic':
        if (hasGoodArtist) searchQueries.push(`${cleanArtist} Hindi Lofi Unplugged Songs`);
        searchQueries.push('Best Bollywood Hindi Lofi Chill Acoustic Songs');
        break;
      case 'Party & Upbeat':
        if (hasGoodArtist) searchQueries.push(`${cleanArtist} Bollywood Party Songs`);
        searchQueries.push('Top Bollywood Dance Party Hit Songs');
        break;
      case 'Sad & Emotional':
        if (hasGoodArtist) searchQueries.push(`${cleanArtist} Hindi Sad Songs`);
        searchQueries.push('Best Hindi Heartbreak Sad Emotional Songs');
        break;
      default:
        if (hasGoodArtist) searchQueries.push(`${cleanArtist} Best Hindi Songs`);
        searchQueries.push('Top Trending Hindi Romantic Melody Songs');
        break;
    }
  }

  return {
    language,
    genre,
    cleanTitle,
    cleanArtist,
    searchQueries,
  };
}

/**
 * Generate dynamic suggestion pills for the Search Modal based on the currently playing song's Language and Genre
 */
export function getSuggestedQueriesForSong(
  title?: string,
  artist?: string
): { language: string; genre: string; pills: string[] } {
  const profile = detectSongLanguageAndGenre(title || '', artist || '');
  const { language, genre, cleanArtist } = profile;

  const hasSpecificArtist =
    cleanArtist.length > 2 &&
    !/^(youtube|various|unknown|music|evergreen|playlist|tuxlips|romantic)$/i.test(cleanArtist);

  let basePills: string[] = [];

  if (language === 'Punjabi') {
    basePills = [
      'Trending Punjabi Songs 2026',
      'Punjabi Saraiki Folk Hits',
      'Satinder Sartaaj Hits',
      'Diljit Dosanjh Romantic',
      'AP Dhillon & Shubh Hits',
      'Karan Aujla Top Songs',
      'Coke Studio Punjabi Sufi',
      'Gurdas Maan Evergreen',
    ];
  } else if (language === 'Bhojpuri') {
    basePills = [
      'Pawan Singh Superhit Songs',
      'Khesari Lal Yadav Hits',
      'Trending Bhojpuri Songs',
      'Shilpi Raj New Songs',
      'Bhojpuri Romantic Geet',
      'Manoj Tiwari Classics',
    ];
  } else if (language === 'Haryanvi') {
    basePills = [
      'Masoom Sharma Hits',
      'Trending Haryanvi Songs',
      'Sapna Choudhary Hits',
      'Renuka Panwar Songs',
      'Gulzaar Chhaniwala Hits',
    ];
  } else if (language === 'Marathi') {
    basePills = [
      'Ajay-Atul Marathi Hits',
      'Marathi Romantic Melodies',
      'Adarsh Shinde Hits',
      'Evergreen Marathi Songs',
      'Avadhoot Gupte Songs',
    ];
  } else if (language === 'Gujarati / Rajasthani') {
    basePills = [
      'Aditya Gadhvi Gujarati Hits',
      'Rajasthani Folk Hit Songs',
      'Kinjal Dave & Geeta Rabari',
      'Garba & Folk Classics',
    ];
  } else if (language === 'Chhattisgarhi / Regional') {
    basePills = [
      'Superhit Chhattisgarhi Songs',
      'Trending CG Romantic Geet',
      'Nagpuri & Sambalpuri Hits',
    ];
  } else if (['Tamil', 'Telugu', 'Malayalam', 'Kannada', 'Bengali'].includes(language)) {
    basePills = [
      `Top ${language} Melody Songs`,
      `${language} Evergreen Classics`,
      `${language} Romantic Hits`,
      `Latest ${language} Trending Songs`,
    ];
  } else if (language === 'English') {
    basePills = [
      'Top English Pop Hits',
      '80s & 90s English Classics',
      'English Acoustic Chill',
      'Classic Rock Anthems',
      'Trending Global Hits',
    ];
  } else {
    // Hindi / Urdu by Genre
    switch (genre) {
      case 'Bhajan & Devotional':
        basePills = [
          'Krishna Bhajan Hits',
          'Shri Ram Bhajan Melodies',
          'Mahadev Bhakti Songs',
          'Khatu Shyam Bhajan',
          'Morning Aarti & Chalisa',
        ];
        break;
      case 'Ghazal':
        basePills = [
          'Jagjit Singh Ghazals',
          'Pankaj Udhas Evergreen',
          'Mehdi Hassan Classics',
          'Ghulam Ali Best Ghazals',
          'Chitra Singh Ghazals',
        ];
        break;
      case 'Sufi & Qawwali':
        basePills = [
          'Nusrat Fateh Ali Khan',
          'Rahat Fateh Ali Khan Sufi',
          'Kailash Kher Sufi Hits',
          'Coke Studio Sufi Classics',
          'Kun Faya Kun & Sufi Melodies',
        ];
        break;
      case '90s & 2000s Evergreen':
        basePills = [
          'Kumar Sanu 90s Hits',
          'Udit Narayan & Alka Yagnik',
          'Sonu Nigam Evergreen',
          '90s Bollywood Romantic',
          'KK Golden Melodies',
          'Nadeem Shravan Classics',
          'Indian Bus Driver 90s Hits',
        ];
        break;
      case 'Golden Retro Classics':
        basePills = [
          'Kishore Kumar Hits',
          'Lata Mangeshkar Romantic',
          'Mohammed Rafi Evergreen',
          'Mukesh Dard Bhare Geet',
          'R.D. Burman Classics',
          'Asha Bhosle Golden Hits',
        ];
        break;
      case 'Lo-Fi & Acoustic':
        basePills = [
          'Bollywood Lofi Chill',
          'Arijit Singh Acoustic',
          '90s Hindi Lofi Slowed',
          'Late Night Hindi Unplugged',
          'Retro Bollywood Lofi',
        ];
        break;
      case 'Sad & Emotional':
        basePills = [
          'Hindi Dard Bhare Geet',
          'Arijit Singh Sad Songs',
          '90s Heartbreak Hindi Songs',
          'Jubin Nautiyal Emotional',
          'Mukesh & Rafi Sad Classics',
        ];
        break;
      default:
        basePills = [
          'Arijit Singh Romantic Hits',
          'Shreya Ghoshal Melodies',
          '90s Bollywood Golden Melodies',
          'Kishore Kumar Hits',
          'Atif Aslam & KK Hits',
          'Mohammed Rafi Evergreen',
          'Jagjit Singh Ghazals',
        ];
        break;
    }
  }

  if (hasSpecificArtist && cleanArtist.length <= 24) {
    const artistPill = `${cleanArtist} Hits`;
    if (!basePills.some((p) => p.toLowerCase().includes(cleanArtist.toLowerCase()))) {
      basePills = [artistPill, ...basePills];
    }
  }

  return {
    language,
    genre,
    pills: basePills.slice(0, 8),
  };
}

/**
 * Fetch native related streams from Piped API (CORS: *)
 */
async function fetchPipedRelatedStreams(
  videoId: string,
  signal?: AbortSignal
): Promise<{ related: RecommendedSong[]; extraContext: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3800);
  const onAbort = () => controller.abort();
  if (signal) signal.addEventListener('abort', onAbort, { once: true });

  try {
    const resp = await fetch(`https://api.piped.private.coffee/streams/${encodeURIComponent(videoId)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    const extraContext = `${data.title || ''} ${data.uploaderName || ''} ${data.category || ''} ${data.shortDescription || ''}`;
    const recList: any[] = Array.isArray(data.relatedStreams) ? data.relatedStreams : [];

    const related: RecommendedSong[] = [];
    const seen = new Set<string>([videoId]);

    for (const item of recList) {
      if (!item || item.type === 'channel' || item.type === 'playlist' || item.isShort === true) {
        continue;
      }
      const vidId = extractVideoId(item.url || item.videoId || '') || '';
      if (vidId.length !== 11 || seen.has(vidId)) continue;

      const rawDur = typeof item.duration === 'number' ? item.duration : 0;
      if (rawDur > 0 && rawDur < 60) continue; // skip shorts

      const rawTitle = decodeHtmlEntities(String(item.title || ''));
      if (!rawTitle || /#shorts|#viralshorts|#viral\b/i.test(rawTitle)) continue;

      seen.add(vidId);
      const sec = rawDur > 0 ? rawDur : 235;
      const author = decodeHtmlEntities(
        String(item.uploaderName || item.author || 'YouTube Music').replace(/\s*-\s*Topic$/i, '').trim()
      );

      related.push({
        videoId: vidId,
        title: rawTitle,
        author,
        thumbnail: `https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`,
        duration: formatDurationSeconds(sec),
        durationSeconds: sec,
      });
    }

    return { related, extraContext };
  } finally {
    clearTimeout(timeoutId);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

/**
 * Fetch dynamic related songs based on an active YouTube video ID and track metadata.
 * Ensures suggested songs strictly match the current song's Language, Genre, Mood & Era.
 */
export async function fetchRelatedSongs(
  videoId: string,
  title?: string,
  artist?: string,
  signal?: AbortSignal
): Promise<RecommendedSong[]> {
  if (!videoId) return [];

  // Run Piped native relatedStreams and Apple iTunes genre lookup in parallel
  const [pipedOutcome, itunesHint] = await Promise.all([
    fetchPipedRelatedStreams(videoId, signal).catch(() => ({ related: [] as RecommendedSong[], extraContext: '' })),
    fetchItunesTrackHint(title || '', artist || '', signal).catch(() => null),
  ]);

  const effectiveArtist = itunesHint?.artistName || artist || '';
  const profile = detectSongLanguageAndGenre(
    title || '',
    effectiveArtist,
    pipedOutcome.extraContext,
    itunesHint?.genre || ''
  );

  // Filter native related streams so they:
  // 1) Are not duplicate uploads of the exact same song
  // 2) Match the current song's language & genre (filtering out unrelated bhajans if current song isn't a bhajan)
  const filteredNative: RecommendedSong[] = [];
  for (const item of pipedOutcome.related) {
    if (title && isSameSongTitle(title, item.title)) {
      continue;
    }
    // If current song is NOT devotional, filter out accidental devotional matches
    if (
      profile.genre !== 'Bhajan & Devotional' &&
      /\b(bhajan|aarti|chalisa|krishna bhajan|braj mein aayo|khatu shyam)\b/i.test(item.title)
    ) {
      continue;
    }
    filteredNative.push({
      ...item,
      language: profile.language,
      genre: profile.genre,
    });
  }

  // Also fetch targeted Same-Language & Same-Genre tracks via searchYouTubeVideos (preferring YouTube Music songs)
  let genreSearchResults: RecommendedSong[] = [];
  for (const q of profile.searchQueries) {
    try {
      const found = await searchYouTubeVideos(q, signal, true);
      const valid = found
        .filter((s) => s.videoId !== videoId && (!title || !isSameSongTitle(title, s.title)))
        .map((s) => ({
          videoId: s.videoId,
          title: s.title,
          author: s.author,
          thumbnail: s.thumbnail,
          duration: s.duration,
          durationSeconds: s.durationSeconds,
          language: profile.language,
          genre: profile.genre,
        }));
      genreSearchResults = [...genreSearchResults, ...valid];
      if (genreSearchResults.length >= 10) break;
    } catch {
      // continue to next query
    }
  }

  // Merge & deduplicate by both videoId AND normalized song title stem
  // Interleave targeted language/genre tracks with verified native related streams for top quality
  const merged: RecommendedSong[] = [];
  const seenIds = new Set<string>([videoId]);
  const seenStems = new Set<string>();
  if (title) {
    const currentStem = normalizeSongStem(title);
    if (currentStem) seenStems.add(currentStem);
  }

  const addCandidate = (cand: RecommendedSong) => {
    if (!cand || seenIds.has(cand.videoId)) return;
    if (title && isSameSongTitle(title, cand.title)) return;
    const stem = normalizeSongStem(cand.title);
    if (stem && stem.length > 3 && seenStems.has(stem)) return;

    seenIds.add(cand.videoId);
    if (stem && stem.length > 3) seenStems.add(stem);
    merged.push({
      ...cand,
      language: cand.language || profile.language,
      genre: cand.genre || profile.genre,
    });
  };

  // Interleave genre-matched search results and native related tracks
  const maxLen = Math.max(genreSearchResults.length, filteredNative.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < filteredNative.length) addCandidate(filteredNative[i]);
    if (i < genreSearchResults.length) addCandidate(genreSearchResults[i]);
    if (merged.length >= 14) break;
  }

  return merged;
}
