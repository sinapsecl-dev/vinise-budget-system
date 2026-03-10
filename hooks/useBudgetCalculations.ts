import { useMemo } from "react";
import { BudgetState } from "@/contexts/BudgetEditorContext";

export interface BudgetCalculations {
    totalMaterialClp: number;
    totalHhClp: number;
    baseCostClp: number; // Material + HH
    totalMarginClp: number;
    subtotalNetoClp: number; // BaseCost + Margin + GG
    totalIvaClp: number;
    totalFinalClp: number;
    totalFinalUf: number;
    totalIvaInclusiveUf: number; // Alias for PDF compatibility
    partitionTotals: Record<string, PartitionTotal>;
    lineTotals: Record<string, { totalClp: number, totalUf: number }>;
    generalExpensesTotal: number;
}

export interface PartitionTotal {
    materialClp: number;
    hhClp: number;
    baseCostClp: number;
    marginClp: number;
    allocatedGeneralExpensesClp: number;
    subtotalClp: number;
}

export function useBudgetCalculations(state: BudgetState, currentUf: number): BudgetCalculations {
    return useMemo(() => {
        let totalMaterialClp = 0;
        let totalHhClp = 0;
        let totalMarginClp = 0;

        // 1. Calculate General Expenses Totals & Allocation Rules
        let generalExpensesTotal = 0;
        let generalExpensesToProrate = 0; // The ones allocated to 'A' (All)
        const specificExpenses: Record<string, number> = {}; // partition_id -> clp_value

        state.general_expenses.forEach((expense) => {
            const val = (expense.value_clp || 0) * (expense.quantity || 1);
            generalExpensesTotal += val;

            if (expense.allocation === 'A') {
                generalExpensesToProrate += val;
            } else {
                if (!specificExpenses[expense.allocation]) {
                    specificExpenses[expense.allocation] = 0;
                }
                specificExpenses[expense.allocation] += val;
            }
        });

        // 2. Calculate Base partition costs
        const partitionTotals: Record<string, PartitionTotal> = {};
        const lineTotals: Record<string, { totalClp: number, totalUf: number }> = {};
        let sumOfAllPartitionsBaseCost = 0;

        state.partitions.forEach((partition) => {
            const pid = partition.id as string;
            partitionTotals[pid] = {
                materialClp: 0,
                hhClp: 0,
                baseCostClp: 0,
                marginClp: 0,
                allocatedGeneralExpensesClp: specificExpenses[pid] || 0,
                subtotalClp: 0,
            };

            partition.lines.forEach((line) => {
                const qty = line.quantity || 0;
                const mat = (line.material_value_clp || 0) * qty;
                const hh = (line.hh_value_clp || 0) * qty;
                const lineBase = mat + hh;

                const marginPct = line.line_margin !== null && line.line_margin !== undefined
                    ? line.line_margin
                    : state.global_margin;

                const lineMargin = lineBase * marginPct;
                const lineFinalClp = lineBase + lineMargin; // Wait, actually we must apply prorated GG later, but for line level we just do base + margin
                // To be accurate with GG, lineTotal doesn't easily contain GG. So we just use base + margin for the item breakdown.
                
                lineTotals[line.id as string] = {
                    totalClp: lineFinalClp,
                    totalUf: currentUf > 0 ? (lineFinalClp / currentUf) : 0
                };

                partitionTotals[pid].materialClp += mat;
                partitionTotals[pid].hhClp += hh;
                partitionTotals[pid].baseCostClp += lineBase;
                partitionTotals[pid].marginClp += lineMargin;

                totalMaterialClp += mat;
                totalHhClp += hh;
                totalMarginClp += lineMargin;
            });

            sumOfAllPartitionsBaseCost += partitionTotals[pid].baseCostClp;
        });

        // 3. Prorate general expenses across partitions based on their weight relative to total base cost.
        // If sumOfAllPartitionsBaseCost is 0, we evenly divide or put to 0.
        state.partitions.forEach((partition) => {
            const pid = partition.id as string;
            if (sumOfAllPartitionsBaseCost > 0) {
                const weight = partitionTotals[pid].baseCostClp / sumOfAllPartitionsBaseCost;
                partitionTotals[pid].allocatedGeneralExpensesClp += (generalExpensesToProrate * weight);
            } else if (state.partitions.length > 0) {
                // If everything is 0, split evenly just to show something
                partitionTotals[pid].allocatedGeneralExpensesClp += (generalExpensesToProrate / state.partitions.length);
            }

            // Calculate final subtotal for partition
            partitionTotals[pid].subtotalClp =
                partitionTotals[pid].baseCostClp +
                partitionTotals[pid].marginClp +
                partitionTotals[pid].allocatedGeneralExpensesClp;
        });

        const baseCostClp = totalMaterialClp + totalHhClp;
        const subtotalNetoClp = baseCostClp + totalMarginClp + generalExpensesTotal;
        const totalIvaClp = subtotalNetoClp * 0.19;
        const totalFinalClp = Math.round(subtotalNetoClp + totalIvaClp);
        const totalFinalUf = currentUf > 0 ? (totalFinalClp / currentUf) : 0;
        const totalIvaInclusiveUf = totalFinalUf;

        return {
            totalMaterialClp,
            totalHhClp,
            baseCostClp,
            totalMarginClp,
            subtotalNetoClp,
            totalIvaClp,
            totalFinalClp,
            totalFinalUf,
            totalIvaInclusiveUf,
            partitionTotals,
            lineTotals,
            generalExpensesTotal
        };

    }, [state, currentUf]);
}
