import { describe, expect, it } from 'vitest';
import { __internal } from '../bootstrap.js';

describe('bootstrap discovery helpers', () => {
    it('extracts unique TT365 archive seasons from categories links', () => {
        const html = `
            <html><body>
                <a href="/Brentwood/Results/Categories/Winter_2024">Winter 2024</a>
                <a href="/Brentwood/Results/Categories/Winter_2023-24">Winter 2023-24</a>
                <a href="/Brentwood/Results/Categories/Winter_2024">Winter 2024 duplicate</a>
                <a href="/Other/Results/Categories/Winter_2022">Other league</a>
            </body></html>
        `;

        const seasons = __internal.parseTT365ArchiveSeasons(
            html,
            'https://www.tabletennis365.com/Brentwood',
        );

        expect(seasons).toEqual([
            { seasonToken: 'Winter_2024', seasonName: 'Winter 2024' },
            { seasonToken: 'Winter_2023-24', seasonName: 'Winter 2023-24' },
        ]);
    });

    it('extracts TT365 division links for a season and excludes All Divisions', () => {
        const html = `
            <html><body>
                <a href="/Brentwood/Fixtures/Winter_2024/Premier_Division">Premier Division</a>
                <a href="/Brentwood/Fixtures/Winter_2024/Division_1">Division 1</a>
                <a href="/Brentwood/Fixtures/Winter_2024/All_Divisions">All Divisions</a>
                <a href="/Brentwood/Fixtures/Winter_2023/Premier_Division">Wrong season</a>
            </body></html>
        `;

        const divisions = __internal.parseTT365DivisionIndex(
            html,
            'https://www.tabletennis365.com/Brentwood',
            'Winter_2024',
            'fixtures',
        );

        expect(divisions).toEqual([
            { slug: 'Premier_Division', name: 'Premier Division' },
            { slug: 'Division_1', name: 'Division 1' },
        ]);
    });

    it('normalizes season external ids for deterministic storage keys', () => {
        expect(__internal.normalizeExternalId(' Winter_2023-24 ')).toBe('winter_2023-24');
        expect(__internal.normalizeExternalId('Winter 2023/24')).toBe('winter-2023/24');
    });
});
