import type { Kysely } from 'kysely';
import type { Database } from '@tt-players/db';

interface ReconcileLogger {
    info: (msg: string) => void;
}

export interface ReconcilePlayersResult {
    linkedGroups: number;
    remappedRubbers: number;
}

interface ExternalPlayerRow {
    id: string;
    platform_id: string;
    external_id: string | null;
    canonical_player_id: string | null;
    name: string;
}

interface PlayerLink {
    aliasId: string;
    canonicalId: string;
}

function normalizePlayerName(name: string): string {
    return name.replace(/\s+/g, ' ').trim().toLowerCase();
}

function chooseCanonicalId(group: ExternalPlayerRow[]): string | null {
    const playerIds = new Set(group.map((p) => p.id));
    const existingCanonical = group.find(
        (p) => p.canonical_player_id != null && playerIds.has(p.canonical_player_id),
    );

    if (existingCanonical?.canonical_player_id) {
        return existingCanonical.canonical_player_id;
    }

    return group.map((p) => p.id).sort()[0] ?? null;
}

/**
 * Auto-link cross-platform players when the match is high-confidence:
 * - exact normalized name match
 * - exactly two rows with that name
 * - rows belong to different platforms
 * - both rows have external IDs
 * - name looks like a full name (contains whitespace)
 */
export async function reconcilePlayersByName(
    db: Kysely<Database>,
    logger?: ReconcileLogger,
): Promise<ReconcilePlayersResult> {
    const players = await db
        .selectFrom('external_players')
        .select(['id', 'platform_id', 'external_id', 'canonical_player_id', 'name'])
        .where('deleted_at', 'is', null)
        .execute() as ExternalPlayerRow[];

    const byNormalizedName = new Map<string, ExternalPlayerRow[]>();
    for (const player of players) {
        const normalized = normalizePlayerName(player.name);
        if (!normalized || !normalized.includes(' ')) continue;
        if (!player.external_id) continue;

        const bucket = byNormalizedName.get(normalized) ?? [];
        bucket.push(player);
        byNormalizedName.set(normalized, bucket);
    }

    const links: PlayerLink[] = [];
    let linkedGroups = 0;

    for (const group of byNormalizedName.values()) {
        if (group.length !== 2) continue;

        const platformCount = new Set(group.map((p) => p.platform_id)).size;
        if (platformCount !== 2) continue;

        const canonicalId = chooseCanonicalId(group);
        if (!canonicalId) continue;

        const aliases = group.filter((p) => p.id !== canonicalId);
        if (aliases.length === 0) continue;

        linkedGroups++;
        for (const alias of aliases) {
            links.push({
                aliasId: alias.id,
                canonicalId,
            });
        }

        // Keep the canonical row self-referential for easier lookups.
        await db
            .updateTable('external_players')
            .set({ canonical_player_id: canonicalId })
            .where('id', '=', canonicalId)
            .execute();

        // Point all members of the linked group to the same canonical ID.
        await db
            .updateTable('external_players')
            .set({ canonical_player_id: canonicalId })
            .where('id', 'in', group.map((p) => p.id))
            .execute();
    }

    if (links.length === 0) {
        return {
            linkedGroups: 0,
            remappedRubbers: 0,
        };
    }

    let remappedRubbers = 0;
    for (const link of links) {
        const [home1, home2, away1, away2] = await Promise.all([
            db
                .updateTable('rubbers')
                .set({ home_player_1_id: link.canonicalId })
                .where('home_player_1_id', '=', link.aliasId)
                .executeTakeFirst(),
            db
                .updateTable('rubbers')
                .set({ home_player_2_id: link.canonicalId })
                .where('home_player_2_id', '=', link.aliasId)
                .executeTakeFirst(),
            db
                .updateTable('rubbers')
                .set({ away_player_1_id: link.canonicalId })
                .where('away_player_1_id', '=', link.aliasId)
                .executeTakeFirst(),
            db
                .updateTable('rubbers')
                .set({ away_player_2_id: link.canonicalId })
                .where('away_player_2_id', '=', link.aliasId)
                .executeTakeFirst(),
        ]);

        remappedRubbers += Number(home1.numUpdatedRows)
            + Number(home2.numUpdatedRows)
            + Number(away1.numUpdatedRows)
            + Number(away2.numUpdatedRows);
    }

    // Hide alias rows so they don't show up as duplicate players in API responses.
    await db
        .updateTable('external_players')
        .set({ deleted_at: new Date() })
        .where('id', 'in', links.map((l) => l.aliasId))
        .where('deleted_at', 'is', null)
        .execute();

    logger?.info(
        `reconcilePlayersByName: linked ${linkedGroups} groups, remapped ${remappedRubbers} rubber player refs`,
    );

    return {
        linkedGroups,
        remappedRubbers,
    };
}
