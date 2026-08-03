declare global {
    interface Navigator {
        deviceMemory?: number
        // Network Information API — partiellement supporté (absent sur Safari)
        connection?: {
            saveData?: boolean
        }
    }
}

export {}
