import type { MannWhitneyResult } from "@/types/statistics";
import { displayNumber } from "@/lib/utils/format";
import { GroupDot } from "@/components/ui/primitives";

/**
 * Combined, sorted observations with their ranks and group membership.
 * On narrow screens the group column shows "A"/"B" instead of the full name,
 * so Score and Rank stay visible without sideways scrolling.
 */
export function RankingTable({ result }: { result: MannWhitneyResult }) {
  const names = { A: result.input.groupA.name, B: result.input.groupB.name };
  const cell = "px-2.5 py-2 sm:px-4";
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-sm">
        <caption className="sr-only">Combined observations sorted in ascending order with assigned ranks</caption>
        <thead className="bg-subtle text-left text-xs font-medium tracking-wide text-muted">
          <tr>
            <th scope="col" className={`${cell} py-2.5`}>
              <span className="sm:hidden">#</span>
              <span className="hidden sm:inline">Position</span>
            </th>
            <th scope="col" className={`${cell} py-2.5`}>
              <span className="sm:hidden">Obs.</span>
              <span className="hidden sm:inline">Observation</span>
            </th>
            <th scope="col" className={`${cell} py-2.5`}>Group</th>
            <th scope="col" className={`${cell} py-2.5 text-right`}>Score</th>
            <th scope="col" className={`${cell} py-2.5 text-right`}>Rank</th>
          </tr>
        </thead>
        <tbody>
          {result.ranking.sorted.map((o) => (
            <tr key={o.id} className={`border-t border-line ${o.tied ? "bg-warn-soft/60" : ""}`}>
              <td className={`${cell} font-mono text-muted tabular-nums`}>{o.sortedPosition}</td>
              <td className={`${cell} font-mono tabular-nums`}>{o.id}</td>
              <td className={cell}>
                <span className="flex items-center gap-2">
                  <GroupDot group={o.group} />
                  <span className="sm:hidden">{o.group}</span>
                  <span className="hidden truncate sm:inline">{names[o.group]}</span>
                </span>
              </td>
              <td className={`${cell} text-right font-mono tabular-nums`}>{displayNumber(o.value, 6)}</td>
              <td className={`${cell} text-right font-mono font-semibold whitespace-nowrap tabular-nums`}>
                {displayNumber(o.rank)}
                {o.tied && <span className="ml-1.5 text-xs font-normal text-warn">tied</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
