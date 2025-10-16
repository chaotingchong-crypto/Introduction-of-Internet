import { Image } from 'expo-image';
import React, { useMemo, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import FormDashboard from './FormDashboard';
import TaipeiDashboard from "./TaipeiDashboard";

// === Inline helper: build a mini dashboard by index (e.g., index=traffic) ===
function DashboardIndexViewer({ baseUrl, city, dashIndex, limit = 4 }:{ baseUrl: string; city: string; dashIndex: string; limit?: number }) {
  const [componentIds, setComponentIds] = React.useState<number[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
    let cancelled = false;
    async function run(){
      setLoading(true); setError(''); setComponentIds([]);
      try {
        const url = `${baseUrl.replace(/\/+$/, '')}/api/v1/dashboard?city=${encodeURIComponent(city)}`;
        const res = await fetch(url);
        const data = await res.json();
        const group = data?.data?.[city];
        if (!Array.isArray(group)) throw new Error('Unexpected dashboard payload.');
        const entry = group.find((x: any) => x?.index === dashIndex);
        if (!entry) throw new Error(`Index "${dashIndex}" not found under city="${city}".`);
        const ids: number[] = Array.isArray(entry.components) ? entry.components : [];
        if (!cancelled) setComponentIds(ids.slice(0, Math.max(1, limit)));
      } catch (e:any) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [baseUrl, city, dashIndex, limit]);

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: '#111827' }}>Dashboard Index Viewer — city: {city}, index: {dashIndex}</div>
      {loading && <div style={{ opacity: 0.7, color: '#111827' }}>Loading…</div>}
      {error && <div style={{ color: '#f87171' }}>Error: {error}</div>}
      {!loading && !error && componentIds.length === 0 && (
        <div style={{ opacity: 0.7, color: '#111827' }}>No components found.</div>
      )}
      <div style={{ display: 'grid', gap: 12 }}>
        {componentIds.map((id) => (
          <div key={id} style={{ border: '1px solid #f87171', borderRadius: 12, padding: 12, backgroundColor: '#B3DDF2' }}>
            <div style={{ fontWeight: 600, marginBottom: 6, color: '#111827' }}>Component #{id}</div>
            <TaipeiDashboard apiUrl={`${baseUrl.replace(/\/+$/, '')}/api/v1/component/${id}/chart?city=${encodeURIComponent(city)}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeScreen() {
  // === Demo form state ===
  const [baseUrl, setBaseUrl] = useState<string>('http://localhost:4000');
  const [service, setService] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const [submittedUrl, setSubmittedUrl] = useState<string>(baseUrl);

  // === Dashboard builder form state ===
  const [dashCity, setDashCity] = useState<string>('taipei');
  const [dashIndex, setDashIndex] = useState<string>('traffic');
  const [dashLimit, setDashLimit] = useState<number>(4);
  const [dashBuildKey, setDashBuildKey] = useState<number>(0);

  const previewUrl = useMemo(() => {
    const s = service.trim().replace(/^\/+/, '').replace(/\/+$/, '');
    const q = query.trim().replace(/^\?+/, '');
    let url = baseUrl.trim().replace(/\/+$/, '');
    if (s) url += `/${s}`;
    if (q) url += `?${q}`;
    return url;
  }, [baseUrl, service, query]);

  function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setSubmittedUrl(previewUrl);
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#8DDFF9', dark: '#B3DDF2' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{ color: '#111827' }}>Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle" style={{ color: '#111827' }}>Taipei City Dashboard Example</ThemedText>
        <ThemedText style={{ color: '#111827' }}>
          Below is a live example of fetching data from Taipei City Dashboard API:
        </ThemedText>

        {/* 白底容器（表單 + Dashboard） */}
        <ThemedView style={{ ...styles.whiteCard, backgroundColor: '#B3DDF2', borderColor: '#f87171' }}>

          {/* === HTML/JS Form Request 教學區 === */}
          <div style={{ display: 'grid', gap: 12 }}>
            <div>
              <h3 style={{ marginBottom: 6, fontWeight: 600, fontSize: 16, color: '#111827' }}>Form Request (HTML + JS)</h3>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.8, color: '#111827' }}>
                1) 設定 <code>Base URL</code> →
                2) 選擇範例 API →
                3) Submit 後傳給 <code>TaipeiDashboard</code> 渲染結果。
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{
              display: 'grid',
              gap: 10,
              padding: 12,
              border: '1px solid #f87171',
              borderRadius: 12,
              background: '#DFF4FC'
            }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Base URL</span>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:4000/api/taipei"
                  style={{ ...inputStyle, backgroundColor: '#DFF4FC', border: '1px solid #f87171', color: '#111827' }}
                />
              </label>

              {/* === 快速選擇範例 API === */}
              <div style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>快速選擇 API 範例</span>
                <select
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "v1-dashboards-city") { setService("api/v1/dashboard"); setQuery("city=taipei"); }
                    else if (value === "v1-component-57") { setService("api/v1/component/57/chart"); setQuery("city=taipei"); }
                    else if (value === "v1-component-114") { setService("api/v1/component/114/chart"); setQuery("city=taipei"); }
                    else if (value === "v1-component-20") { setService("api/v1/component/20/chart"); setQuery("city=taipei"); }
                    else { setService(""); setQuery(""); }
                  }}
                  style={{ ...inputStyle, minWidth: 260, backgroundColor: '#DFF4FC', border: '1px solid #f87171', color: '#111827' }}
                >
                  <option value="">— 請選擇一個範例 —</option>
                  <option value="v1-dashboards-city">Dashboards 清單（/api/v1/dashboard?city=taipei）</option>
                  <option value="v1-component-57">交通元件資料（/api/v1/component/57/chart?city=taipei）</option>
                  <option value="v1-component-114">交通元件資料（/api/v1/component/114/chart?city=taipei）</option>
                  <option value="v1-component-20">交通元件資料（/api/v1/component/20/chart?city=taipei）</option>
                </select>
              </div>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Service path（可自行輸入）</span>
                <input
                  type="text"
                  value={service}
                  onChange={(e) => setService(e.target.value)}
                  placeholder="api/v1/dashboard 或 api/v1/component/57/chart"
                  style={{ ...inputStyle, backgroundColor: '#DFF4FC', border: '1px solid #f87171', color: '#111827' }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Query string（可自行輸入）</span>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="city=taipei"
                  style={{ ...inputStyle, backgroundColor: '#DFF4FC', border: '1px solid #f87171', color: '#111827' }}
                />
              </label>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap'
              }}>
                <div style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 12,
                  opacity: 0.8,
                  color: '#111827'
                }}>
                  Preview:&nbsp;<code style={{ color: '#f87171' }}>{previewUrl}</code>
                </div>
                <button type="submit" style={{ ...buttonStyle, backgroundColor: '#f87171', color: '#111827', borderColor: '#fff' }}>Submit & Load</button>
              </div>
            </form>
          </div>

          {/* Dashboard Index → Components */}
          <div style={{ marginTop: 16, padding: 12, border: '1px solid #f87171', borderRadius: 12, background: '#B3DDF2' }}>
            <h4 style={{ margin: 0, color: '#111827' }}>Dashboard Builder（index → components）</h4>
            <p style={{ margin: '6px 0 12px', opacity: 0.8, fontSize: 14, color: '#111827' }}>
              選擇 city 與 index，按 <b>Build</b> 後會抓取該 dashboard，並依序載入其 components 的資料。
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(160px, 1fr))', gap: 12 }}>
              <select value={dashCity} onChange={(e) => setDashCity(e.target.value)} style={{ ...inputStyle, backgroundColor: '#DFF4FC', border: '1px solid #f87171', color: '#111827' }}>
                <option value="taipei">taipei</option>
                <option value="metrotaipei">metrotaipei</option>
              </select>
              <select value={dashIndex} onChange={(e) => setDashIndex(e.target.value)} style={{ ...inputStyle, backgroundColor: '#DFF4FC', border: '1px solid #f87171', color: '#111827' }}>
                <option value="traffic">traffic</option>
                <option value="metro">metro</option>
                <option value="youbike">youbike</option>
                <option value="planning">planning</option>
                <option value="services">services</option>
                <option value="disaster-prevention">disaster-prevention</option>
                <option value="climate-change">climate-change</option>
              </select>
              <input type="number" min={1} max={12} value={dashLimit}
                onChange={(e) => setDashLimit(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
                style={{ ...inputStyle, backgroundColor: '#DFF4FC', border: '1px solid #f87171', color: '#111827' }}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <button type="button" style={{ ...buttonStyle, backgroundColor: '#f87171', color: '#111827', borderColor: '#fff' }} onClick={() => setDashBuildKey((k) => k + 1)}>Build</button>
            </div>
            {dashBuildKey > 0 && (
              <DashboardIndexViewer key={`${dashCity}-${dashIndex}-${dashBuildKey}`} baseUrl={baseUrl} city={dashCity} dashIndex={dashIndex} limit={dashLimit} />
            )}
          </div>

          {/* TaipeiDashboard + FormDashboard */}
          <div style={{ marginTop: 16 }}>
            <TaipeiDashboard apiUrl={submittedUrl} />
          </div>
          <div style={{ marginTop: 16 }}>
            <FormDashboard
              defaultUrl={submittedUrl}
              defaultMethod="GET"
              hint="這是可選的 Hint：同學可以改 method、Headers 和 Body，觀察 API 的不同回應。"
            />
          </div>
        </ThemedView>
      </ThemedView>

      {/* Step 1 / Step 2 / Step 3 教學 */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({ ios: 'cmd + d', android: 'cmd + m', web: 'F12' })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction title="Share" icon="square.and.arrow.up" onPress={() => alert('Share pressed')} />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction title="Delete" icon="trash" destructive onPress={() => alert('Delete pressed')} />
            </Link.Menu>
          </Link.Menu>
        </Link>
        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  fontSize: 14,
  outline: 'none',
};

const buttonStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 999,
  border: '1px solid',
  fontSize: 14,
  cursor: 'pointer',
};

const styles = StyleSheet.create({
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepContainer: { gap: 8, marginBottom: 8 },
  whiteCard: { marginTop: 12, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  reactLogo: { height: 178, width: 290, bottom: 0, left: 0, position: 'absolute' },
});
