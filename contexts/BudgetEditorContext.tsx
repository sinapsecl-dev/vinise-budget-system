"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import { SaveBudgetValues, BudgetPartitionValues, BudgetLineValues, BudgetGeneralExpenseValues } from "@/lib/validations/budgets";

// Using the Zod inferred types to shape our exact state.
// State represents the entire editable tree
export interface BudgetState extends SaveBudgetValues {
    hasUnsavedChanges: boolean;
    status: string;
}

// Action Types
type Action =
    | { type: "SET_INITIAL_STATE"; payload: Partial<SaveBudgetValues> }
    | { type: "UPDATE_ROOT_FIELD"; field: keyof BudgetState; value: any }
    | { type: "ADD_PARTITION"; name: string }
    | { type: "REMOVE_PARTITION"; partition_id: string }
    | { type: "UPDATE_PARTITION_NAME"; partition_id: string; name: string }
    | { type: "ADD_LINE"; partition_id: string; item: any } // item is CatalogItem from Palette
    | { type: "REMOVE_LINE"; partition_id: string; line_id: string }
    | { type: "UPDATE_LINE"; partition_id: string; line_id: string; field: keyof BudgetLineValues; value: any }
    | { type: "ADD_GENERAL_EXPENSE" }
    | { type: "REMOVE_GENERAL_EXPENSE"; expense_id: string }
    | { type: "UPDATE_GENERAL_EXPENSE"; expense_id: string; field: keyof BudgetGeneralExpenseValues; value: any }
    | { type: "MARK_SAVED" }
    | { type: "MARK_UNSAVED" }
    | { type: "TOGGLE_AWARD_PARTITION"; partition_id: string };

// Initial State Factory
const defaultState: BudgetState = {
    project_name: "",
    project_location: "",
    client_id: null,
    global_margin: 0.20,
    considerations: "",
    proposal_duration: "30 días",
    partitions: [],
    general_expenses: [],
    hasUnsavedChanges: false,
    status: "draft",
};

// Reducer Function
function budgetReducer(state: BudgetState, action: Action): BudgetState {
    let newState = { ...state };

    switch (action.type) {
        case "SET_INITIAL_STATE":
            return { ...defaultState, ...action.payload, hasUnsavedChanges: false };

        case "UPDATE_ROOT_FIELD":
            newState = { ...state, [action.field]: action.value };
            break;

        case "ADD_PARTITION": {
            const newPart: BudgetPartitionValues = {
                id: uuidv4(),
                number: state.partitions.length + 1,
                name: action.name,
                sort_order: state.partitions.length,
                is_awarded: false,
                lines: [],
            };
            newState.partitions = [...state.partitions, newPart];
            break;
        }

        case "REMOVE_PARTITION": {
            newState.partitions = state.partitions.filter(p => p.id !== action.partition_id);
            // Re-number partitions
            newState.partitions.forEach((p, idx) => {
                p.number = idx + 1;
                p.sort_order = idx;
            });
            break;
        }

        case "UPDATE_PARTITION_NAME": {
            newState.partitions = state.partitions.map(p =>
                p.id === action.partition_id ? { ...p, name: action.name } : p
            );
            break;
        }

        case "TOGGLE_AWARD_PARTITION": {
            newState.partitions = state.partitions.map(p =>
                p.id === action.partition_id ? { ...p, is_awarded: !p.is_awarded } : p
            );
            newState.hasUnsavedChanges = true;
            break;
        }

        case "ADD_LINE": {
            // Find partition
            newState.partitions = state.partitions.map(p => {
                if (p.id === action.partition_id) {
                    const newLine: BudgetLineValues = {
                        id: uuidv4(),
                        item_id: action.item.id,
                        custom_description: action.item.description,
                        quantity: 1, // Default quantity
                        unit: action.item.unit || "CU",
                        material_value_clp: action.item.material_value_clp || 0,
                        hh_value_clp: action.item.hh_value_clp || 0,
                        line_margin: null, // null = inherit global margin; set a number to override per-line
                        sort_order: p.lines.length,
                    };
                    return { ...p, lines: [...p.lines, newLine] };
                }
                return p;
            });
            break;
        }

        case "REMOVE_LINE": {
            newState.partitions = state.partitions.map(p => {
                if (p.id === action.partition_id) {
                    return { ...p, lines: p.lines.filter(l => l.id !== action.line_id) };
                }
                return p;
            });
            break;
        }

        case "UPDATE_LINE": {
            newState.partitions = state.partitions.map(p => {
                if (p.id === action.partition_id) {
                    return {
                        ...p,
                        lines: p.lines.map(l =>
                            l.id === action.line_id ? { ...l, [action.field]: action.value } : l
                        )
                    };
                }
                return p;
            });
            break;
        }

        case "ADD_GENERAL_EXPENSE": {
            const newExpense: BudgetGeneralExpenseValues = {
                id: uuidv4(),
                name: "Nuevo Gasto General",
                value_clp: 0,
                quantity: 1,
                allocation: "A", // Allocates to all partitions by default
                sort_order: state.general_expenses.length,
            };
            newState.general_expenses = [...state.general_expenses, newExpense];
            break;
        }

        case "REMOVE_GENERAL_EXPENSE": {
            newState.general_expenses = state.general_expenses.filter(e => e.id !== action.expense_id);
            break;
        }

        case "UPDATE_GENERAL_EXPENSE": {
            newState.general_expenses = state.general_expenses.map(e =>
                e.id === action.expense_id ? { ...e, [action.field]: action.value } : e
            );
            break;
        }

        case "MARK_SAVED":
            return { ...state, hasUnsavedChanges: false };

        case "MARK_UNSAVED":
            return { ...state, hasUnsavedChanges: true };

        default:
            return state;
    }

    // Any action other than initial or saved marks state as unsaved
    // (Notice how SET_INITIAL_STATE and MARK_SAVED already return from the switch)
    newState.hasUnsavedChanges = true;

    return newState;
}

// Context
const BudgetEditorContext = createContext<{
    state: BudgetState;
    dispatch: React.Dispatch<Action>;
} | null>(null);

export function BudgetEditorProvider({ children, initialState }: { children: ReactNode, initialState?: Partial<SaveBudgetValues> }) {
    const [state, dispatch] = useReducer(budgetReducer, { ...defaultState, ...initialState });

    return (
        <BudgetEditorContext.Provider value={{ state, dispatch }}>
            {children}
        </BudgetEditorContext.Provider>
    );
}

export function useBudgetEditor() {
    const context = useContext(BudgetEditorContext);
    if (!context) {
        throw new Error("useBudgetEditor must be used within a BudgetEditorProvider");
    }
    return context;
}
