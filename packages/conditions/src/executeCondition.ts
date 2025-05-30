import { isDefined, isNotDefined } from "@typebot.io/lib/utils";
import type { SessionStore } from "@typebot.io/runtime-session-store";
import { findUniqueVariable } from "@typebot.io/variables/findUniqueVariable";
import { parseVariables } from "@typebot.io/variables/parseVariables";
import type { Variable } from "@typebot.io/variables/schemas";
import { ComparisonOperators, LogicalOperator } from "./constants";
import type { Comparison, Condition } from "./schemas";

export const executeCondition = (
  condition: Condition,
  {
    sessionStore,
    variables,
  }: { sessionStore: SessionStore; variables: Variable[] },
): boolean => {
  if (!condition.comparisons || condition.comparisons.length === 0)
    return false;
  return (condition.logicalOperator ?? LogicalOperator.AND) ===
    LogicalOperator.AND
    ? condition.comparisons.every((comparison) =>
        executeComparison(comparison, { variables, sessionStore }),
      )
    : condition.comparisons.some((comparison) =>
        executeComparison(comparison, { variables, sessionStore }),
      );
};

const executeComparison = (
  comparison: Comparison,
  {
    sessionStore,
    variables,
  }: { sessionStore: SessionStore; variables: Variable[] },
): boolean => {
  if (!comparison?.variableId) return false;
  const inputValue =
    variables.find((v) => v.id === comparison.variableId)?.value ?? null;
  const value =
    comparison.value === "undefined" || comparison.value === "null"
      ? null
      : (findUniqueVariable(variables)(comparison.value)?.value ??
        parseVariables(comparison.value, {
          variables,
          sessionStore,
        }));
  if (isNotDefined(comparison.comparisonOperator)) return false;
  switch (comparison.comparisonOperator) {
    case ComparisonOperators.CONTAINS: {
      if (Array.isArray(inputValue)) {
        const equal = (a: string | null, b: string | null) => {
          if (typeof a === "string" && typeof b === "string")
            return a.normalize() === b.normalize();
          return a !== b;
        };
        return compare(equal, inputValue, value, "some");
      }
      const contains = (a: string | null, b: string | null) => {
        if (b === "" || !b || !a) return false;
        return a
          .toLowerCase()
          .trim()
          .normalize()
          .includes(b.toLowerCase().trim().normalize());
      };
      return compare(contains, inputValue, value, "some");
    }
    case ComparisonOperators.NOT_CONTAINS: {
      if (Array.isArray(inputValue)) {
        const notEqual = (a: string | null, b: string | null) => {
          if (typeof a === "string" && typeof b === "string")
            return a.normalize() !== b.normalize();
          return a !== b;
        };
        return compare(notEqual, inputValue, value);
      }
      const notContains = (a: string | null, b: string | null) => {
        if (b === "" || !b || !a) return true;
        return !a
          .toLowerCase()
          .trim()
          .normalize()
          .includes(b.toLowerCase().trim().normalize());
      };
      return compare(notContains, inputValue, value);
    }
    case ComparisonOperators.EQUAL: {
      return compare(
        (a, b) => {
          if (typeof a === "string" && typeof b === "string")
            return a.normalize() === b.normalize();
          return a === b;
        },
        inputValue,
        value,
      );
    }
    case ComparisonOperators.NOT_EQUAL: {
      return compare(
        (a, b) => {
          if (typeof a === "string" && typeof b === "string")
            return a.normalize() !== b.normalize();
          return a !== b;
        },
        inputValue,
        value,
      );
    }
    case ComparisonOperators.GREATER: {
      if (isNotDefined(inputValue) || isNotDefined(value)) return false;
      if (typeof inputValue === "string") {
        if (typeof value === "string")
          return parseDateOrNumber(inputValue) > parseDateOrNumber(value);
        return Number(inputValue) > value.length;
      }
      if (typeof value === "string") return inputValue.length > Number(value);
      return inputValue.length > value.length;
    }
    case ComparisonOperators.LESS: {
      if (isNotDefined(inputValue) || isNotDefined(value)) return false;
      if (typeof inputValue === "string") {
        if (typeof value === "string")
          return parseDateOrNumber(inputValue) < parseDateOrNumber(value);
        return Number(inputValue) < value.length;
      }
      if (typeof value === "string") return inputValue.length < Number(value);
      return inputValue.length < value.length;
    }
    case ComparisonOperators.GREATER_OR_EQUAL: {
      if (isNotDefined(inputValue) || isNotDefined(value)) return false;
      if (typeof inputValue === "string") {
        if (typeof value === "string")
          return parseDateOrNumber(inputValue) >= parseDateOrNumber(value);
        return Number(inputValue) >= value.length;
      }
      if (typeof value === "string") return inputValue.length >= Number(value);
      return inputValue.length >= value.length;
    }
    case ComparisonOperators.LESS_OR_EQUAL: {
      if (isNotDefined(inputValue) || isNotDefined(value)) return false;
      if (typeof inputValue === "string") {
        if (typeof value === "string")
          return parseDateOrNumber(inputValue) <= parseDateOrNumber(value);
        return Number(inputValue) <= value.length;
      }
      if (typeof value === "string") return inputValue.length <= Number(value);
      return inputValue.length <= value.length;
    }
    case ComparisonOperators.IS_SET: {
      return isDefined(inputValue) && inputValue.length > 0;
    }
    case ComparisonOperators.IS_EMPTY: {
      return isNotDefined(inputValue) || inputValue.length === 0;
    }
    case ComparisonOperators.STARTS_WITH: {
      const startsWith = (a: string | null, b: string | null) => {
        if (b === "" || !b || !a) return false;
        return a
          .toLowerCase()
          .trim()
          .normalize()
          .startsWith(b.toLowerCase().trim().normalize());
      };
      return compare(startsWith, inputValue, value);
    }
    case ComparisonOperators.ENDS_WITH: {
      const endsWith = (a: string | null, b: string | null) => {
        if (b === "" || !b || !a) return false;
        return a
          .toLowerCase()
          .trim()
          .normalize()
          .endsWith(b.toLowerCase().trim().normalize());
      };
      return compare(endsWith, inputValue, value);
    }
    case ComparisonOperators.MATCHES_REGEX: {
      const matchesRegex = (a: string | null, b: string | null) => {
        if (b === "" || !b || !a) return false;
        const regex = preprocessRegex(b);
        if (!regex.pattern) return false;
        return new RegExp(regex.pattern, regex.flags).test(a);
      };
      return compare(matchesRegex, inputValue, value, "some");
    }
    case ComparisonOperators.NOT_MATCH_REGEX: {
      const matchesRegex = (a: string | null, b: string | null) => {
        if (b === "" || !b || !a) return false;
        const regex = preprocessRegex(b);
        if (!regex.pattern) return true;
        return !new RegExp(regex.pattern, regex.flags).test(a);
      };
      return compare(matchesRegex, inputValue, value);
    }
  }
};

