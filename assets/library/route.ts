import { NextResponse } from "next/server";
import { STATIC_VOA_EPISODES } from "./static-episodes";

type FeedDefinition = {
  collection: string;
  articleFeed: string;
  podcastFeed: string;
  level: string;
};

type ZoneDefinition = {
  collection: string;
  zoneId: number;
  level: string;
};

type RawItem = {
  title: string;
  link: string;
  summary: string;
  publishedAt: string;
  duration: number;
  mediaUrl: string;
  mediaType: string;
};

const FEEDS: FeedDefinition[] = [
  {
    collection: "Everyday Grammar",
    articleFeed:
      "https://learningenglish.voanews.com/api/zoroqql-vomx-tpeptpqq",
    podcastFeed:
      "https://learningenglish.voanews.com/podcast/?zoneId=4456",
    level: "Upper beginner",
  },
];

const VOA_ZONES: ZoneDefinition[] = [
  {
    collection: "Science & Technology",
    zoneId: 1579,
    level: "Intermediate",
  },
  {
    collection: "Arts & Culture",
    zoneId: 986,
    level: "Intermediate",
  },
  {
    collection: "Words and Their Stories",
    zoneId: 987,
    level: "Upper beginner",
  },
  {
    collection: "Education Tips",
    zoneId: 7468,
    level: "Intermediate",
  },
  {
    collection: "American Stories",
    zoneId: 1581,
    level: "Intermediate",
  },
];

const NASA_FEED = "https://www.nasa.gov/feeds/podcasts/curious-universe";
const STUDY_EXCERPT_SECONDS = 180;
const FEED_FETCH_LIMIT = 5;
const FEED_EPISODE_LIMIT = 4;
const ZONE_FETCH_LIMIT = 5;
const ZONE_EPISODE_LIMIT = 3;
const NASA_FETCH_LIMIT = 5;

const NASA_SHORT: {
  id: string;
  provider: string;
  collection: string;
  title: string;
  summary: string;
  sourceUrl: string;
  mediaUrl: string;
  mediaType: string;
  publishedAt: string;
  duration: number;
  originalDuration: number;
  level: string;
  accent: string;
  rights: string;
  transcript: string[];
} = {
  id: "nasa-curious-universe-intro",
  provider: "NASA",
  collection: "NASA · Curious Universe",
  title: "Introducing NASA’s Curious Universe",
  summary:
    "A fast, vivid tour through space science, engineering, exploration, and the sense of awe behind NASA’s work.",
  sourceUrl:
    "https://www.nasa.gov/podcasts/curious-universe/introducing-nasas-curious-universe/",
  mediaUrl:
    "https://www.nasa.gov/wp-content/uploads/2020/03/introducingnasascuriousuniverseteaser.mp3",
  mediaType: "audio/mpeg",
  publishedAt: "2020-03-31T00:00:00.000Z",
  duration: 100,
  originalDuration: 100,
  level: "Advanced",
  accent: "American English",
  rights: "Official NASA audio and transcript · NASA media-use guidance reviewed",
  transcript: [
    "This is really what you get into science for.",
    "It’s for moments like this.",
    "You’re ready, your team is ready.",
    "And these things happen at random moments.",
    "So you have to be ready when opportunity knocks.",
    "Everything we see has been surprising.",
    "Just the sheer amount of structure in the solar wind, the fact that when we first saw the magnetic field data, that the first worry was, oh no, is the instrument malfunctioning.",
    "Hello Houston, we are inspired.",
    "We are ready.",
    "Let’s go fix this thing.",
    "Sounds like a good plan, Endeavour.",
    "Good morning.",
    "It’s changed everything we know about the universe, the planets, the solar system, the way stars live, die, the most distant galaxies.",
    "This is one of the grand adventures of NASA.",
    "Sometimes the blanket person, we might be the last ones to touch the spacecraft before it launches.",
    "It’s a real sense of awe, I think, that we find in the natural world and there are many different places you can find it.",
    "Being out there on your own in a spacesuit, looking back at the planet, you’re really in this self-contained life support system.",
    "Really your own little spaceship.",
    "Welcome to NASA’s Curious Universe.",
    "Our universe is a wild and wonderful place.",
    "And in this podcast, NASA is your tour guide.",
    "Subscribe right now and get ready for a grand adventure.",
  ],
};

