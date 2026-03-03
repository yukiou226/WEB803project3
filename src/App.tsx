import React, { useEffect, useMemo, useState } from "react";

type EventType =
  | "IMD Human"
  | "IMD Vehicle"
  | "Line Crossing"
  | "Intrusion"
  | "Tampering"
  | "Scene Change";

type SortMode = "relevance" | "time";

type EventRecord = {
  id: string;
  title: string;
  description: string;
  group: "Group1" | "Group2" | "Group3";
  device: "Cam 01" | "Cam 02" | "Cam 03";
  eventType: EventType;
  timestamp: string;
  thumbnail: string;
  location: string;
};

type FiltersState = {
  group: "All" | "Group1" | "Group2" | "Group3";
  device: "All" | "Cam 01" | "Cam 02" | "Cam 03";
  dateFrom: string;
  dateTo: string;
  eventTypes: EventType[] | ["All"];
};

type SearchState = {
  prompt: string;
  filters: FiltersState;
  sortBy: SortMode;
};

type HistoryItem = SearchState & {
  id: string;
  createdAt: string;
};

type User = {
  name: string;
};

const HISTORY_STORAGE_KEY = "guardian-ai-search-history";
const AUTH_STORAGE_KEY = "guardian-ai-user";

const ALL_EVENT_TYPES: EventType[] = [
  "IMD Human",
  "IMD Vehicle",
  "Line Crossing",
  "Intrusion",
  "Tampering",
  "Scene Change"
];

const DUMMY_EVENTS: EventRecord[] = [
  {
    id: "1",
    title: "Active Shooter Reported",
    description:
      "Staff evacuated as police responded to an active shooter alarm at the main entrance. Situation was contained and later confirmed as a false alarm.",
    group: "Group1",
    device: "Cam 01",
    eventType: "Intrusion",
    timestamp: "2026-01-06T09:22:00Z",
    thumbnail:
      "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "North Parking Lot"
  },
  {
    id: "2",
    title: "Unauthorized Access Detected",
    description:
      "System flagged an unauthorized login attempt on the executive network. Credentials were reset and security protocols reviewed.",
    group: "Group1",
    device: "Cam 02",
    eventType: "Tampering",
    timestamp: "2026-01-06T11:10:00Z",
    thumbnail:
      "https://images.pexels.com/photos/102496/pexels-photo-102496.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Executive Entrance"
  },
  {
    id: "3",
    title: "Suspicious Package Handled",
    description:
      "A suspicious package was found in the main lobby. Area was secured while the bomb squad inspected and cleared the item as non-hazardous.",
    group: "Group2",
    device: "Cam 03",
    eventType: "Intrusion",
    timestamp: "2026-01-07T13:44:00Z",
    thumbnail:
      "https://images.pexels.com/photos/87223/pexels-photo-87223.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Main Lobby"
  },
  {
    id: "4",
    title: "Line Crossing Alert",
    description:
      "AI detected multiple line crossing events after hours near the loading dock. Security patrol confirmed delivery truck activity only.",
    group: "Group3",
    device: "Cam 01",
    eventType: "Line Crossing",
    timestamp: "2026-01-05T22:18:00Z",
    thumbnail:
      "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Loading Dock"
  },
  {
    id: "5",
    title: "Human Detected After Hours",
    description:
      "IMD Human detected near the campus gate outside of scheduled patrol times. Footage showed maintenance staff leaving late.",
    group: "Group2",
    device: "Cam 02",
    eventType: "IMD Human",
    timestamp: "2026-01-05T01:03:00Z",
    thumbnail:
      "https://images.pexels.com/photos/101808/pexels-photo-101808.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "South Gate"
  },
  {
    id: "6",
    title: "Vehicle Loitering Detected",
    description:
      "IMD Vehicle detected circling the front driveway multiple times. License plate logged and shared with local authorities.",
    group: "Group3",
    device: "Cam 03",
    eventType: "IMD Vehicle",
    timestamp: "2026-01-08T18:32:00Z",
    thumbnail:
      "https://images.pexels.com/photos/279993/pexels-photo-279993.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Front Driveway"
  },
  {
    id: "7",
    title: "Scene Change on Lobby Camera",
    description:
      "Lobby furniture was moved significantly between overnight patrols. Cleaning crew confirmed they rearranged the seating area.",
    group: "Group1",
    device: "Cam 01",
    eventType: "Scene Change",
    timestamp: "2026-01-06T04:12:00Z",
    thumbnail:
      "https://images.pexels.com/photos/37347/office-freelancer-computer-business-37347.jpeg?auto=compress&cs=tinysrgb&w=800",
    location: "Main Lobby"
  }
];

