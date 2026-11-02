"use client";

import { useEffect, useRef } from "react";
import { Calculator, FlaskConical, RotateCcw } from "lucide-react";
import { useCalculator, type CalculatorState, type GroupKey } from "@/hooks/use-calculator";
import { Notice, buttonStyles } from "@/components/ui/primitives";
import { ResultsDashboard } from "@/components/results/results-dashboard";
import { SevenSteps } from "@/components/results/seven-steps";
import { GroupInputCard } from "./group-input-card";
import { TestConfigCard } from "./test-config-card";
import { clearAnalysis, loadAnalysis, saveAnalysis } from "@/lib/storage/analysis-storage";

export function CalculatorWorkspace({ initialState }: { initialState?: CalculatorState }) {
  const { state, dispatch, validation, isStale } = useCalculator(initialState);
  const resultsRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const lastResult = useRef(state.result);

  const restoring = useRef(false);

  // On first load, restore the last saved analysis (e.g. after leaving Presentation Mode).
  useEffect(() => {
    if (initialState) return;
    const saved = loadAnalysis();
    if (saved.status === "ok") {
      restoring.current = true;
      dispatch({ type: "restore", input: saved.analysis.input, config: saved.analysis.config });
    }
  }, [dispatch, initialState]);

  // After each successful calculation: save the inputs for Presentation Mode and show the results.
  useEffect(() => {
    if (state.result && state.result !== lastResult.current) {
      saveAnalysis(state.result.input, state.result.config);
      if (!restoring.current) {
        resultsRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
        resultsRef.current?.querySelector<HTMLElement>("#results-heading")?.focus({ preventScroll: true });
      }
      restoring.current = false;
    }
    lastResult.current = state.result;
  }, [state.result]);

  const onReset = () => {
    clearAnalysis();
    dispatch({ type: "reset" });
  };

  const showErrors = state.attempted;
  const blocked = !validation.success;
  const configErrors = validation.success ? {} : validation.configErrors;
  const formErrors = validation.success ? [] : validation.formErrors;
  const attemptFailed = state.attempted && blocked;

  const onCalculate = () => {
    dispatch({ type: "calculate" });
    if (blocked) requestAnimationFrame(() => errorRef.current?.focus());
  };

  const groupCard = (key: GroupKey, group: "A" | "B") => (
    <GroupInputCard
      group={group}
      label={`Group ${group}`}
      subscript={group === "A" ? "1" : "2"}
      values={state.groups[key]}
      validation={validation[key]}
      showFieldErrors={showErrors}
      onChange={(field, value) => dispatch({ type: "setGroupField", group: key, field, value })}
      onClear={() => dispatch({ type: "clearGroup", group: key })}
    />
  );

  return (
    <div className="space-y-10">
      <section aria-labelledby="input-heading" className="space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="input-heading" className="text-xl font-semibold text-ink">
              Data input
            </h2>
            <p className="mt-1 text-sm text-muted">Enter the scores of two independent groups.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => dispatch({ type: "loadSample" })} className={buttonStyles.secondary}>
              <FlaskConical className="h-4 w-4" aria-hidden />
              Load Sample Data
            </button>
            <button type="button" onClick={onReset} className={buttonStyles.secondary}>
              <RotateCcw className="h-4 w-4" aria-hidden />
              Reset
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {groupCard("groupA", "A")}
          {groupCard("groupB", "B")}
        </div>

        <TestConfigCard
          nameA={state.groups.groupA.name}
          nameB={state.groups.groupB.name}
          alphaChoice={state.alphaChoice}
          customAlpha={state.customAlpha}
          alphaError={state.alphaChoice === "custom" && (showErrors || state.customAlpha !== "") ? configErrors.alpha : undefined}
          alternative={state.alternative}
          method={state.method}
          continuityCorrection={state.continuityCorrection}
          onAlphaChoice={(value) => dispatch({ type: "setAlphaChoice", value })}
          onCustomAlpha={(value) => dispatch({ type: "setCustomAlpha", value })}
          onAlternative={(value) => dispatch({ type: "setAlternative", value })}
          onMethod={(value) => dispatch({ type: "setMethod", value })}
          onContinuityCorrection={(value) => dispatch({ type: "setContinuityCorrection", value })}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button type="button" onClick={onCalculate} className={`${buttonStyles.primary} px-6 py-3 text-[15px]`}>
            <Calculator className="h-4.5 w-4.5" aria-hidden />
            Calculate
          </button>
          <p className="text-sm text-muted">
            {validation.groupA.values.length} + {validation.groupB.values.length} valid observations
          </p>
        </div>

        {attemptFailed && (
          <div ref={errorRef} tabIndex={-1} className="focus:outline-none" data-testid="calculation-blocked">
            <Notice level="error">
              <p className="font-medium">The calculation was not run. Fix the highlighted fields and try again.</p>
              {formErrors.length > 0 && (
                <ul className="mt-1 list-disc pl-5">
                  {formErrors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              {configErrors.alpha && <p className="mt-1">Significance level: {configErrors.alpha}</p>}
            </Notice>
          </div>
        )}
      </section>

      {state.result ? (
        <div ref={resultsRef} className="scroll-mt-20 space-y-10">
          <ResultsDashboard result={state.result} isStale={isStale} />
          <SevenSteps result={state.result} />
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-line-strong bg-surface px-6 py-10 text-center">
          <p className="font-medium text-ink">No results yet</p>
          <p className="mt-1 text-sm text-muted">
            Enter data for both groups (or load the sample data) and press Calculate.
          </p>
        </div>
      )}
    </div>
  );
}