const MONTHS =
  "January|February|March|April|May|June|July|August|September|October|November|December";

function decodeEntities(value: string) {
  const named: Record<string, string> = {
    amp: "&",
    apos: "'",
    quot: '"',
    lt: "<",
    gt: ">",
    nbsp: " ",
    ldquo: "“",
    rdquo: "”",
    lsquo: "‘",
    rsquo: "’",
  };
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (_, entity: string) => {
      if (entity.startsWith("#x")) {
        return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
      }
      if (entity.startsWith("#")) {
        return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
      }
      return named[entity.toLowerCase()] ?? `&${entity};`;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value: string) {
  return decodeEntities(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  ).replace(/\s+([,.;!?])/g, "$1");
}

function tagValue(block: string, tag: string) {
  const match = block.match(
    new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"),
  );
  return match ? stripTags(match[1]) : "";
}

function parseDuration(value: string) {
  const parts = value.split(":").map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? 0;
}

function parseItems(xml: string): RawItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => {
    const block = match[1];
    const enclosure = block.match(/<enclosure\s+([^>]+)>?/i)?.[1] ?? "";
    const mediaUrl = enclosure.match(/\burl="([^"]*)"/i)?.[1] ?? "";
    const mediaType = enclosure.match(/\btype="([^"]*)"/i)?.[1] ?? "";
    return {
      title: tagValue(block, "title"),
      link: tagValue(block, "link"),
      summary: tagValue(block, "description"),
      publishedAt: tagValue(block, "pubDate"),
      duration: parseDuration(tagValue(block, "itunes:duration")),
      mediaUrl: decodeEntities(mediaUrl),
      mediaType,
    };
  });
}

