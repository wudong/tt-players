import type { LeagueWithDivisions } from '../types';

export interface RegionBucket {
    id: string;
    label: string;
    leagueIds: string[];
}

export function leagueRegionLabels(league: LeagueWithDivisions): string[] {
    return league.regions
        .map((region) => region.name.trim())
        .filter((name) => name.length > 0);
}

export function buildRegionBuckets(leagues: LeagueWithDivisions[]): RegionBucket[] {
    const bucketMap = new Map<string, RegionBucket>();

    for (const league of leagues) {
        for (const region of league.regions) {
            const existing = bucketMap.get(region.id);
            if (existing) {
                existing.leagueIds.push(league.id);
                continue;
            }

            bucketMap.set(region.id, {
                id: region.id,
                label: region.name,
                leagueIds: [league.id],
            });
        }
    }

    return Array.from(bucketMap.values())
        .map((bucket) => ({
            ...bucket,
            leagueIds: Array.from(new Set(bucket.leagueIds)),
        }))
        .sort((a, b) => a.label.localeCompare(b.label));
}
