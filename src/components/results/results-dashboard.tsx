import Link from "next/link";
import { CheckCircle2, CircleSlash, MonitorPlay } from "lucide-react";
import type { CriticalValueResult, MannWhitneyResult } from "@/types/statistics";
import { displayNumber, formatAlpha, formatFixed, formatPValue, typographicMinus, withMinus } from "@/lib/utils/format";
import { alternativeLabel, methodDescription, methodName } from "@/lib/utils/result-labels";
import { Card, CardHeader, Notice, StatTile, buttonStyles } from "@/components/ui/primitives";

function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-line py-3 last:border-b-0 sm:grid-cols-[minmax(0,11rem)_1fr] sm:gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="min-w-0 text-sm text-ink">{children}</dd>
    </div>
  );
}

function CriticalValueText({ cv }: { cv: CriticalValueResult }) {
  if (!cv.available) return <span className="text-muted">{cv.message}</span>;
  return (
    <span>
      <span className="font-mono font-semibold tabular-nums">{displayNumber(cv.value)}</span>
      <span className="text-muted"> · {cv.rule}</span>
    </span>
  );
}

export function DecisionBanner({ result }: { result: MannWhitneyResult }) {
  const { decision, pValue, config } = result;
  const reject = decision === "reject";
  const Icon = reject ? CheckCircle2 : CircleSlash;
  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
        reject ? "border-accent-line bg-accent-soft" : "border-line-strong bg-subtle"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className={`h-6 w-6 shrink-0 ${reject ? "text-accent" : "text-ink-soft"}`} aria-hidden />
        <div>
          <p className="text-xs font-medium tracking-wide text-muted uppercase">Statistical decision</p>
          <p className={`text-xl font-semibold ${reject ? "text-accent" : "text-ink"}`} data-testid="decision">
            {result.interpretation.decisionStatement}
          </p>
        </div>
      </div>
      {pValue !== null && (
        <p className="font-mono text-[15px] text-ink-soft tabular-nums">
          p = {formatPValue(pValue)} {reject ? "≤" : ">"} α = {formatAlpha(config.alpha)}
        </p>
      )}
    </div>
  );
}

export function ResultsDashboard({ result, isStale }: { result: MannWhitneyResult; isStale: boolean }) {
  const { u, config, effectSizes, asymptotic } = result;
  const nameA = result.input.groupA.name;
  const nameB = result.input.groupB.name;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="results-heading" tabIndex={-1} className="text-xl font-semibold text-ink focus:outline-none">
            Results
          </h2>
          <p className="mt-1 text-sm text-muted">
            {methodDescription(result)} · {alternativeLabel(config.alternative)} · α = {formatAlpha(config.alpha)}
          </p>
        </div>
        <Link href="/presentation" className={buttonStyles.primary}>
          <MonitorPlay className="h-4 w-4" aria-hidden />
          Start Presentation
        </Link>
      </div>

      {isStale && (
        <Notice level="warning">
          The inputs or settings have changed since this calculation. Press <strong>Calculate</strong> to update the
          results. Until then, Presentation Mode shows the last calculated analysis.
        </Notice>
      )}

      <DecisionBanner result={result} />

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Summary statistics">
        <StatTile label={<>n₁ · {nameA}</>} value={u.n1} />
        <StatTile label={<>n₂ · {nameB}</>} value={u.n2} />
        <StatTile label="R₁ (rank sum A)" value={displayNumber(u.R1)} />
        <StatTile label="R₂ (rank sum B)" value={displayNumber(u.R2)} />
        <StatTile label="U₁ (U for Group A)" value={displayNumber(u.U1)} />
        <StatTile label="U₂ (U for Group B)" value={displayNumber(u.U2)} />
        <StatTile label="U (smaller U)" value={displayNumber(u.U)} emphasis />
        <StatTile
          label="p-value"
          value={result.pValue === null ? "—" : formatPValue(result.pValue)}
          hint={result.methodUsed ? methodName(result.methodUsed) : "Not computable"}
          emphasis
        />
      </dl>

      {result.notices.length > 0 && (
        <div className="space-y-2">
          {result.notices.map((n) => (
            <Notice key={n.message} level={n.level}>
              {n.message}
            </Notice>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3" aria-labelledby="decision-panel-title">
          <CardHeader id="decision-panel-title" title="Decision summary" />
          <dl className="px-5 py-1">
            <Row label="Significance level">α = {formatAlpha(config.alpha)}</Row>
            <Row label="P-value">
              <span className="font-mono font-semibold tabular-nums">
                {result.pValue === null ? "Not computable" : formatPValue(result.pValue)}
              </span>
              <span className="text-muted"> · {methodDescription(result)}</span>
            </Row>
            {result.secondaryPValue && (
              <Row label="Other method">
                <span className="font-mono tabular-nums">{formatPValue(result.secondaryPValue.value)}</span>
                <span className="text-muted"> · {methodName(result.secondaryPValue.method)} (for comparison)</span>
              </Row>
            )}
            <Row label={result.ranking.hasTies ? "Critical value (tie-aware)" : "Critical value"}>
              <CriticalValueText cv={result.criticalValue} />
            </Row>
            {result.ranking.hasTies && (
              <Row label="Conventional table value">
                <CriticalValueText cv={result.conventionalCriticalValue} />
                <span className="mt-1 block text-xs text-warn">
                  Reference only: conventional tables assume no ties, and this dataset contains ties.
                </span>
              </Row>
            )}
            <Row label="Decision">
              <span className="font-semibold">{result.interpretation.decisionStatement}</span>
              <span className="mt-0.5 block text-ink-soft">{typographicMinus(result.interpretation.decisionExplanation)}</span>
            </Row>
            <Row label="Interpretation">{typographicMinus(result.interpretation.directionStatement)}</Row>
          </dl>
        </Card>

        <Card className="lg:col-span-2" aria-labelledby="effect-size-title">
          <CardHeader id="effect-size-title" title="Effect sizes" />
          <dl className="px-5 py-1">
            <Row label="Rank-biserial">
              <span className="font-mono font-semibold tabular-nums">
                {withMinus(formatFixed(effectSizes.rankBiserial, 3))}
              </span>
              <span className="text-muted"> · {effectSizes.rankBiserialMagnitude}</span>
              <span className="mt-1 block font-mono text-xs text-muted">(U₁ − U₂) / (n₁·n₂)</span>
            </Row>
            <Row label="r = z / √N">
              {effectSizes.r === null ? (
                <span className="text-muted">Not computable (zero variance)</span>
              ) : (
                <>
                  <span className="font-mono font-semibold tabular-nums">{withMinus(formatFixed(effectSizes.r, 3))}</span>
                  <span className="text-muted"> · {effectSizes.rMagnitude}</span>
                  {asymptotic.computable && (
                    <span className="mt-1 block font-mono text-xs text-muted">
                      z = {withMinus(formatFixed(asymptotic.zUncorrected, 4))} (uncorrected), N = {u.N}
                    </span>
                  )}
                </>
              )}
            </Row>
          </dl>
          <p className="border-t border-line px-5 py-3 text-xs leading-relaxed text-muted">
            Positive values mean {nameA} tends to score higher; negative values mean {nameB} tends to score higher.
            Magnitudes use Cohen&apos;s thresholds (0.1 / 0.3 / 0.5). Effect sizes describe this sample, not cause and
            effect.
          </p>
        </Card>
      </div>
    </div>
  );
}