const defaultFilters: FiltersState = {
  group: "All",
  device: "All",
  dateFrom: "",
  dateTo: "",
  eventTypes: ["All"]
};

function withinLast30Days(date: Date): boolean {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  return date >= thirtyDaysAgo && date <= now;
}

function loadStoredUser(): User | null {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveStoredUser(user: User | null) {
  if (!user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function loadHistory(): HistoryItem[] {
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const all = JSON.parse(raw) as HistoryItem[];
    const filtered = all.filter((item) => withinLast30Days(new Date(item.createdAt)));
    return filtered.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

function saveHistory(history: HistoryItem[]) {
  const trimmed = history.filter((item) =>
    withinLast30Days(new Date(item.createdAt))
  );
  window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
}

function applyFiltersAndSorting(
  events: EventRecord[],
  search: SearchState
): EventRecord[] {
  const { filters, sortBy, prompt } = search;
  const promptTokens = prompt
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  let subset = events.filter((evt) => {
    if (filters.group !== "All" && evt.group !== filters.group) return false;
    if (filters.device !== "All" && evt.device !== filters.device) return false;
    if (
      filters.eventTypes[0] !== "All" &&
      !(filters.eventTypes as readonly string[]).includes(evt.eventType)
    ) {
      return false;
    }

    const ts = new Date(evt.timestamp);
    if (filters.dateFrom && ts < new Date(filters.dateFrom)) return false;
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      if (ts > end) return false;
    }

    if (promptTokens.length > 0) {
      const haystack =
        `${evt.title} ${evt.description} ${evt.location} ${evt.eventType}`.toLowerCase();
      const matches = promptTokens.some((token) => haystack.includes(token));
      if (!matches) return false;
    }

    return true;
  });

  if (sortBy === "time") {
    subset = subset.slice().sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  } else {
    subset = subset
      .slice()
      .sort((a, b) => relevanceScore(b, promptTokens) - relevanceScore(a, promptTokens));
  }

  return subset;
}

function relevanceScore(evt: EventRecord, promptTokens: string[]): number {
  let score = 1;
  const haystack =
    `${evt.title} ${evt.description} ${evt.location} ${evt.eventType}`.toLowerCase();

  for (const token of promptTokens) {
    if (haystack.includes(token)) {
      score += 3;
    }
  }

  const now = Date.now();
  const ageHours = (now - new Date(evt.timestamp).getTime()) / (1000 * 60 * 60);
  const recencyBoost = Math.max(0, 24 - Math.min(ageHours, 24)) / 24;
  score += recencyBoost;

  return score;
}

const LoginScreen: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const handleMockOAuth = () => {
    if (isAuthorizing) return;
    setIsAuthorizing(true);
    setTimeout(() => {
      onLogin({ name: "Miss Eliza" });
    }, 900);
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div>
          <div className="login-title">Guardian AI</div>
          <div className="login-subtitle">
            Sign in with your organization account to start searching surveillance
            events with AI.
          </div>
        </div>

        <button
          className="login-provider-button"
          onClick={handleMockOAuth}
          disabled={isAuthorizing}
        >
          <span className="login-provider-logo" />
          <span>
            {isAuthorizing ? "Connecting to OAuth provider…" : "Continue with Google"}
          </span>
        </button>

        <div className="login-footnote">
          This is a mock OAuth flow for the project. Replace with a real identity
          provider when wiring to a production backend.
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() =>
    typeof window !== "undefined" ? loadStoredUser() : null
  );

  const [search, setSearch] = useState<SearchState>({
    prompt: "",
    filters: defaultFilters,
    sortBy: "relevance"
  });

  const [typedPrompt, setTypedPrompt] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<EventRecord[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (!user) return;
    saveStoredUser(user);
  }, [user]);

  const activeFiltersSummary = useMemo(() => {
    const parts: string[] = [];
    if (search.filters.group !== "All") parts.push(search.filters.group);
    if (search.filters.device !== "All") parts.push(search.filters.device);
    if (search.filters.eventTypes[0] !== "All") {
      parts.push(search.filters.eventTypes.join(", "));
    }
    if (search.filters.dateFrom || search.filters.dateTo) {
      parts.push(
        `${search.filters.dateFrom || "Any"} → ${
          search.filters.dateTo || "Any"
        }`.trim()
      );
    }
    return parts;
  }, [search.filters]);

  const runSearch = (overrides?: Partial<SearchState>, fromHistoryId?: string) => {
    const nextState: SearchState = {
      ...search,
      prompt: typedPrompt || search.prompt,
      sortBy: "relevance",
      ...overrides
    };

    setIsSearching(true);
    setHasSearched(true);

    setTimeout(() => {
      const filtered = applyFiltersAndSorting(DUMMY_EVENTS, nextState);
      setResults(filtered);
      setSearch(nextState);
      setIsSearching(false);

      const historyItem: HistoryItem = {
        id: fromHistoryId ?? `${Date.now()}`,
        createdAt: new Date().toISOString(),
        prompt: nextState.prompt,
        filters: nextState.filters,
        sortBy: nextState.sortBy
      };

      const updatedHistory = [historyItem, ...history].slice(0, 50);
      setHistory(updatedHistory);
      saveHistory(updatedHistory);
    }, 800);
  };

  const handleHistoryRecall = (item: HistoryItem) => {
    setTypedPrompt(item.prompt);
    setSearch({
      prompt: item.prompt,
      filters: item.filters,
      sortBy: item.sortBy
    });
    setHistoryOpen(false);
    runSearch(
      {
        prompt: item.prompt,
        filters: item.filters,
        sortBy: item.sortBy
      },
      item.id
    );
  };

  const handleSortChange = (mode: SortMode) => {
    if (search.sortBy === mode || !hasSearched) return;
    const updated: SearchState = { ...search, sortBy: mode };
    const sorted = applyFiltersAndSorting(DUMMY_EVENTS, updated);
    setSearch(updated);
    setResults(sorted);
  };

  const startNewDialog = () => {
    setTypedPrompt("");
    setSearch({
      prompt: "",
      filters: defaultFilters,
      sortBy: "relevance"
    });
    setResults([]);
    setHasSearched(false);
    setIsSearching(false);
    setHistoryOpen(false);
  };

  const visibleHistory = useMemo(
    () =>
      history.filter((item) =>
        withinLast30Days(new Date(item.createdAt))
      ),
    [history]
  );

  const renderedResults =
    isSearching && !results.length ? (
      <div className="loading-row">
        <div className="loading-card">Searching events…</div>
        <div className="loading-card">Scanning video analytics…</div>
        <div className="loading-card">Ranking by relevance…</div>
      </div>
    ) : !results.length && hasSearched ? (
      <div className="empty-state">
        <div>No events found</div>
        <div>Try expanding your date range or removing filters.</div>
      </div>
    ) : (
      <div className="results-grid">
        {results.map((evt) => (
          <article key={evt.id} className="event-card">
            <div
              className="event-image"
              style={{ backgroundImage: `url(${evt.thumbnail})` }}
            />
            <div className="event-body">
              <div className="event-title">{evt.title}</div>
              <div className="event-description">{evt.description}</div>
              <div className="event-meta">
                <span>
                  {new Date(evt.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
                <span className="event-tag">{evt.eventType}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    );

  if (!user) {
    return (
      <LoginScreen
        onLogin={(u) => {
          setUser(u);
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      <div className="app-shell-inner">
        <header className="top-bar">
          <div className="top-bar-left">Guardian AI</div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              className="icon-button secondary"
              type="button"
              title="New chat"
              onClick={startNewDialog}
            >
              +
            </button>
            <button
              className="icon-button secondary"
              type="button"
              title="Search history (last 30 days)"
              onClick={() => setHistoryOpen((open) => !open)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </button>
            <div className="avatar-pill">
            <div className="avatar">
              {user.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </div>
            <span className="avatar-name">{user.name}</span>
          </div>
          </div>
        </header>

        <main className="hero">
          <div>
            <div className="hero-title">Hello, what can I do for you?</div>
            <div className="hero-subtitle">
              Ask Guardian AI to find events across your surveillance VSaaS platform,
              or narrow things down with filters.
            </div>
          </div>

          <section className="search-panel">
            <div className="search-tabs">
              <div className="search-tab active">General AI Search</div>
            </div>

            <div className="search-row">
              <div className="prompt-input-wrapper">
                <input
                  className="prompt-input"
                  placeholder="Type your request…"
                  value={typedPrompt}
                  onChange={(e) => setTypedPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (typedPrompt.trim().length === 0) return;
                      runSearch();
                    }
                  }}
                />

                <div className="filter-chips-row">
                  <span className="filter-chip">
                    <span className="filter-chip-label">Group:</span>
                    <span className="filter-chip-value">{search.filters.group}</span>
                    <button type="button" aria-label="Clear group" onClick={() => setSearch((prev) => ({ ...prev, filters: { ...prev.filters, group: "All" } }))} className="filter-chip-x">×</button>
                  </span>
                  <span className="filter-chip">
                    <span className="filter-chip-label">Device:</span>
                    <span className="filter-chip-value">{search.filters.device}</span>
                    <button type="button" aria-label="Clear device" onClick={() => setSearch((prev) => ({ ...prev, filters: { ...prev.filters, device: "All" } }))} className="filter-chip-x">×</button>
                  </span>
                  <span className="filter-chip">
                    <span className="filter-chip-label">Date:</span>
                    <span className="filter-chip-value">
                      {search.filters.dateFrom && search.filters.dateTo
                        ? `${search.filters.dateFrom} to ${search.filters.dateTo}`
                        : "Any time"}
                    </span>
                    <button type="button" aria-label="Clear date" onClick={() => setSearch((prev) => ({ ...prev, filters: { ...prev.filters, dateFrom: "", dateTo: "" } }))} className="filter-chip-x">×</button>
                  </span>
                  <span className="filter-chip">
                    <span className="filter-chip-label">Event type:</span>
                    <span className="filter-chip-value">
                      {search.filters.eventTypes[0] === "All"
                        ? "All"
                        : search.filters.eventTypes.join(", ")}
                    </span>
                    <button type="button" aria-label="Clear event type" onClick={() => setSearch((prev) => ({ ...prev, filters: { ...prev.filters, eventTypes: ["All"] } }))} className="filter-chip-x">×</button>
                  </span>
                </div>
              </div>

              <button
                className="send-button"
                type="button"
                disabled={typedPrompt.trim().length === 0 || isSearching}
                onClick={() => runSearch()}
              >
                ↑
              </button>
            </div>

            <div className="filter-select-row">
              <div className="filter-select">
                <label htmlFor="group-select">Group:</label>
                <select
                  id="group-select"
                  value={search.filters.group}
                  onChange={(e) =>
                    setSearch((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        group: e.target.value as FiltersState["group"]
                      }
                    }))
                  }
                >
                  <option value="All">All</option>
                  <option value="Group1">Group1</option>
                  <option value="Group2">Group2</option>
                  <option value="Group3">Group3</option>
                </select>
              </div>

              <div className="filter-select">
                <label htmlFor="device-select">Device:</label>
                <select
                  id="device-select"
                  value={search.filters.device}
                  onChange={(e) =>
                    setSearch((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        device: e.target.value as FiltersState["device"]
                      }
                    }))
                  }
                >
                  <option value="All">All</option>
                  <option value="Cam 01">Cam 01</option>
                  <option value="Cam 02">Cam 02</option>
                  <option value="Cam 03">Cam 03</option>
                </select>
              </div>

              <div className="filter-select">
                <label htmlFor="date-from">From:</label>
                <input
                  id="date-from"
                  type="date"
                  value={search.filters.dateFrom}
                  onChange={(e) =>
                    setSearch((prev) => ({
                      ...prev,
                      filters: { ...prev.filters, dateFrom: e.target.value }
                    }))
                  }
                />
              </div>

              <div className="filter-select">
                <label htmlFor="date-to">To:</label>
                <input
                  id="date-to"
                  type="date"
                  value={search.filters.dateTo}
                  onChange={(e) =>
                    setSearch((prev) => ({
                      ...prev,
                      filters: { ...prev.filters, dateTo: e.target.value }
                    }))
                  }
                />
              </div>

              <div className="filter-select">
                <label htmlFor="event-type-select">Event type:</label>
                <select
                  id="event-type-select"
                  value={
                    search.filters.eventTypes[0] === "All"
                      ? "All"
                      : search.filters.eventTypes[0]
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearch((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        eventTypes:
                          val === "All" ? ["All"] : ([val] as FiltersState["eventTypes"])
                      }
                    }));
                  }}
                >
                  <option value="All">All</option>
                  {ALL_EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {(hasSearched || isSearching) && (
            <section className="chat-layout">
              <div>
                {hasSearched && (
                  <>
                    <div className="summary-pill">
                      <span role="img" aria-label="Sparkles">
                        ✨
                      </span>
                      <div className="summary-text">
                        <strong>
                          {search.prompt || typedPrompt || "Your last request"}
                        </strong>
                        <div className="summary-filters">
                          {activeFiltersSummary.map((f) => (
                            <span key={f} className="summary-filter-pill">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {!isSearching && results.length > 0 && (
                      <p
                        className="summary-text"
                        style={{ marginTop: 10, color: "#6b7280", fontSize: 12 }}
                      >
                        Absolutely! I found {results.length} event
                        {results.length !== 1 ? "s" : ""}
                        {search.filters.dateFrom || search.filters.dateTo
                          ? ` from ${search.filters.dateFrom || "any date"} to ${
                              search.filters.dateTo || "now"
                            }`
                          : ""}
                        {search.filters.group !== "All"
                          ? ` for devices in ${search.filters.group}`
                          : ""}
                        {search.prompt || typedPrompt
                          ? ` matching "${search.prompt || typedPrompt}".`
                          : "."}
                      </p>
                    )}
                  </>
                )}
              </div>

              <div className="results-column">
                <div className="results-header">
                  <div>
                    <div className="results-header-title">Searching Events</div>
                    <div className="results-header-meta">
                      {isSearching
                        ? "Analyzing cameras and analytics…"
                        : results.length
                        ? `Found ${results.length} events`
                        : "Results will appear here after your first search."}
                    </div>
                  </div>

                  <div className="sort-toggle">
                    <button
                      type="button"
                      className={search.sortBy === "relevance" ? "active" : ""}
                      onClick={() => handleSortChange("relevance")}
                    >
                      Relevance
                    </button>
                    <button
                      type="button"
                      className={search.sortBy === "time" ? "active" : ""}
                      onClick={() => handleSortChange("time")}
                    >
                      Time
                    </button>
                  </div>
                </div>

                {renderedResults}
              </div>
            </section>
          )}
        </main>

        {historyOpen && (
          <aside className="history-panel">
            <div className="history-header">
              <div>
                <div className="history-title">Recent AI searches</div>
                <div className="history-subtitle">Last 30 days</div>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setHistoryOpen(false)}
              >
                ×
              </button>
            </div>

            {visibleHistory.length === 0 ? (
              <div className="history-subtitle">
                Your next Guardian AI search will be saved here for quick recall.
              </div>
            ) : (
              <ul className="history-list">
                {visibleHistory.map((item) => (
                  <li
                    key={item.id + item.createdAt}
                    className="history-item"
                    onClick={() => handleHistoryRecall(item)}
                  >
                    <div className="history-primary">
                      {item.prompt || "Untitled request"}
                    </div>
                    <div className="history-meta-row">
                      <span>
                        {new Date(item.createdAt).toLocaleString(undefined, {
                          month: "short",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      <div className="history-filters">
                        {item.filters.group !== "All" && (
                          <span className="history-filter-pill">
                            {item.filters.group}
                          </span>
                        )}
                        {item.filters.eventTypes[0] !== "All" && (
                          <span className="history-filter-pill">
                            {item.filters.eventTypes.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default App;

