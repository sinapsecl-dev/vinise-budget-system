"use server";

export async function getCurrentUF(): Promise<number> {
    try {
        // mindicador.cl API provides the UF value.
        // We use Next.js fetch caching to avoid rate limits (429).
        // revalidate: 3600 caches the response for 1 hour.
        const res = await fetch("https://mindicador.cl/api/uf", {
            next: { revalidate: 3600 },
        });

        if (!res.ok) {
            console.error("Failed to fetch UF, status:", res.status);
            throw new Error("Failed to fetch UF");
        }

        const data = await res.json();

        if (data && data.serie && data.serie.length > 0) {
            // The first element in the 'serie' array is the most recent date
            return data.serie[0].valor;
        }

        throw new Error("Invalid UF payload");
    } catch (error) {
        console.error("Error fetching UF from mindicador.cl:", error);
        // Fallback value if API is down to not block the user entirely
        return 38500.00;
    }
}
