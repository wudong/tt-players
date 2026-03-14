import { useMemo, useState } from 'react';
import type { LeagueWithDivisions } from './player-shared';

type RegionBucket = {
  id: string;
  label: string;
  leagueIds: string[];
};

interface LeagueSelectionPageProps {
  allLeagues: LeagueWithDivisions[];
  isAllLeagueScope: boolean;
  isLeagueSelectionReady: boolean;
  isLeaguesLoading: boolean;
  leaguesError: string | null;
  selectedLeagueIds: string[];
  onAddLeague: (leagueId: string) => void;
  onClose: () => void;
  maxSelectedLeagues: number;
  onRemoveLeague: (leagueId: string) => void;
  onSelectRegion: (leagueIds: string[]) => void;
}

function leagueRegionLabels(league: LeagueWithDivisions): string[] {
  return (league.regions ?? [])
    .map((region) => region.name.trim())
    .filter((name) => name.length > 0);
}

function buildRegionBuckets(leagues: LeagueWithDivisions[]): RegionBucket[] {
  const buckets = new Map<string, { id: string; label: string; leagueIds: Set<string> }>();

  for (const league of leagues) {
    for (const region of league.regions ?? []) {
      const label = region.name.trim();
      if (!label) continue;

      const key = region.id?.trim() || region.slug?.trim() || label.toLowerCase();
      const existing = buckets.get(key);

      if (existing) {
        existing.leagueIds.add(league.id);
        continue;
      }

      buckets.set(key, {
        id: key,
        label,
        leagueIds: new Set([league.id]),
      });
    }
  }

  return Array.from(buckets.values())
    .map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      leagueIds: Array.from(bucket.leagueIds),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function LeagueSelectionPage({
  allLeagues,
  isAllLeagueScope,
  isLeagueSelectionReady,
  isLeaguesLoading,
  leaguesError,
  selectedLeagueIds,
  onAddLeague,
  onClose,
  maxSelectedLeagues,
  onRemoveLeague,
  onSelectRegion,
}: LeagueSelectionPageProps) {
  const [query, setQuery] = useState('');

  const orderedLeagues = useMemo(
    () => [...allLeagues].sort((a, b) => a.name.localeCompare(b.name)),
    [allLeagues],
  );

  const allLeagueIdSet = useMemo(() => new Set(orderedLeagues.map((league) => league.id)), [orderedLeagues]);
  const normalizedQuery = query.trim().toLowerCase();
  const regionBuckets = useMemo(() => buildRegionBuckets(orderedLeagues), [orderedLeagues]);
  const selectedLeagueIdSet = useMemo(() => {
    if (isAllLeagueScope) {
      return new Set(orderedLeagues.map((league) => league.id));
    }

    return new Set(selectedLeagueIds.filter((leagueId) => allLeagueIdSet.has(leagueId)));
  }, [allLeagueIdSet, isAllLeagueScope, orderedLeagues, selectedLeagueIds]);

  const selectedLeagues = useMemo(
    () => orderedLeagues.filter((league) => selectedLeagueIdSet.has(league.id)),
    [orderedLeagues, selectedLeagueIdSet],
  );

  const leaguesById = useMemo(
    () => new Map(orderedLeagues.map((league) => [league.id, league])),
    [orderedLeagues],
  );

  const filteredRegions = useMemo(() => {
    if (!normalizedQuery) return regionBuckets;

    return regionBuckets.filter((region) => {
      if (region.label.toLowerCase().includes(normalizedQuery)) return true;

      return region.leagueIds.some((leagueId) => {
        const league = leaguesById.get(leagueId);
        return Boolean(league?.name.toLowerCase().includes(normalizedQuery));
      });
    });
  }, [leaguesById, normalizedQuery, regionBuckets]);

  const filteredLeagues = useMemo(() => {
    if (!normalizedQuery) return orderedLeagues;

    return orderedLeagues.filter((league) => {
      const matchesLeague = league.name.toLowerCase().includes(normalizedQuery);
      if (matchesLeague) return true;

      return leagueRegionLabels(league)
        .some((label) => label.toLowerCase().includes(normalizedQuery));
    });
  }, [normalizedQuery, orderedLeagues]);

  const isLoading = !isLeagueSelectionReady || isLeaguesLoading;
  const hasNoSearchMatches = normalizedQuery.length > 0
    && filteredRegions.length === 0
    && filteredLeagues.length === 0;
  const isAtSelectionLimit = selectedLeagueIdSet.size >= maxSelectedLeagues;

  return (
    <section className="tt-league-selector-page">
      <div className="content mt-2 mb-2">
        <div className="tt-league-selector-topbar">
          <button
            type="button"
            className="tt-league-selector-close"
            onClick={onClose}
            aria-label="Close league selector"
          >
            <i className="fa fa-times" />
          </button>
        </div>

        <div className="tt-league-selector-toolbar mb-2">
          <p className="font-11 opacity-70 mb-0">
            {selectedLeagueIdSet.size} of {orderedLeagues.length} selected
          </p>
        </div>
        {isAtSelectionLimit ? (
          <p className="tt-league-selector-limit-note mb-2">Maximum {maxSelectedLeagues} leagues can be selected.</p>
        ) : null}

        {selectedLeagues.length > 0 && selectedLeagueIdSet.size < orderedLeagues.length ? (
          <div className="mb-3">
            <p className="tt-league-selector-section-title mb-2">Selected leagues</p>
            <div className="tt-selected-league-pills">
              {selectedLeagues.map((league) => (
                <button
                  key={league.id}
                  type="button"
                  className="tt-selected-league-pill"
                  onClick={() => onRemoveLeague(league.id)}
                >
                  <span>{league.name}</span>
                  <i className="fa fa-times" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        ) : selectedLeagueIdSet.size === orderedLeagues.length && orderedLeagues.length > 0 ? (
          <p className="tt-league-selector-hint mb-3">All leagues are currently selected. Remove leagues below to narrow scope.</p>
        ) : null}

        <div className="search-box search-dark shadow-xs border-0 bg-theme rounded-sm mb-2">
          <i className="fa fa-search ms-1" />
          <input
            type="text"
            className="border-0"
            placeholder="Search leagues or regions..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="tt-league-selector-results">
          {isLoading ? (
            <p className="mb-0"><i className="fa fa-spinner fa-spin me-2" />Loading leagues...</p>
          ) : leaguesError ? (
            <p className="mb-0 color-red-dark">Failed to load leagues: {leaguesError}</p>
          ) : hasNoSearchMatches ? (
            <p className="mb-0">No regions or leagues matched your search.</p>
          ) : (
            <>
              {filteredRegions.length > 0 ? (
                <div className="mb-3">
                  <p className="tt-league-selector-section-title mb-2">Regions</p>
                  <div className="tt-region-chip-grid">
                    {filteredRegions.map((region) => {
                      const selectedInRegion = region.leagueIds
                        .filter((leagueId) => selectedLeagueIdSet.has(leagueId)).length;
                      const allRegionSelected = selectedInRegion === region.leagueIds.length;

                      return (
                        <button
                          key={region.id}
                          type="button"
                          className={`tt-region-chip ${allRegionSelected ? 'active' : ''}`}
                          onClick={() => onSelectRegion(region.leagueIds)}
                        >
                          <span className="tt-region-chip-name">{region.label}</span>
                          <span className="tt-region-chip-meta">{selectedInRegion}/{region.leagueIds.length}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {filteredLeagues.length > 0 ? (
                <div className="mb-2">
                  <p className="tt-league-selector-section-title mb-2">Leagues</p>
                  <div className="list-group list-custom-small tt-league-selector-list">
                    {filteredLeagues.map((league) => {
                      const isSelected = selectedLeagueIdSet.has(league.id);
                      const regionLabels = leagueRegionLabels(league);

                      return (
                        <button
                          key={league.id}
                          type="button"
                          className={`tt-league-selector-row ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => (isSelected ? onRemoveLeague(league.id) : onAddLeague(league.id))}
                        >
                          <div className="tt-league-selector-row-content">
                            <span className="tt-league-selector-row-title">{league.name}</span>
                            <span className="tt-league-selector-row-meta">
                              {regionLabels.length > 0 ? `${regionLabels.join(' • ')} • ` : ''}
                              {league.divisions.length} Div
                            </span>
                          </div>
                          <span className={`tt-league-selector-row-action ${isSelected ? 'is-remove' : 'is-add'}`}>
                            <i className={`fa ${isSelected ? 'fa-minus-circle' : 'fa-plus-circle'}`} />
                            {isSelected ? 'Remove' : 'Add'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
