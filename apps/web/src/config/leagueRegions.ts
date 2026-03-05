import type { LeagueWithDivisions } from '../types';

export interface LeagueRegion {
    id: string;
    label: string;
    keywords: string[];
}

const REGION_DEFINITIONS: LeagueRegion[] = [
    {
        id: 'essex',
        label: 'Essex',
        keywords: [
            'essex',
            'basildon',
            'brentwood',
            'chelmsford',
            'colchester',
            'southend',
            'canvey',
            'thurrock',
            'burnham',
            'maldon',
            'braintree',
            'harlow',
        ],
    },
    {
        id: 'london',
        label: 'London',
        keywords: ['london'],
    },
    {
        id: 'kent',
        label: 'Kent',
        keywords: ['kent', 'maidstone', 'medway'],
    },
    {
        id: 'suffolk',
        label: 'Suffolk',
        keywords: ['suffolk', 'ipswich'],
    },
    {
        id: 'hertfordshire',
        label: 'Hertfordshire',
        keywords: ['hertfordshire', 'watford', 'st albans'],
    },
];

export interface RegionBucket {
    id: string;
    label: string;
    leagueIds: string[];
}

function inferRegionIds(leagueName: string): string[] {
    const normalized = leagueName.toLowerCase();
    const regionIds = REGION_DEFINITIONS
        .filter((region) => region.keywords.some((keyword) => normalized.includes(keyword)))
        .map((region) => region.id);
    return regionIds.length > 0 ? regionIds : ['other'];
}

export function leagueRegionLabels(leagueName: string): string[] {
    const ids = inferRegionIds(leagueName);
    return ids.map((id) => REGION_DEFINITIONS.find((region) => region.id === id)?.label ?? 'Other');
}

export function buildRegionBuckets(leagues: LeagueWithDivisions[]): RegionBucket[] {
    const bucketMap = new Map<string, RegionBucket>();

    for (const league of leagues) {
        for (const regionId of inferRegionIds(league.name)) {
            const label = REGION_DEFINITIONS.find((region) => region.id === regionId)?.label ?? 'Other';
            const existing = bucketMap.get(regionId);
            if (existing) {
                existing.leagueIds.push(league.id);
            } else {
                bucketMap.set(regionId, {
                    id: regionId,
                    label,
                    leagueIds: [league.id],
                });
            }
        }
    }

    return Array.from(bucketMap.values())
        .map((bucket) => ({
            ...bucket,
            leagueIds: Array.from(new Set(bucket.leagueIds)),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}