function normalizedTitle(value: string) {
  return value
    .replace(new RegExp(`\\s+-\\s+(?:${MONTHS})\\s+\\d{1,2},\\s+\\d{4}\\s*$`, "i"), "")
    .replace(/[’‘]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function absoluteVoaUrl(value: string) {
  try {
    return new URL(value, "https://learningenglish.voanews.com").toString();
  } catch {
    return "";
  }
}

function articlePreference(item: RawItem) {
  let score = 0;
  if (/\/a\/[^/]+\/\d+\.html(?:$|[?#])/i.test(item.link)) score += 8;
  if (item.summary) score += 4;
  if (!/\/a\/\d+\.html(?:$|[?#])/i.test(item.link)) score += 2;
  return score;
}

function groupArticlesByTitle(items: RawItem[]) {
  const groups = new Map<string, RawItem[]>();
  for (const item of items) {
    if (!item.link) continue;
    const key = normalizedTitle(item.title);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    group.sort((a, b) => articlePreference(b) - articlePreference(a));
  }
  return groups;
}

function parseZoneArticles(html: string): RawItem[] {
  const unique = new Map<string, RawItem>();
  const links = html.matchAll(/<a\s+([^>]*\bhref=(["'])([^"']+)\2[^>]*)>/gi);
  for (const match of links) {
    const attributes = match[1];
    const href = match[3];
    if (!/\/a\/[^/"']+\/\d+\.html(?:$|[?#])/i.test(href)) continue;
    const titleMatch = attributes.match(/\btitle=(["'])([\s\S]*?)\1/i);
    const title = titleMatch ? stripTags(titleMatch[2]) : "";
    const link = absoluteVoaUrl(href);
    if (!link || !title || unique.has(link)) continue;
    unique.set(link, {
      title,
      link,
      summary: "",
      publishedAt: "",
      duration: 0,
      mediaUrl: "",
      mediaType: "",
    });
  }
  return [...unique.values()];
}

function metaContent(html: string, name: string) {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const forward = html.match(
    new RegExp(
      `<meta\\s+[^>]*(?:name|property)=["']${escapedName}["'][^>]*content=["']([^"']*)["'][^>]*>`,
      "i",
    ),
  );
  if (forward) return decodeEntities(forward[1]);
  const reverse = html.match(
    new RegExp(
      `<meta\\s+[^>]*content=["']([^"']*)["'][^>]*(?:name|property)=["']${escapedName}["'][^>]*>`,
      "i",
    ),
  );
  return reverse ? decodeEntities(reverse[1]) : "";
}

function voaPageDetails(html: string) {
  const heading = html.match(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/i);
  const audio = html.match(/<audio\s+[^>]*\bsrc=(["'])([^"']+)\1/i);
  const duration = html.match(
    /class=(["'])[^"']*\bjs-duration\b[^"']*\1[^>]*>([\s\S]*?)<\/span>/i,
  );
  const audioTag = audio ? audio[0] : "";
  const publishedAt =
    audioTag.match(/\bdata-pub_datetime=(["'])([^"']+)\1/i)?.[2] ??
    metaContent(html, "article:published_time");
  return {
    title: heading ? stripTags(heading[1]) : "",
    summary: metaContent(html, "description"),
    mediaUrl: audio ? absoluteVoaUrl(decodeEntities(audio[2])) : "",
    duration: duration ? parseDuration(stripTags(duration[2])) : 0,
    publishedAt,
  };
}

function sentencesFromArticle(html: string) {
  const start = html.indexOf('<div class="wsw">');
  if (start < 0) return [];
  const wordsMarker = html.indexOf("Words in This Story", start);
  const end = wordsMarker > start ? wordsMarker : Math.min(html.length, start + 40000);
  const body = html.slice(start, end);
  if (/\b(?:Associated Press|Reuters|Agence France-Presse|AP Photo)\b/i.test(body)) {
    return [];
  }
  const paragraphs = [...body.matchAll(/<p>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(
      (text) =>
        text &&
        !/^_+$/.test(text) &&
        !/wrote this story|adapted it for|edited this story/i.test(text),
    );
  const sentences = paragraphs
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+(?=[A-Z“"'])/))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 2);

  const clipped: string[] = [];
  let words = 0;
  for (const sentence of sentences) {
    const nextWords = sentence.split(/\s+/).length;
    if (words + nextWords > 365) break;
    clipped.push(sentence);
    words += nextWords;
  }
  return clipped;
}

function sentencesFromNasaEpisode(html: string) {
  const start = html.indexOf("hds-podcast-content hds-entry-content");
  if (start < 0) return [];
  const body = html.slice(start, Math.min(html.length, start + 140000));
  const paragraphs = [...body.matchAll(/<p(?:\s[^>]*)?>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripTags(match[1]))
    .filter(Boolean);
  const firstSpeaker = paragraphs.findIndex(
    (text) =>
      /^\[Music/i.test(text) ||
      /^(?:HOST\s+)?[A-Z][A-Za-z .’'-]{1,45}:\s/.test(text),
  );
  if (firstSpeaker < 0) return [];
  const transcriptParagraphs = paragraphs
    .slice(firstSpeaker)
    .filter(
      (text) =>
        !/^\[(?:Music|Sound|Audio)/i.test(text) &&
        !/^For more information|^Page Last Updated/i.test(text),
    );
  const sentences = transcriptParagraphs
    .flatMap((paragraph) => paragraph.split(/(?<=[.!?])\s+(?=[A-Z“"'])/))
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 2);

  const clipped: string[] = [];
  let words = 0;
  for (const sentence of sentences) {
    const nextWords = sentence.split(/\s+/).length;
    if (words + nextWords > 325) break;
    clipped.push(sentence);
    words += nextWords;
  }
  return clipped;
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "LILT personal listening study prototype",
      Accept: "application/rss+xml,text/xml,text/html;q=0.9",
    },
    cf: { cacheTtl: 3600, cacheEverything: true },
  } as RequestInit & { cf: { cacheTtl: number; cacheEverything: boolean } });
  if (!response.ok) throw new Error(`Source request failed: ${response.status}`);
  return response.text();
}

async function loadCollection(feed: FeedDefinition) {
  const [articleXml, podcastXml] = await Promise.all([
    fetchText(feed.articleFeed),
    fetchText(feed.podcastFeed),
  ]);
  const articleItems = parseItems(articleXml);
  const podcastItems = parseItems(podcastXml).filter(
    (item) => item.mediaUrl && item.mediaType.startsWith("audio/"),
  );
  const articlesByTitle = groupArticlesByTitle(articleItems);

  const candidates = podcastItems
    .map((audio) => ({
      audio,
      article: articlesByTitle.get(normalizedTitle(audio.title))?.[0],
    }))
    .filter(
      (pair): pair is { audio: RawItem; article: RawItem } => Boolean(pair.article),
    )
    .slice(0, FEED_FETCH_LIMIT);

  const episodes = await Promise.all(
    candidates.map(async ({ audio, article }) => {
      const html = await fetchText(article.link);
      const transcript = sentencesFromArticle(html);
      if (transcript.length < 3) return null;
      const originalDuration = audio.duration || STUDY_EXCERPT_SECONDS;
      return {
        id: `voa-${article.link.match(/(\d+)\.html/)?.[1] ?? encodeURIComponent(audio.title)}`,
        provider: "VOA",
        collection: `VOA · ${feed.collection}`,
        title: audio.title.replace(
          new RegExp(`\\s+-\\s+(?:${MONTHS})\\s+\\d{1,2},\\s+\\d{4}\\s*$`, "i"),
          "",
        ),
        summary:
          article.summary ||
          `A focused VOA ${feed.collection.toLowerCase()} listening lesson.`,
        sourceUrl: article.link,
        mediaUrl: audio.mediaUrl,
        mediaType: audio.mediaType,
        publishedAt: article.publishedAt || audio.publishedAt,
        duration: Math.min(STUDY_EXCERPT_SECONDS, originalDuration),
        originalDuration,
        level: feed.level,
        accent: "American English",
        rights: "VOA-produced material · public-domain eligibility screened",
        transcript,
      };
    }),
  );
  return episodes.filter(Boolean).slice(0, FEED_EPISODE_LIMIT);
}

async function loadZone(zone: ZoneDefinition) {
  const zoneHtml = await fetchText(
    `https://learningenglish.voanews.com/z/${zone.zoneId}`,
  );
  const candidates = parseZoneArticles(zoneHtml).slice(0, ZONE_FETCH_LIMIT);
  const episodes = await Promise.all(
    candidates.map(async (candidate) => {
      const html = await fetchText(candidate.link);
      const transcript = sentencesFromArticle(html);
      const details = voaPageDetails(html);
      if (transcript.length < 3 || !details.mediaUrl) return null;
      const originalDuration =
        details.duration || STUDY_EXCERPT_SECONDS;
      const articleId =
        candidate.link.match(/(\d+)\.html/)?.[1] ??
        encodeURIComponent(candidate.title);
      return {
        id: `voa-${articleId}`,
        provider: "VOA",
        collection: `VOA · ${zone.collection}`,
        title: details.title || candidate.title,
        summary:
          details.summary ||
          `A focused VOA ${zone.collection.toLowerCase()} listening lesson.`,
        sourceUrl: candidate.link,
        mediaUrl: details.mediaUrl,
        mediaType: "audio/mpeg",
        publishedAt: details.publishedAt,
        duration: Math.min(STUDY_EXCERPT_SECONDS, originalDuration),
        originalDuration,
        level: zone.level,
        accent: "American English",
        rights: "VOA-produced material · public-domain eligibility screened",
        transcript,
      };
    }),
  );
  return episodes.filter(Boolean).slice(0, ZONE_EPISODE_LIMIT);
}

async function loadNasa() {
  const xml = await fetchText(NASA_FEED);
  const candidates = parseItems(xml)
    .filter(
      (item) =>
        item.link.includes("nasa.gov/podcasts/") &&
        item.mediaUrl &&
        item.mediaType.startsWith("audio/"),
    )
    .slice(0, NASA_FETCH_LIMIT);
  const episodes = await Promise.all(
    candidates.map(async (item) => {
      const html = await fetchText(item.link);
      const transcript = sentencesFromNasaEpisode(html);
      const pageAudio =
        html.match(
          /<a\s+[^>]*href="([^"]+)"[^>]*class="[^"]*hds-podcast-play-now-link[^"]*"/i,
        )?.[1] ?? item.mediaUrl;
      if (transcript.length < 4 || !pageAudio) return null;
      const originalDuration = item.duration || STUDY_EXCERPT_SECONDS;
      const slug =
        new URL(item.link).pathname.split("/").filter(Boolean).at(-1) ??
        encodeURIComponent(item.title);
      return {
        id: `nasa-${slug}`,
        provider: "NASA",
        collection: "NASA · Curious Universe",
        title: item.title.trim(),
        summary:
          item.summary ||
          "A current NASA story about science, engineering, and exploration.",
        sourceUrl: item.link,
        mediaUrl: decodeEntities(pageAudio),
        mediaType: "audio/mpeg",
        publishedAt: item.publishedAt,
        duration: Math.min(STUDY_EXCERPT_SECONDS, originalDuration),
        originalDuration,
        level: "Advanced",
        accent: "International English",
        rights: "Official NASA audio and transcript · NASA media-use guidance reviewed",
        transcript,
      };
    }),
  );
  return episodes.filter(Boolean);
}

export async function GET() {
  const [voaSettled, voaZoneSettled, nasaResult] = await Promise.all([
    Promise.allSettled(FEEDS.map(loadCollection)),
    Promise.allSettled(VOA_ZONES.map(loadZone)),
    loadNasa().catch(() => []),
  ]);
  const voaEpisodes = [...voaSettled, ...voaZoneSettled].flatMap(
    (result) => (result.status === "fulfilled" ? result.value : []),
  );
  const verifiedBaseline = STATIC_VOA_EPISODES.map((episode) => ({
    ...episode,
    transcript: [...episode.transcript],
  }));
  const uniqueEpisodes = new Map(
    [
      ...verifiedBaseline,
      NASA_SHORT,
      ...nasaResult,
      ...voaEpisodes,
    ].map((episode) => [episode.id, episode]),
  );
  const episodes = [...uniqueEpisodes.values()];
  return NextResponse.json(
    {
      episodes,
      syncedAt: new Date().toISOString(),
      source:
        "Verified VOA baseline plus daily rights-screened official feeds and pages from VOA Learning English and NASA",
      registry: [
        {
          provider: "VOA",
          status: "train",
          reason: "Official audio, matching transcript, and eligible VOA-produced material.",
        },
        {
          provider: "NASA",
          status: "train",
          reason: "Official audio, exact transcript, and NASA media-use guidance reviewed.",
        },
        {
          provider: "LibriVox",
          status: "review",
          reason: "Public-domain audio; sentence-level text alignment is still required.",
        },
        {
          provider: "BBC · TED · CNN · The Economist · British Council",
          status: "link",
          reason: "Official-link only until reuse, excerpting, and transcript rights are clear.",
        },
      ],
    },
    {
      headers: {
        "Cache-Control": "public, max-age=900, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
