'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ====== indicator -> parameter fields (ignore close/high/low) ====== */
const indicatorFields: Record<
    string,
    { key: string; label: string; type: 'int' | 'str' }[]
> = {
    Stoch: [{ key: 'slowk_period', label: 'Slow K Period', type: 'int' }],
    Dema: [{ key: 'timeperiod', label: 'Timeperiod', type: 'int' }],
    Ma: [{ key: 'timeperiod', label: 'Timeperiod', type: 'int' }],
    Sma: [{ key: 'timeperiod', label: 'Timeperiod', type: 'int' }],
    Macd: [
        { key: 'slowperiod', label: 'Slow Period', type: 'int' },
        { key: 'fastperiod', label: 'Fast Period', type: 'int' },
        { key: 'signalperiod', label: 'Signal Period', type: 'int' },
    ],
    HeikenAshi: [
        { key: 'candle_number', label: 'Candle Number', type: 'int' },
        { key: 'candle_state', label: 'Candle State', type: 'str' },
    ],
    Adx: [{ key: 'timeperiod', label: 'Timeperiod', type: 'int' }],
    Bbands: [
        { key: 'timeperiod', label: 'Timeperiod', type: 'int' },
        { key: 'nbdevup', label: 'NbDev Up', type: 'int' },
        { key: 'nbdevdn', label: 'NbDev Dn', type: 'int' },
    ],
    Rsi: [{ key: 'timeperiod', label: 'Timeperiod', type: 'int' }],
    Sar: [
        { key: 'acceleration', label: 'Acceleration', type: 'int' },
        { key: 'maximum', label: 'Maximum', type: 'int' },
    ],
    Willr: [{ key: 'timeperiod', label: 'Timeperiod', type: 'int' }],
    Supertrend: [
        { key: 'period', label: 'Period', type: 'int' },
        { key: 'multiplier', label: 'Multiplier', type: 'int' },
    ],
};

/* options for dropdowns */
const DEFAULT_INDICATOR_OPTIONS = [
    { value: 'Stoch', label: 'Stochastic (Stoch)' },
    { value: 'Dema', label: 'DEMA' },
    { value: 'Ma', label: 'MA' },
    { value: 'Sma', label: 'SMA' },
    { value: 'Macd', label: 'MACD' },
    { value: 'HeikenAshi', label: 'Heiken Ashi' },
    { value: 'Adx', label: 'ADX' },
    { value: 'Bbands', label: 'Bollinger Bands (BBands)' },
    { value: 'Rsi', label: 'RSI' },
    { value: 'Sar', label: 'SAR' },
    { value: 'Willr', label: 'WILLR' },
    { value: 'Supertrend', label: 'Supertrend' },
];

const TREND_OPTIONS = [
    { value: 'above', label: 'Above' },
    { value: 'below', label: 'Below' },
    { value: 'crossed_above', label: 'Crossed Above' },
    { value: 'crossed_below', label: 'Crossed Below' },
];

const COMPARE_TO_OPTIONS = [
    { value: 'close', label: 'Close Price' },
    { value: 'constant', label: 'Constant Value' },
];

type Indicator = {
    id: string;
    symbol: string;
    params: Record<string, any>;
    trend: string;
    compareTo: string;
    compareValue?: number;
};

type Group = {
    id: string;
    indicators: Indicator[];
};

const newId = () => Math.random().toString(36).slice(2, 9);

