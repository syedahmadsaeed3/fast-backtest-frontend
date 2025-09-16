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

/* types */
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
  // insert underscore between lower-upper then uppercase
  return sym.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();
}

/* css helper for selects */
const selectClasses =
  'px-3 py-2 rounded-lg bg-[#1b1b1b] text-white border border-gray-600';

export default function BuySignalsPage() {
  const router = useRouter();

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

  // loaded from localStorage (set by Search page)
  const [ticker, setTicker] = useState<string>('');
  const [days, setDays] = useState<number>(100);

  // derived payload pieces
  const [buyArray, setBuyArray] = useState<any[]>([]);
  const [buyExp, setBuyExp] = useState<string>('');

  /* load ticker/days and any saved buy config */
  useEffect(() => {
    const savedTicker = localStorage.getItem('selectedTicker') || '';
    const savedDays = Number(localStorage.getItem('days') || '100');
    setTicker(savedTicker);
    setDays(savedDays);

    // If user previously saved buy config, load it into UI
    try {
      const savedBuy = localStorage.getItem('buy');
      const savedBuyExp = localStorage.getItem('buy_exp');
      if (savedBuy) {
        // savedBuy is an array of objects; we need to reconstruct groups / indicators UI if possible.
        // We'll only preload buy array into buyArray state; UI groups remain fresh.
        setBuyArray(JSON.parse(savedBuy));
      }
      if (savedBuyExp) setBuyExp(savedBuyExp);
    } catch (e) {
      // ignore parse errors
    }
  }, []);

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

  /* When indicator type changes initialize its params */
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

  const updateTrend = (groupIndex: number, indIndex: number, trend: string) => {
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
  };

  const updateCompareTo = (groupIndex: number, indIndex: number, compareTo: string) => {
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
  };

  const updateCompareValue = (groupIndex: number, indIndex: number, compareValue: number) => {
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
  };

  /* ====== Build buy array and buy_exp from groups ====== */
  useEffect(() => {
    // build buy array: list of objects { SYMBOL_KEY: { ...params, trend } }
    const arr: any[] = [];
    groups.forEach((grp) =>
      grp.indicators.forEach((ind) => {
        if (!ind.symbol) return;
        const key = formatSymbolKey(ind.symbol);
        // filter params to exclude undefined
        const params: Record<string, any> = {};
        Object.entries(ind.params || {}).forEach(([k, v]) => {
          if (v !== undefined && v !== '') params[k] = v;
        });
        // attach trend
        params.trend = ind.trend;
        // attach compareTo / compareValue if constant
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
    setBuyArray(arr);
    localStorage.setItem('buy', JSON.stringify(arr));

    // build buy_exp string
    const groupStrings = groups.map((grp) => {
      const pieces = grp.indicators
        .map((ind) => {
          if (!ind.symbol) return '';
          // Use indicatorFields order to collect param values (so MA -> timeperiod)
          const fields = indicatorFields[ind.symbol] || [];
          const valuesPart = fields
            .map((f) => {
              const v = ind.params?.[f.key];
              return v !== undefined && v !== '' ? String(v) : '';
            })
            .filter(Boolean)
            .join(''); // no separator per example
          // If compareTo constant, append that value as well
          const comparePart =
            ind.compareTo === 'constant' && ind.compareValue !== undefined
              ? String(ind.compareValue)
              : '';
          // piece format: SYMBOL + values + comparePart + trend
          return `${formatSymbolKey(ind.symbol)}${valuesPart}${comparePart}${ind.trend}`;
        })
        .filter(Boolean);

      if (pieces.length === 0) return '___';
      if (pieces.length === 1) return pieces[0];
      return `(${pieces.join(' & ')})`;
    });

    const exp = groupStrings.join(' | ');
    setBuyExp(exp);
    localStorage.setItem('buy_exp', exp);
  }, [groups]);

  /* Save & proceed: store current buy/buy_exp and navigate to Sell page */
  const handleSaveProceed = () => {
    // ensure localStorage already has buy and buy_exp (use effect set them)
    localStorage.setItem('buy', JSON.stringify(buyArray));
    localStorage.setItem('buy_exp', buyExp);
    // also keep ticker/days saved (Search page should already do this)
    if (ticker) localStorage.setItem('selectedTicker', ticker);
    localStorage.setItem('days', String(days || 100));

    // navigate to sell-signals page
    router.push('/sell-signals');
  };

  /* quick payload preview (not sent) */
  const buildFinalPreview = () => {
    return {
      buy: buyArray,
      buy_exp: buyExp,
      ticker,
      days,
    };
  };

  return (
    <main
      className="flex flex-col items-center min-h-screen px-4 py-10"
      style={{ backgroundColor: '#000814', color: '#ffffff' }}
    >
      <div className="w-full max-w-6xl">
        {/* Back Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/search')}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg font-medium transition-colors hover:bg-[#005f73] bg-[rgba(255,255,255,0.1)]"
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
            Back to Search
          </button>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 text-white">Define Buy Strategy</h1>

        {/* Ticker / Days header */}
        <div
          className="mb-6 p-4 border border-[#005f73] rounded-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <p className="text-sm text-gray-300">
            <strong>Ticker:</strong> <span className="text-white">{ticker || '—'}</span>{' '}
            | <strong>Days:</strong>{' '}
            <span className="text-white">{days ?? '—'}</span>
          </p>
        </div>

        {/* Groups builder */}
        <div className="space-y-5">
          {groups.map((grp, gi) => (
            <section
              key={grp.id}
              className="bg-[rgba(255,255,255,0.04)] border border-[#005f73] rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className="inline-block px-3 py-1 text-xs rounded-full"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.06)',
                        color: '#ffffff',
                      }}
                    >
                      Group {gi + 1}
                    </span>
                    <p className="text-sm text-gray-300">
                      Indicators in this group combined with <strong>AND</strong>
                    </p>
                  </div>

                  <div className="space-y-3">
                    {grp.indicators.map((ind, ii) => {
                      const fields = indicatorFields[ind.symbol] || [];
                      return (
                        <div
                          key={ind.id}
                          className="bg-[rgba(255,255,255,0.02)] p-3 border border-[#005f73] rounded-lg"
                        >
                          {/* indicator select */}
                          <label className="block text-sm text-gray-300 mb-1">
                            Indicator
                          </label>
                          <select
                            value={ind.symbol}
                            onChange={(e) =>
                              updateIndicatorSymbol(gi, ii, e.target.value)
                            }
                            className={selectClasses}
                          >
                            <option value="" className="text-gray-400">
                              -- Choose indicator --
                            </option>
                            {DEFAULT_INDICATOR_OPTIONS.map((opt) => (
                              <option
                                key={opt.value}
                                value={opt.value}
                                className="text-white"
                              >
                                {opt.label}
                              </option>
                            ))}
                          </select>

                          {/* params */}
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                            {fields.length === 0 && (
                              <div className="text-sm text-gray-300 col-span-full">
                                Select an indicator above to configure its inputs.
                              </div>
                            )}
                            {fields.map((f) => (
                              <div key={f.key} className="flex flex-col">
                                <label className="text-sm text-gray-300 mb-1">
                                  {f.label}
                                </label>
                                <input
                                  type={f.type === 'int' ? 'number' : 'text'}
                                  value={ind.params?.[f.key] ?? ''}
                                  onChange={(e) =>
                                    updateIndicatorParam(
                                      gi,
                                      ii,
                                      f.key,
                                      e.target.value
                                    )
                                  }
                                  className="px-3 py-2 rounded-lg text-black bg-white"
                                  placeholder={f.label}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Signal conditions */}
                          <div className="mt-4 bg-[rgba(255,255,255,0.03)] p-3 border border-[#005f73] rounded-lg">
                            <p className="text-sm font-medium text-white mb-2">
                              Signal Condition
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="flex flex-col">
                                <label className="text-sm text-gray-300 mb-1">
                                  Trend
                                </label>
                                <select
                                  value={ind.trend}
                                  onChange={(e) =>
                                    updateTrend(gi, ii, e.target.value)
                                  }
                                  className={selectClasses}
                                >
                                  {TREND_OPTIONS.map((t) => (
                                    <option
                                      key={t.value}
                                      value={t.value}
                                      className="text-white"
                                    >
                                      {t.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="flex flex-col">
                                <label className="text-sm text-gray-300 mb-1">
                                  Compare To
                                </label>
                                <select
                                  value={ind.compareTo}
                                  onChange={(e) =>
                                    updateCompareTo(gi, ii, e.target.value)
                                  }
                                  className={selectClasses}
                                >
                                  {COMPARE_TO_OPTIONS.map((c) => (
                                    <option
                                      key={c.value}
                                      value={c.value}
                                      className="text-white"
                                    >
                                      {c.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {ind.compareTo === 'constant' && (
                                <div className="flex flex-col">
                                  <label className="text-sm text-gray-300 mb-1">
                                    Constant Value
                                  </label>
                                  <input
                                    type="number"
                                    value={ind.compareValue ?? ''}
                                    onChange={(e) =>
                                      updateCompareValue(
                                        gi,
                                        ii,
                                        Number(e.target.value)
                                      )
                                    }
                                    className="px-3 py-2 rounded-lg text-black bg-white"
                                    placeholder="Enter value"
                                  />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* remove indicator */}
                          <div className="mt-3 flex justify-end">
                            {grp.indicators.length > 1 && (
                              <button
                                onClick={() => removeIndicator(gi, ii)}
                                className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
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
                      className="px-3 py-2 bg-white text-[#000814] rounded-full font-medium shadow-sm"
                    >
                      + Add indicator (AND)
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => removeGroup(gi)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white"
                    disabled={groups.length === 1}
                    title={
                      groups.length === 1 ? 'At least one group required' : 'Remove group'
                    }
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
            className="px-4 py-2 bg-white text-[#000814] rounded-full font-semibold shadow-md"
          >
            + Add Group (OR)
          </button>
        </div>

        {/* Expression preview */}
        <div className="mt-6 bg-[rgba(255,255,255,0.03)] p-4 border border-[#005f73] rounded-lg">
          <p className="text-sm text-gray-300 mb-2">Buy Expression (preview)</p>
          <pre className="text-white text-sm break-words">{buyExp || '—'}</pre>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={handleSaveProceed}
            className="px-6 py-3 bg-white text-[#000814] font-semibold rounded-full shadow-md"
          >
            Save & Proceed
          </button>
        </div>
      </div>
    </main>
  );
}
