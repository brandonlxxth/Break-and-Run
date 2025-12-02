package com.example.poolscoreboard.util

/**
 * Normalizes a name for storage and comparison:
 * - Converts to lowercase
 * - Trims whitespace from front and end
 */
fun normalizeName(name: String): String {
    return name.trim().lowercase()
}

/**
 * Formats a name for display:
 * - Capitalizes the first letter
 * - Preserves the rest of the name as-is
 */
fun formatNameForDisplay(name: String): String {
    val normalized = normalizeName(name)
    return if (normalized.isEmpty()) {
        name
    } else {
        normalized.first().uppercaseChar() + normalized.drop(1)
    }
}