const compare = (
  compareStrings: (a: string | null, b: string | null) => boolean,
  a: Exclude<Variable["value"], undefined>,
  b: Exclude<Variable["value"], undefined>,
  type: "every" | "some" = "every",
): boolean => {
  if (!a || typeof a === "string") {
    if (!b || typeof b === "string") return compareStrings(a, b);
    return type === "every"
      ? b.every((b) => compareStrings(a, b))
      : b.some((b) => compareStrings(a, b));
  }
  if (!b || typeof b === "string") {
    return type === "every"
      ? a.every((a) => compareStrings(a, b))
      : a.some((a) => compareStrings(a, b));
  }
  if (type === "every")
    return a.every((a) => b.every((b) => compareStrings(a, b)));
  return a.some((a) => b.some((b) => compareStrings(a, b)));
};

const parseDateOrNumber = (value: string): number => {
  const parsed = Number(value);
  if (isNaN(parsed)) {
    const time = Date.parse(value);
    return time;
  }
  return parsed;
};

const preprocessRegex = (regex: string) => {
  const regexWithFlags = regex.match(/\/(.+)\/([gimuy]*)$/);

  if (regexWithFlags)
    return { pattern: regexWithFlags[1], flags: regexWithFlags[2] };

  return { pattern: regex };
};