/* helper to convert symbol into API key like "HeikenAshi" -> "HEIKEN_ASHI" */
function formatSymbolKey(sym: string) {
    if (!sym) return sym;
    return sym.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

/* style helpers */
const selectClasses = 'px-3 py-2 rounded-lg bg-[#1b1b1b] text-white border border-gray-600';
const inputClasses = 'px-3 py-2 rounded-lg bg-[#1b1b1b] text-white border border-gray-600';

export default function SellSignalsPage() {
    const router = useRouter();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const [loading, setLoading] = useState(false); // NEW: loader state
    const handleRunStrategy = async () => {
        try {
            setLoading(true);

            // Build the payload for API (like you did before)
            const payload = {
                ticker: localStorage.getItem('ticker'),
                limit: localStorage.getItem('days'),
                buy: JSON.parse(localStorage.getItem('buy') || '[]'),
                buy_exp: localStorage.getItem('buy_exp') || '',
                sell: JSON.parse(localStorage.getItem('sell') || '[]'),
                sell_exp: localStorage.getItem('sell_exp') || '',
                resolution: '1d'
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/backtest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Backtest API failed');

            const result = await response.json();

            // Save to localStorage
            localStorage.setItem('backtest_result', JSON.stringify(result));

            // Redirect to results page
            router.push('/results');
        } catch (err) {
            console.error(err);
            alert('Error running backtest. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    const [groups, setGroups] = useState<Group[]>(() => [
        {
            id: newId(),
            indicators: [
                {
                    id: newId(),
                    symbol: '',
                    params: {},
                    trend: 'above',
                    compareTo: 'close',
                    compareValue: undefined,
                },
            ],
        },
    ]);

    const [ticker, setTicker] = useState<string>('');
    const [days, setDays] = useState<number>(100);

    // derived pieces that will be persisted as API structure
    const [sellArray, setSellArray] = useState<any[]>([]);
    const [sellExp, setSellExp] = useState<string>('');

    /* Load saved ticker/days and any saved sell config on mount */
    useEffect(() => {
        const savedTicker =
            localStorage.getItem('selectedTicker') || localStorage.getItem('ticker') || '';
        const savedDays = Number(localStorage.getItem('days') || 100);
        setTicker(savedTicker);
        setDays(savedDays);

        // if previously saved sell config exists, load sell & sell_exp (we won't attempt to reconstruct UI groups)
        try {
            const savedSell = localStorage.getItem('sell');
            const savedSellExp = localStorage.getItem('sell_exp');
            if (savedSell) setSellArray(JSON.parse(savedSell));
            if (savedSellExp) setSellExp(savedSellExp);
        } catch {
            // ignore parse errors
        }
    }, []);

    /* keep ticker/days in localStorage when changed in UI */
    useEffect(() => {
        if (ticker) localStorage.setItem('selectedTicker', ticker);
        localStorage.setItem('days', String(days ?? 100));
    }, [ticker, days]);

    /* GROUP / INDICATOR operations */
    const addGroup = () =>
        setGroups((g) => [
            ...g,
            {
                id: newId(),
                indicators: [
                    {
                        id: newId(),
                        symbol: '',
                        params: {},
                        trend: 'above',
                        compareTo: 'close',
                    },
                ],
            },
        ]);

    const removeGroup = (groupIndex: number) =>
        setGroups((g) => g.filter((_, i) => i !== groupIndex));

    const addIndicator = (groupIndex: number) =>
        setGroups((g) =>
            g.map((grp, i) =>
                i === groupIndex
                    ? {
                        ...grp,
                        indicators: [
                            ...grp.indicators,
                            {
                                id: newId(),
                                symbol: '',
                                params: {},
                                trend: 'above',
                                compareTo: 'close',
                            },
                        ],
                    }
                    : grp
            )
        );

    const removeIndicator = (groupIndex: number, indIndex: number) =>
        setGroups((g) =>
            g.map((grp, i) =>
                i === groupIndex
                    ? { ...grp, indicators: grp.indicators.filter((_, j) => j !== indIndex) }
                    : grp
            )
        );

    /* Update handlers */
    const updateIndicatorSymbol = (groupIndex: number, indIndex: number, symbol: string) => {
        const defaultParams: Record<string, any> = {};
        if (indicatorFields[symbol]) {
            indicatorFields[symbol].forEach((f) => {
                defaultParams[f.key] = f.type === 'int' ? 0 : '';
            });
        }

        setGroups((g) =>
            g.map((grp, gi) =>
                gi === groupIndex
                    ? {
                        ...grp,
                        indicators: grp.indicators.map((ind, ii) =>
                            ii === indIndex ? { ...ind, symbol, params: defaultParams } : ind
                        ),
                    }
                    : grp
            )
        );
    };

    const updateIndicatorParam = (
        groupIndex: number,
        indIndex: number,
        fieldKey: string,
        value: string
    ) => {
        setGroups((g) =>
            g.map((grp, gi) =>
                gi === groupIndex
                    ? {
                        ...grp,
                        indicators: grp.indicators.map((ind, ii) =>
                            ii === indIndex
                                ? {
                                    ...ind,
                                    params: {
                                        ...ind.params,
                                        [fieldKey]:
                                            indicatorFields[ind.symbol]?.find((f) => f.key === fieldKey)?.type === 'int'
                                                ? Number(value)
                                                : value,
                                    },
                                }
                                : ind
                        ),
                    }
                    : grp
            )
        );
    };

    const updateTrend = (groupIndex: number, indIndex: number, trend: string) =>
        setGroups((g) =>
            g.map((grp, gi) =>
                gi === groupIndex
                    ? {
                        ...grp,
                        indicators: grp.indicators.map((ind, ii) =>
                            ii === indIndex ? { ...ind, trend } : ind
                        ),
                    }
                    : grp
            )
        );

    const updateCompareTo = (groupIndex: number, indIndex: number, compareTo: string) =>
        setGroups((g) =>
            g.map((grp, gi) =>
                gi === groupIndex
                    ? {
                        ...grp,
                        indicators: grp.indicators.map((ind, ii) =>
                            ii === indIndex ? { ...ind, compareTo, compareValue: undefined } : ind
                        ),
                    }
                    : grp
            )
        );

    const updateCompareValue = (groupIndex: number, indIndex: number, compareValue: number) =>
        setGroups((g) =>
            g.map((grp, gi) =>
                gi === groupIndex
                    ? {
                        ...grp,
                        indicators: grp.indicators.map((ind, ii) =>
                            ii === indIndex ? { ...ind, compareValue } : ind
                        ),
                    }
                    : grp
            )
        );

    /* Build sell array and sell_exp from groups and persist to localStorage */
    useEffect(() => {
        const arr: any[] = [];
        groups.forEach((grp) =>
            grp.indicators.forEach((ind) => {
                if (!ind.symbol) return;
                const key = formatSymbolKey(ind.symbol);
                const params: Record<string, any> = {};
                Object.entries(ind.params || {}).forEach(([k, v]) => {
                    if (v !== undefined && v !== '') params[k] = v;
                });
                params.trend = ind.trend;
                if (ind.compareTo && ind.compareTo !== 'close') {
                    params.compareTo = ind.compareTo;
                    if (ind.compareTo === 'constant' && ind.compareValue !== undefined) {
                        params.compareValue = ind.compareValue;
                    }
                }
                const obj: Record<string, any> = {};
                obj[key] = params;
                arr.push(obj);
            })
        );
        setSellArray(arr);
        localStorage.setItem('sell', JSON.stringify(arr));

        // build sell_exp
        const groupStrings = groups.map((grp) => {
            const pieces = grp.indicators
                .map((ind) => {
                    if (!ind.symbol) return '';
                    const fields = indicatorFields[ind.symbol] || [];
                    const valuesPart = fields
                        .map((f) => {
                            const v = ind.params?.[f.key];
                            return v !== undefined && v !== '' ? String(v) : '';
                        })
                        .filter(Boolean)
                        .join('');
                    const comparePart =
                        ind.compareTo === 'constant' && ind.compareValue !== undefined
                            ? String(ind.compareValue)
                            : '';
                    return `${formatSymbolKey(ind.symbol)}${valuesPart}${comparePart}${ind.trend}`;
                })
                .filter(Boolean);

            if (pieces.length === 0) return '___';
            if (pieces.length === 1) return pieces[0];
            return `(${pieces.join(' & ')})`;
        });

        const exp = groupStrings.join(' | ');
        setSellExp(exp);
        localStorage.setItem('sell_exp', exp);
    }, [groups]);

    /* Save & proceed */
    const handleSaveProceed = () => {
        // ensure persist
        localStorage.setItem('sell', JSON.stringify(sellArray));
        localStorage.setItem('sell_exp', sellExp);
        if (ticker) localStorage.setItem('selectedTicker', ticker);
        localStorage.setItem('days', String(days ?? 100));

        alert('Sell strategy saved to localStorage (sell, sell_exp). Check console for payload preview.');
        console.log('Sell payload preview:', { sell: sellArray, sell_exp: sellExp, ticker, days });
    };

    /* Quick final payload preview (reads buy from localStorage if present) */
    const previewFinalPayload = () => {
        const buy = JSON.parse(localStorage.getItem('buy') || '[]');
        const buy_exp = localStorage.getItem('buy_exp') || '';
        const payload = {
            buy,
            sell: sellArray,
            buy_exp,
            sell_exp: sellExp,
            ticker,
            days,
            limit: 200,
            resolution: '1d',
        };
        console.log('Final payload (preview):', payload);
        alert('Final payload preview logged to console.');
    };

    /* Short preview string from UI groups */
    const preview = groups
        .map((grp) => {
            const labels = grp.indicators.map((ind) =>
                ind.symbol && ind.symbol.trim()
                    ? `${ind.symbol}${Object.values(ind.params).join('')}${ind.trend}`
                    : '___'
            );
            if (labels.length === 0) return '___';
            if (labels.length === 1) return labels[0];
            return `(${labels.join(' & ')})`;
        })
        .join(' | ');

    /* --- Render --- */
    return (
        <main
            className="flex flex-col items-center min-h-screen px-4 py-10"
            style={{ backgroundColor: '#180a01ff', color: '#ffffff' }}
        >
            {/* Fullscreen Loader */}
            {loading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
                    <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span className="ml-4 text-white text-lg font-semibold">Running Backtest…</span>
                </div>
            )}
            <div className="w-full max-w-6xl">
                {/* Back Navigation */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/buy-signals')}
                        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors hover:bg-[#582f0e] bg-[rgba(255,255,255,0.1)]"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Buy Signals
                    </button>
                </div>
                
                <h1 className="text-3xl font-bold mb-4 text-white">Define Sell Strategy</h1>

                {/* Ticker / Days header */}
                <div className="mb-6 p-4 border border-[#582f0e] rounded-lg" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
                    <p className="text-sm text-white">
                        <strong>Ticker:</strong>{' '}
                        <span className="font-semibold text-white">{ticker || '—'}</span>{' '}
                        | <strong>Days:</strong>{' '}
                        <span className="font-semibold text-white">{days ?? '—'}</span>
                    </p>
                </div>

                {/* Groups builder */}
                <div className="space-y-5 border border-[#582f0e] rounded-lg">
                    {groups.map((grp, gi) => (
                        <section key={grp.id} className="bg-[rgba(0,0,0,0.25)] rounded-lg p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="inline-block px-3 py-1 text-xs rounded-full bg-black text-white">
                                            Group {gi + 1}
                                        </span>
                                        <p className="text-sm text-white">
                                            Indicators in this group combined with <strong>AND</strong>
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {grp.indicators.map((ind, ii) => {
                                            const fields = indicatorFields[ind.symbol] || [];
                                            return (
                                                <div key={ind.id} className="bg-[rgba(0,0,0,0.22)] p-3 border border-[#582f0e] rounded-lg">
                                                    {/* Indicator selection */}
                                                    <label className="block text-sm text-white mb-1">Indicator</label>
                                                    <select
                                                        value={ind.symbol}
                                                        onChange={(e) => updateIndicatorSymbol(gi, ii, e.target.value)}
                                                        className={selectClasses}
                                                    >
                                                        <option value="">-- Choose indicator --</option>
                                                        {DEFAULT_INDICATOR_OPTIONS.map((opt) => (
                                                            <option key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </option>
                                                        ))}
                                                    </select>

                                                    {/* Params */}
                                                    <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                                                        {fields.length === 0 && (
                                                            <div className="text-sm text-white col-span-full">
                                                                Select an indicator above to configure its inputs.
                                                            </div>
                                                        )}
                                                        {fields.map((f) => (
                                                            <div key={f.key} className="flex flex-col">
                                                                <label className="text-sm text-white mb-1">{f.label}</label>
                                                                <input
                                                                    type={f.type === 'int' ? 'number' : 'text'}
                                                                    value={ind.params?.[f.key] ?? ''}
                                                                    onChange={(e) =>
                                                                        updateIndicatorParam(gi, ii, f.key, e.target.value)
                                                                    }
                                                                    className={inputClasses}
                                                                    placeholder={f.label}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Signal Conditions */}
                                                    <div className="mt-4 bg-[rgba(255,255,255,0.03)] p-3 border border-[#582f0e] rounded-lg">
                                                        <p className="text-sm font-medium text-white mb-2">Signal Condition</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                            <div className="flex flex-col">
                                                                <label className="text-sm text-white mb-1">Trend</label>
                                                                <select
                                                                    value={ind.trend}
                                                                    onChange={(e) => updateTrend(gi, ii, e.target.value)}
                                                                    className={selectClasses}
                                                                >
                                                                    {TREND_OPTIONS.map((t) => (
                                                                        <option key={t.value} value={t.value}>
                                                                            {t.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            <div className="flex flex-col">
                                                                <label className="text-sm text-white mb-1">Compare To</label>
                                                                <select
                                                                    value={ind.compareTo}
                                                                    onChange={(e) => updateCompareTo(gi, ii, e.target.value)}
                                                                    className={selectClasses}
                                                                >
                                                                    {COMPARE_TO_OPTIONS.map((c) => (
                                                                        <option key={c.value} value={c.value}>
                                                                            {c.label}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>

                                                            {ind.compareTo === 'constant' && (
                                                                <div className="flex flex-col">
                                                                    <label className="text-sm text-white mb-1">Constant Value</label>
                                                                    <input
                                                                        type="number"
                                                                        value={ind.compareValue ?? ''}
                                                                        onChange={(e) =>
                                                                            updateCompareValue(gi, ii, Number(e.target.value))
                                                                        }
                                                                        className={inputClasses}
                                                                        placeholder="Enter value"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Remove indicator */}
                                                    <div className="mt-3 flex justify-end">
                                                        {grp.indicators.length > 1 && (
                                                            <button
                                                                onClick={() => removeIndicator(gi, ii)}
                                                                className="px-3 py-2 rounded-lg bg-black text-white text-sm hover:bg-gray-800"
                                                            >
                                                                Remove Indicator
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-3">
                                        <button
                                            onClick={() => addIndicator(gi)}
                                            className="px-3 py-2 bg-white text-[#4f000b] rounded-full font-medium shadow-sm"
                                        >
                                            + Add indicator (AND)
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <button
                                        onClick={() => removeGroup(gi)}
                                        className="px-3 py-2 bg-black hover:bg-gray-800 rounded-lg text-sm text-white"
                                        disabled={groups.length === 1}
                                        title={groups.length === 1 ? 'At least one group required' : 'Remove group'}
                                    >
                                        Remove Group
                                    </button>
                                </div>
                            </div>
                        </section>
                    ))}
                </div>

                <div className="mt-6 flex justify-center">
                    <button
                        onClick={addGroup}
                        className="px-4 py-2 bg-white text-[#4f000b] rounded-full font-semibold shadow-md"
                    >
                        + Add Group (OR)
                    </button>
                </div>

                {/* Expression preview */}
                <div className="mt-6 bg-[rgba(0,0,0,0.15)] p-4 border border-[#582f0e] rounded-lg">
                    <p className="text-sm text-white mb-2">Sell Expression (preview)</p>
                    <pre className="text-white text-sm break-words">{sellExp || preview || '—'}</pre>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleRunStrategy}
                        disabled={loading}
                        className="px-6 py-3 bg-white text-[#4f000b] font-semibold rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50"
                    >
                        Run Strategy
                    </button>
                </div>
            </div>
        </main>
    );
}
