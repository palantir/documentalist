/**
 * Exported function.
 * @param first The number passed to the function.
 * @param second The string passed to the function.
 */
export function numberAndString(first: number, second: string) {
    return first + second;
}

/**
 * Non-exported function.
 * @param str The string parameter.
 * @param bool The boolean parameter.
 */
function stringAndBoolean(str: string, bool: boolean) {
    return str + bool;
}

// so tsc doesn't complain that the unexported function is never used.
export const MyFunc = stringAndBoolean;
